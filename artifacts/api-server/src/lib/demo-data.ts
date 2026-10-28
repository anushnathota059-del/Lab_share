import { inArray } from "drizzle-orm";
import { db, bookingsTable, equipmentTable } from "@workspace/db";

let initialization: Promise<void> | null = null;

async function seedDemoData(): Promise<void> {
  await db
    .insert(equipmentTable)
    .values([
      {
        name: "Arduino Starter Kit",
        category: "Microcontrollers",
        description:
          "A complete Arduino Uno kit for prototyping interactive electronics, including a breadboard, jumper wires, LEDs, and common components.",
        location: "Engineering Hall · Lab 204",
        availability: "available",
        imageUrl: "",
        rules: [
          "Return every component to its labeled compartment.",
          "Use the USB power limit; no external power supplies without staff approval.",
          "Keep food and drinks outside the lab.",
        ],
        eligibility: [
          "Currently enrolled student",
          "Complete the Intro to Electronics lab safety briefing",
        ],
      },
      {
        name: "Digital Multimeter",
        category: "Test equipment",
        description:
          "A reliable handheld multimeter for measuring voltage, resistance, and continuity during circuit troubleshooting.",
        location: "Engineering Hall · Checkout Desk",
        availability: "available",
        imageUrl: "",
        rules: [
          "Inspect leads before use and report damage.",
          "Return leads with the meter and switch it off.",
          "Do not measure current on a live high-voltage circuit.",
        ],
        eligibility: [
          "Currently enrolled student",
          "Complete the Intro to Electronics lab safety briefing",
        ],
      },
      {
        name: "Oscilloscope",
        category: "Test equipment",
        description:
          "A two-channel digital oscilloscope for observing waveform shape, frequency, and signal behavior in student projects.",
        location: "Engineering Hall · Lab 210",
        availability: "limited",
        imageUrl: "",
        rules: [
          "Reserve a supervised bench before pickup.",
          "Use only the provided probes and ground clips.",
          "Ask a lab assistant before testing circuits above 30 V.",
        ],
        eligibility: [
          "Currently enrolled student",
          "Complete the Intro to Electronics lab safety briefing",
          "Prior oscilloscope orientation",
        ],
      },
      {
        name: "Sensor Exploration Kit",
        category: "Sensors",
        description:
          "A collection of temperature, light, motion, and distance sensors for microcontroller-based experiments.",
        location: "Engineering Hall · Lab 204",
        availability: "available",
        imageUrl: "",
        rules: [
          "Count the sensor modules before returning the kit.",
          "Handle pins carefully and store each module in its antistatic pouch.",
          "Document any damaged components at checkout.",
        ],
        eligibility: [
          "Currently enrolled student",
          "Complete the Intro to Electronics lab safety briefing",
        ],
      },
    ])
    .onConflictDoNothing({ target: equipmentTable.name });

  const equipment = await db
    .select({ id: equipmentTable.id, name: equipmentTable.name })
    .from(equipmentTable);
  const equipmentIds = new Map(equipment.map((item) => [item.name, item.id]));

  const examples = [
    {
      demoKey: "labshare-demo-pending",
      equipmentName: "Arduino Starter Kit",
      studentName: "Alex Morgan",
      studentEmail: "alex.morgan@northstar.edu",
      projectPurpose:
        "Build and test a light-sensitive desk lamp prototype for ECE 101.",
      requestedDate: "2026-10-30",
      requestedTime: "10:00 AM – 12:00 PM",
      status: "pending",
    },
    {
      demoKey: "labshare-demo-approved",
      equipmentName: "Digital Multimeter",
      studentName: "Alex Morgan",
      studentEmail: "alex.morgan@northstar.edu",
      projectPurpose:
        "Measure output voltage for my ECE 201 sensor calibration assignment.",
      requestedDate: "2026-10-29",
      requestedTime: "1:30 PM – 2:30 PM",
      status: "approved",
    },
    {
      demoKey: "labshare-demo-rejected",
      equipmentName: "Oscilloscope",
      studentName: "Alex Morgan",
      studentEmail: "alex.morgan@northstar.edu",
      projectPurpose:
        "Capture a PWM signal for the embedded systems lab report.",
      requestedDate: "2026-10-27",
      requestedTime: "3:00 PM – 4:00 PM",
      status: "rejected",
    },
    {
      demoKey: "labshare-demo-waitlisted",
      equipmentName: "Sensor Exploration Kit",
      studentName: "Alex Morgan",
      studentEmail: "alex.morgan@northstar.edu",
      projectPurpose:
        "Compare ultrasonic and infrared distance sensor readings for a robotics build.",
      requestedDate: "2026-10-31",
      requestedTime: "11:00 AM – 1:00 PM",
      status: "waitlisted",
    },
  ] as const;

  const bookings = examples.flatMap(({ equipmentName, ...example }) => {
    const equipmentId = equipmentIds.get(equipmentName);
    return equipmentId ? [{ ...example, equipmentId }] : [];
  });

  const existing = await db
    .select({ demoKey: bookingsTable.demoKey })
    .from(bookingsTable)
    .where(inArray(bookingsTable.demoKey, examples.map((example) => example.demoKey)));
  const existingKeys = new Set(existing.map((booking) => booking.demoKey));
  const missingBookings = bookings.filter(
    (booking) => !existingKeys.has(booking.demoKey),
  );

  if (missingBookings.length > 0) {
    await db.insert(bookingsTable).values(missingBookings);
  }
}

export function ensureDemoData(): Promise<void> {
  if (!initialization) {
    initialization = seedDemoData().catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  }

  return initialization;
}
