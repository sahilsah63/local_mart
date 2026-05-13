import { Router } from "express";
import { db, reviewsTable, usersTable, techniciansTable, shopsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /reviews
router.get("/", async (req, res) => {
  try {
    const { targetType, targetId } = req.query as Record<string, string>;
    let all = await db
      .select({ review: reviewsTable, userName: usersTable.name, userImage: usersTable.profileImage })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id));

    if (targetType) all = all.filter(r => r.review.targetType === targetType);
    if (targetId) all = all.filter(r => r.review.targetId === parseInt(targetId));

    res.json(all.map(({ review, userName, userImage }) => ({
      ...review,
      userName: userName ?? null,
      userImage: userImage ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "List reviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reviews
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const [review] = await db.insert(reviewsTable).values({
      userId: req.user!.id,
      targetId: parseInt(targetId),
      targetType,
      rating: parseInt(rating),
      comment: comment ?? null,
    }).returning();

    // Update rating on target
    const allReviews = await db.select().from(reviewsTable)
      .where(and(eq(reviewsTable.targetId, parseInt(targetId)), eq(reviewsTable.targetType, targetType)));
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const ratingCount = allReviews.length;

    if (targetType === "shop") {
      await db.update(shopsTable).set({ rating: avgRating, ratingCount }).where(eq(shopsTable.id, parseInt(targetId)));
    } else if (targetType === "technician") {
      await db.update(techniciansTable).set({ rating: avgRating, ratingCount }).where(eq(techniciansTable.id, parseInt(targetId)));
    }

    const [user] = await db.select({ name: usersTable.name, profileImage: usersTable.profileImage })
      .from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

    res.status(201).json({ ...review, userName: user?.name ?? null, userImage: user?.profileImage ?? null });
  } catch (err) {
    req.log.error({ err }, "Create review error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
