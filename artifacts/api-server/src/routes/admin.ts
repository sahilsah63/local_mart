import { Router } from "express";
import { db, usersTable, shopsTable, techniciansTable, bookingsTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /admin/stats
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable);
    const [{ totalShops }] = await db.select({ totalShops: sql<number>`count(*)` }).from(shopsTable);
    const [{ totalTechnicians }] = await db.select({ totalTechnicians: sql<number>`count(*)` }).from(techniciansTable);
    const [{ totalBookings }] = await db.select({ totalBookings: sql<number>`count(*)` }).from(bookingsTable);
    const [{ activeBookings }] = await db.select({ activeBookings: sql<number>`count(*)` }).from(bookingsTable)
      .where(eq(bookingsTable.status, "in_progress"));
    const [{ completedBookings }] = await db.select({ completedBookings: sql<number>`count(*)` }).from(bookingsTable)
      .where(eq(bookingsTable.status, "completed"));
    const [{ pendingBookings }] = await db.select({ pendingBookings: sql<number>`count(*)` }).from(bookingsTable)
      .where(eq(bookingsTable.status, "pending"));
    const [{ totalRevenue }] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(total_amount), 0)`
    }).from(bookingsTable).where(eq(bookingsTable.status, "completed"));
    const [{ newUsersToday }] = await db.select({ newUsersToday: sql<number>`count(*)` }).from(usersTable)
      .where(gte(usersTable.createdAt, today));
    const [{ newShopsToday }] = await db.select({ newShopsToday: sql<number>`count(*)` }).from(shopsTable)
      .where(gte(shopsTable.createdAt, today));
    const [{ bookingsToday }] = await db.select({ bookingsToday: sql<number>`count(*)` }).from(bookingsTable)
      .where(gte(bookingsTable.createdAt, today));
    const [{ verifiedShops }] = await db.select({ verifiedShops: sql<number>`count(*)` }).from(shopsTable)
      .where(eq(shopsTable.isVerified, true));
    const [{ verifiedTechnicians }] = await db.select({ verifiedTechnicians: sql<number>`count(*)` }).from(techniciansTable)
      .where(eq(techniciansTable.isVerified, true));

    res.json({
      totalUsers: Number(totalUsers),
      totalShops: Number(totalShops),
      totalTechnicians: Number(totalTechnicians),
      totalBookings: Number(totalBookings),
      activeBookings: Number(activeBookings),
      completedBookings: Number(completedBookings),
      pendingBookings: Number(pendingBookings),
      totalRevenue: Number(totalRevenue),
      newUsersToday: Number(newUsersToday),
      newShopsToday: Number(newShopsToday),
      bookingsToday: Number(bookingsToday),
      verifiedShops: Number(verifiedShops),
      verifiedTechnicians: Number(verifiedTechnicians),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/bookings
router.get("/bookings", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const all = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        technicianId: bookingsTable.technicianId,
        serviceId: bookingsTable.serviceId,
        status: bookingsTable.status,
        scheduledAt: bookingsTable.scheduledAt,
        userLat: bookingsTable.userLat,
        userLng: bookingsTable.userLng,
        technicianLat: bookingsTable.technicianLat,
        technicianLng: bookingsTable.technicianLng,
        totalAmount: bookingsTable.totalAmount,
        notes: bookingsTable.notes,
        createdAt: bookingsTable.createdAt,
        updatedAt: bookingsTable.updatedAt,
        userName: usersTable.name,
        userPhone: usersTable.phone,
      })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .orderBy(bookingsTable.createdAt);

    let filtered = status ? all.filter(b => b.status === status) : all;
    const total = filtered.length;
    const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      bookings: paged.map(b => ({
        ...b,
        technicianName: null,
        serviceName: null,
        userName: b.userName ?? null,
        userPhone: b.userPhone ?? null,
      })),
      total, page: pageNum, limit: limitNum
    });
  } catch (err) {
    req.log.error({ err }, "Admin bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/revenue
router.get("/revenue", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Monthly revenue for last 6 months
    const monthlyRaw = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as bookings
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);

    const statusRaw = await db.execute(sql`
      SELECT status, COUNT(*) as count FROM bookings GROUP BY status
    `);

    const topTechRaw = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.total_amount), 0) as revenue,
        t.rating
      FROM technicians t
      LEFT JOIN bookings b ON b.technician_id = t.id AND b.status = 'completed'
      GROUP BY t.id, t.name, t.rating
      ORDER BY bookings DESC
      LIMIT 10
    `);

    res.json({
      monthly: (monthlyRaw.rows ?? []).map((r: any) => ({
        month: r.month,
        revenue: Number(r.revenue),
        bookings: Number(r.bookings),
      })),
      bookingsByStatus: (statusRaw.rows ?? []).map((r: any) => ({
        status: r.status,
        count: Number(r.count),
      })),
      topTechnicians: (topTechRaw.rows ?? []).map((r: any) => ({
        id: Number(r.id),
        name: r.name,
        bookings: Number(r.bookings),
        revenue: Number(r.revenue),
        rating: Number(r.rating),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Admin revenue error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
