import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  CreateBookingBody,
  CreateBookingResponse,
  ListBookingsResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";
import { bookingsTable, db, equipmentTable } from "@workspace/db";
import { ensureDemoData } from "../lib/demo-data";

const router: IRouter = Router();

router.get("/bookings", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db
    .select({ booking: bookingsTable, equipmentName: equipmentTable.name })
    .from(bookingsTable)
    .innerJoin(equipmentTable, eq(bookingsTable.equipmentId, equipmentTable.id))
    .orderBy(desc(bookingsTable.createdAt));

  const bookings = rows.map(({ booking, equipmentName }) => ({
    ...booking,
    equipmentName,
    createdAt: booking.createdAt.toISOString(),
  }));

  res.json(ListBookingsResponse.parse(bookings));
});

router.post("/bookings", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [equipment] = await db
    .select()
    .from(equipmentTable)
    .where(eq(equipmentTable.id, parsed.data.equipmentId));

  if (!equipment) {
    res.status(400).json({ error: "Selected equipment does not exist" });
    return;
  }

  if (equipment.availability === "unavailable") {
    res.status(400).json({ error: "This equipment is currently unavailable" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      ...parsed.data,
      requestedDate: parsed.data.requestedDate.toISOString().slice(0, 10),
    })
    .returning();

  res.status(201).json(
    CreateBookingResponse.parse({
      ...booking,
      equipmentName: equipment.name,
      createdAt: booking.createdAt.toISOString(),
    }),
  );
});

router.patch("/bookings/:id/status", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = UpdateBookingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking request not found" });
    return;
  }

  const [equipment] = await db
    .select({ name: equipmentTable.name })
    .from(equipmentTable)
    .where(eq(equipmentTable.id, booking.equipmentId));

  res.json(
    UpdateBookingStatusResponse.parse({
      ...booking,
      equipmentName: equipment?.name ?? "Unknown equipment",
      createdAt: booking.createdAt.toISOString(),
    }),
  );
});

export default router;
