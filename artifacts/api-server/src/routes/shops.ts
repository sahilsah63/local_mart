import { Router } from "express";
import { db, shopsTable, usersTable } from "@workspace/db";
import { eq, sql, ilike, and } from "drizzle-orm";
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

function formatShop(shop: any, ownerName?: string) {
  return {
    ...shop,
    images: shop.images ?? [],
    ownerName: ownerName ?? null,
  };
}

// GET /shops
router.get("/", async (req, res) => {
  try {
    const { lat, lng, radius = "50", category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const allShops = await db
      .select({ shop: shopsTable, ownerName: usersTable.name })
      .from(shopsTable)
      .leftJoin(usersTable, eq(shopsTable.ownerId, usersTable.id))
      .where(eq(shopsTable.isActive, true));

    let filtered = allShops;

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      filtered = filtered.filter(({ shop }) =>
        haversineKm(userLat, userLng, shop.lat, shop.lng) <= radiusKm
      );
    }

    if (category) {
      filtered = filtered.filter(({ shop }) => shop.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(({ shop }) =>
        shop.name.toLowerCase().includes(q) || (shop.description ?? "").toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      shops: paged.map(({ shop, ownerName }) => formatShop(shop, ownerName ?? undefined)),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /shops
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, address, lat, lng, phone, email, category, images, workingHours } = req.body;
    const [shop] = await db.insert(shopsTable).values({
      ownerId: req.user!.id,
      name, description, address, lat: parseFloat(lat), lng: parseFloat(lng),
      phone, email, category,
      images: images ?? [],
      workingHours,
    }).returning();
    res.status(201).json(formatShop(shop));
  } catch (err) {
    req.log.error({ err }, "Create shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /shops/my
router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const [shop] = await db.select().from(shopsTable)
      .where(eq(shopsTable.ownerId, req.user!.id)).limit(1);
    if (!shop) { res.status(404).json({ error: "No shop found" }); return; }
    res.json(formatShop(shop));
  } catch (err) {
    req.log.error({ err }, "Get my shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /shops/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db
      .select({ shop: shopsTable, ownerName: usersTable.name })
      .from(shopsTable)
      .leftJoin(usersTable, eq(shopsTable.ownerId, usersTable.id))
      .where(eq(shopsTable.id, id)).limit(1);
    if (!result) { res.status(404).json({ error: "Shop not found" }); return; }
    res.json(formatShop(result.shop, result.ownerName ?? undefined));
  } catch (err) {
    req.log.error({ err }, "Get shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /shops/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(shopsTable).where(eq(shopsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Shop not found" }); return; }
    if (existing.ownerId !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const { name, description, address, lat, lng, phone, email, category, images, workingHours, isActive } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;
    if (lat !== undefined) updates.lat = parseFloat(lat);
    if (lng !== undefined) updates.lng = parseFloat(lng);
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (category !== undefined) updates.category = category;
    if (images !== undefined) updates.images = images;
    if (workingHours !== undefined) updates.workingHours = workingHours;
    if (isActive !== undefined) updates.isActive = isActive;
    const [shop] = await db.update(shopsTable).set(updates).where(eq(shopsTable.id, id)).returning();
    res.json(formatShop(shop));
  } catch (err) {
    req.log.error({ err }, "Update shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /shops/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(shopsTable).where(eq(shopsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Shop not found" }); return; }
    if (existing.ownerId !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    await db.delete(shopsTable).where(eq(shopsTable.id, id));
    res.json({ message: "Shop deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /shops/:id/verify
router.put("/:id/verify", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(shopsTable).where(eq(shopsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Shop not found" }); return; }
    const [shop] = await db.update(shopsTable)
      .set({ isVerified: !existing.isVerified })
      .where(eq(shopsTable.id, id)).returning();
    res.json(formatShop(shop));
  } catch (err) {
    req.log.error({ err }, "Verify shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
