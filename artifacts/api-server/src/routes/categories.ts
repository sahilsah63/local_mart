import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /categories
router.get("/", async (req, res) => {
  try {
    const { type } = req.query as Record<string, string>;
    const cats = await db.select().from(categoriesTable)
      .where(type ? eq(categoriesTable.type, type) : undefined)
      .orderBy(categoriesTable.name);
    res.json(cats.map(c => ({ ...c, icon: c.icon ?? undefined })));
  } catch (err) {
    req.log.error({ err }, "List categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /categories
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, icon, type } = req.body;
    const [cat] = await db.insert(categoriesTable).values({ name, icon, type }).returning();
    res.status(201).json({ ...cat, icon: cat.icon ?? undefined });
  } catch (err) {
    req.log.error({ err }, "Create category error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
