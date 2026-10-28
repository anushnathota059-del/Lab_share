import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetEquipmentParams,
  GetEquipmentResponse,
  ListEquipmentResponse,
} from "@workspace/api-zod";
import { db, equipmentTable } from "@workspace/db";
import { ensureDemoData } from "../lib/demo-data";

const router: IRouter = Router();

router.get("/equipment", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const equipment = await db.select().from(equipmentTable).orderBy(equipmentTable.id);
  res.json(ListEquipmentResponse.parse(equipment));
});

router.get("/equipment/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = GetEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [equipment] = await db
    .select()
    .from(equipmentTable)
    .where(eq(equipmentTable.id, params.data.id));

  if (!equipment) {
    res.status(404).json({ error: "Equipment not found" });
    return;
  }

  res.json(GetEquipmentResponse.parse(equipment));
});

export default router;
