import { Router } from "express";
import { db, techniciansTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";

const router = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTech(t: any) {
  return { ...t, skills: t.skills ?? [] };
}

// GET /technicians
router.get("/", async (req, res) => {
  try {
    const { lat, lng, radius = "50", skill, search, available, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let all = await db.select().from(techniciansTable).where(eq(techniciansTable.isActive, true));

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      all = all.filter(t =>
        t.lat != null && t.lng != null &&
        haversineKm(userLat, userLng, t.lat, t.lng) <= radiusKm
      );
    }

    if (skill) {
      all = all.filter(t => t.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())));
    }

    if (search) {
      const q = search.toLowerCase();
      all = all.filter(t => t.name.toLowerCase().includes(q) || (t.bio ?? "").toLowerCase().includes(q));
    }

    if (available === "true") {
      all = all.filter(t => t.isAvailable);
    }

    const total = all.length;
    const paged = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ technicians: paged.map(formatTech), total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "List technicians error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /technicians
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { bio, skills, experienceYears, hourlyRate, serviceRadius, lat, lng } = req.body;
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    const [tech] = await db.insert(techniciansTable).values({
      userId: req.user!.id,
      name: user[0]?.name ?? "",
      bio, skills: skills ?? [],
      experienceYears: parseInt(experienceYears) || 0,
      hourlyRate: parseFloat(hourlyRate) || 0,
      serviceRadius: parseInt(serviceRadius) || 50,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      phone: user[0]?.phone ?? null,
      email: user[0]?.email ?? null,
      profileImage: user[0]?.profileImage ?? null,
    }).returning();
    res.status(201).json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Create technician error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /technicians/my
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const [tech] = await db.select().from(techniciansTable)
      .where(eq(techniciansTable.userId, req.user!.id)).limit(1);
    if (!tech) { res.status(404).json({ error: "No technician profile found" }); return; }
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Get my technician profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /technicians/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
    if (!tech) { res.status(404).json({ error: "Technician not found" }); return; }
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Get technician error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /technicians/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Technician not found" }); return; }
    if (existing.userId !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const { bio, skills, experienceYears, hourlyRate, serviceRadius, isActive } = req.body;
    const updates: any = {};
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = skills;
    if (experienceYears !== undefined) updates.experienceYears = parseInt(experienceYears);
    if (hourlyRate !== undefined) updates.hourlyRate = parseFloat(hourlyRate);
    if (serviceRadius !== undefined) updates.serviceRadius = parseInt(serviceRadius);
    if (isActive !== undefined) updates.isActive = isActive;
    const [tech] = await db.update(techniciansTable).set(updates).where(eq(techniciansTable.id, id)).returning();
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Update technician error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /technicians/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Technician not found" }); return; }
    if (existing.userId !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    await db.delete(techniciansTable).where(eq(techniciansTable.id, id));
    res.json({ message: "Technician deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete technician error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /technicians/:id/location
router.put("/:id/location", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { lat, lng } = req.body;
    const [tech] = await db.update(techniciansTable)
      .set({ lat: parseFloat(lat), lng: parseFloat(lng) })
      .where(eq(techniciansTable.id, id)).returning();
    if (!tech) { res.status(404).json({ error: "Technician not found" }); return; }
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Update technician location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /technicians/:id/availability
router.put("/:id/availability", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isAvailable } = req.body;
    const [tech] = await db.update(techniciansTable)
      .set({ isAvailable: Boolean(isAvailable) })
      .where(eq(techniciansTable.id, id)).returning();
    if (!tech) { res.status(404).json({ error: "Technician not found" }); return; }
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Update availability error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /technicians/:id/verify
router.put("/:id/verify", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Technician not found" }); return; }
    const [tech] = await db.update(techniciansTable)
      .set({ isVerified: !existing.isVerified })
      .where(eq(techniciansTable.id, id)).returning();
    res.json(formatTech(tech));
  } catch (err) {
    req.log.error({ err }, "Verify technician error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
