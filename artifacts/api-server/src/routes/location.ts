import { Router } from "express";
import { db, shopsTable, techniciansTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

// GET /location/nearby-shops
router.get("/nearby-shops", async (req, res) => {
  try {
    const { lat, lng, radius = "50" } = req.query as Record<string, string>;
    if (!lat || !lng) { res.status(400).json({ error: "lat and lng required" }); return; }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const results = await db
      .select({ shop: shopsTable, ownerName: usersTable.name })
      .from(shopsTable)
      .leftJoin(usersTable, eq(shopsTable.ownerId, usersTable.id))
      .where(eq(shopsTable.isActive, true));

    const nearby = results
      .map(({ shop, ownerName }) => ({
        ...shop,
        images: shop.images ?? [],
        ownerName: ownerName ?? null,
        distance: haversineKm(userLat, userLng, shop.lat, shop.lng),
      }))
      .filter(s => s.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch (err) {
    req.log.error({ err }, "Nearby shops error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /location/nearby-technicians
router.get("/nearby-technicians", async (req, res) => {
  try {
    const { lat, lng, radius = "50" } = req.query as Record<string, string>;
    if (!lat || !lng) { res.status(400).json({ error: "lat and lng required" }); return; }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const all = await db.select().from(techniciansTable).where(eq(techniciansTable.isActive, true));

    const nearby = all
      .filter(t => t.lat != null && t.lng != null)
      .map(t => ({
        ...t,
        skills: t.skills ?? [],
        distance: haversineKm(userLat, userLng, t.lat!, t.lng!),
      }))
      .filter(t => t.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch (err) {
    req.log.error({ err }, "Nearby technicians error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
