import { Router } from "express";
import { db, shopsTable, techniciansTable, usersTable, bookingsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth.js";


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

// GET /location/booking/:bookingId
// Returns live coords for both parties (customer + technician) in an active booking
router.get("/booking/:bookingId", authenticate, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking id" });
    }

    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Fetch booking
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 2. Resolve technician's user account
    const [tech] = await db
      .select()
      .from(techniciansTable)
      .where(eq(techniciansTable.id, booking.technicianId))
      .limit(1);

    if (!tech) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const customerUserId = booking.userId;
    const providerUserId = tech.userId;

    // 3. Permission: caller must be one of the two parties
    if (callerId !== customerUserId && callerId !== providerUserId) {
      return res.status(403).json({ error: "Not a participant in this booking" });
    }

    // 4. Tracking only allowed during active statuses
    const TRACKABLE = ["accepted", "in_progress"];
    if (!TRACKABLE.includes(booking.status)) {
      return res.status(409).json({
        error: "Tracking not available for this booking status",
        status: booking.status,
      });
    }

    // 5. Fetch both users' live coords
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        role: usersTable.role,
        currentLat: usersTable.currentLat,
        currentLng: usersTable.currentLng,
        lastLocationAt: usersTable.lastLocationAt,
      })
      .from(usersTable)
      .where(inArray(usersTable.id, [customerUserId, providerUserId]));

    const customer = users.find((u) => u.id === customerUserId) ?? null;
    const provider = users.find((u) => u.id === providerUserId) ?? null;

    // 6. Fallback to booking's stored coords if user hasn't pushed live update yet
    const customerOut = customer && {
      ...customer,
      currentLat: customer.currentLat ?? booking.userLat,
      currentLng: customer.currentLng ?? booking.userLng,
    };
    const providerOut = provider && {
      ...provider,
      currentLat: provider.currentLat ?? booking.technicianLat,
      currentLng: provider.currentLng ?? booking.technicianLng,
    };

    return res.json({
      bookingId,
      status: booking.status,
      customer: customerOut,
      provider: providerOut,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/location/booking] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
