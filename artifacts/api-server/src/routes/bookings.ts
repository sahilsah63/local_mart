import { Router } from "express";
import { db, bookingsTable, usersTable, techniciansTable, servicesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";

const router = Router();

async function enrichBooking(booking: any) {
  const [user] = await db.select({ name: usersTable.name, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, booking.userId)).limit(1);
  const [tech] = await db.select({ name: techniciansTable.name })
    .from(techniciansTable).where(eq(techniciansTable.id, booking.technicianId)).limit(1);
  let serviceName: string | null = null;
  if (booking.serviceId) {
    const [svc] = await db.select({ name: servicesTable.name })
      .from(servicesTable).where(eq(servicesTable.id, booking.serviceId)).limit(1);
    serviceName = svc?.name ?? null;
  }
  return {
    ...booking,
    userName: user?.name ?? null,
    technicianName: tech?.name ?? null,
    serviceName,
    userPhone: user?.phone ?? null,
  };
}

// GET /bookings
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let all = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);

    if (req.user!.role !== "admin") {
      if (role === "technician") {
        const [tech] = await db.select({ id: techniciansTable.id })
          .from(techniciansTable).where(eq(techniciansTable.userId, req.user!.id)).limit(1);
        if (tech) all = all.filter(b => b.technicianId === tech.id);
        else all = [];
      } else {
        all = all.filter(b => b.userId === req.user!.id);
      }
    }

    if (status) all = all.filter(b => b.status === status);

    const total = all.length;
    const paged = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    const enriched = await Promise.all(paged.map(enrichBooking));

    res.json({ bookings: enriched, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "List bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bookings
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { technicianId, serviceId, scheduledAt, userLat, userLng, totalAmount, notes } = req.body;
    const [booking] = await db.insert(bookingsTable).values({
      userId: req.user!.id,
      technicianId: parseInt(technicianId),
      serviceId: serviceId ? parseInt(serviceId) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      userLat: userLat ? parseFloat(userLat) : null,
      userLng: userLng ? parseFloat(userLng) : null,
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      notes: notes ?? null,
    }).returning();
    const enriched = await enrichBooking(booking);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Create booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /bookings/:id
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Get booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /bookings/:id/status
router.put("/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [booking] = await db.update(bookingsTable)
      .set({ status })
      .where(eq(bookingsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Update booking status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /bookings/:id/location
router.put("/:id/location", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { lat, lng } = req.body;
    const [booking] = await db.update(bookingsTable)
      .set({ technicianLat: parseFloat(lat), technicianLng: parseFloat(lng) })
      .where(eq(bookingsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Update booking location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /bookings/:id/cancel
router.put("/:id/cancel", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.update(bookingsTable)
      .set({ status: "cancelled" })
      .where(eq(bookingsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Cancel booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/bookings (all bookings for admin)
router.get("/admin/all", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let all = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);
    if (status) all = all.filter(b => b.status === status);

    const total = all.length;
    const paged = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    const enriched = await Promise.all(paged.map(enrichBooking));

    res.json({ bookings: enriched, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Admin list bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
