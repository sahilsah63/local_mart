import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /users (admin only)
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      lat: usersTable.lat,
      lng: usersTable.lng,
      address: usersTable.address,
      profileImage: usersTable.profileImage,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable);

    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      lat: usersTable.lat,
      lng: usersTable.lng,
      address: usersTable.address,
      profileImage: usersTable.profileImage,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable)
      .where(role ? eq(usersTable.role, role) : undefined)
      .limit(limitNum)
      .offset(offset)
      .orderBy(usersTable.createdAt);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
      .where(role ? eq(usersTable.role, role) : undefined);

    res.json({
      users: users.map(u => ({ ...u, profileImage: u.profileImage ?? null })),
      total: Number(count),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /users/:id
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      lat: usersTable.lat,
      lng: usersTable.lng,
      address: usersTable.address,
      profileImage: usersTable.profileImage,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ...user, profileImage: user.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /users/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user!.id !== id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { name, phone, address, profileImage } = req.body;
    const [user] = await db.update(usersTable)
      .set({ name, phone, address, profileImage })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, profileImage: safeUser.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /users/:id
router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "User deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /users/:id/toggle-status
router.put("/:id/toggle-status", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "User not found" }); return; }
    const [user] = await db.update(usersTable)
      .set({ isActive: !current.isActive })
      .where(eq(usersTable.id, id))
      .returning();
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, profileImage: safeUser.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Toggle user status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
