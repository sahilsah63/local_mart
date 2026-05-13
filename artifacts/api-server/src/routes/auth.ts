import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, generateToken, AuthRequest } from "../middlewares/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }
    const { name, email, password, role, phone, lat, lng, address } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name, email, passwordHash, role: role ?? "user", phone: phone ?? null,
      lat: lat ?? null, lng: lng ?? null, address: address ?? null,
    }).returning();

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({
      token,
      user: { ...safeUser, profileImage: safeUser.profileImage ?? null }
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { email, password } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    res.json({
      token,
      user: { ...safeUser, profileImage: safeUser.profileImage ?? null }
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, profileImage: safeUser.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /auth/me/location
router.put("/me/location", authenticate, async (req: AuthRequest, res) => {
  try {
    const { lat, lng } = req.body;
    const [user] = await db.update(usersTable)
      .set({ lat, lng })
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, profileImage: safeUser.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Update location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
