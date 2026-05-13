import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /services
router.get("/", async (req, res) => {
  try {
    const { technicianId, category } = req.query as Record<string, string>;
    let all = await db.select().from(servicesTable).where(eq(servicesTable.isActive, true));
    if (technicianId) all = all.filter(s => s.technicianId === parseInt(technicianId));
    if (category) all = all.filter(s => s.category === category);
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "List services error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /services
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { technicianId, name, description, price, category, durationMinutes } = req.body;
    const [service] = await db.insert(servicesTable).values({
      technicianId: parseInt(technicianId), name, description,
      price: parseFloat(price), category,
      durationMinutes: parseInt(durationMinutes) || 60,
    }).returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "Create service error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /services/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, category, durationMinutes, isActive } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (durationMinutes !== undefined) updates.durationMinutes = parseInt(durationMinutes);
    if (isActive !== undefined) updates.isActive = isActive;
    const [service] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
    if (!service) { res.status(404).json({ error: "Service not found" }); return; }
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "Update service error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /services/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    res.json({ message: "Service deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete service error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
