import { Router } from "express";
import { db, productsTable, shopsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

function formatProduct(p: any, shopName?: string) {
  return { ...p, images: p.images ?? [], shopName: shopName ?? null };
}

// GET /products
router.get("/", async (req, res) => {
  try {
    const { shopId, category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const results = await db
      .select({ product: productsTable, shopName: shopsTable.name })
      .from(productsTable)
      .leftJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
      .where(eq(productsTable.isActive, true));

    let filtered = results;
    if (shopId) filtered = filtered.filter(r => r.product.shopId === parseInt(shopId));
    if (category) filtered = filtered.filter(r => r.product.category === category);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => r.product.name.toLowerCase().includes(q));
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limitNum);

    res.json({
      products: paged.map(r => formatProduct(r.product, r.shopName ?? undefined)),
      total, page: pageNum, limit: limitNum,
    });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { shopId, name, description, price, category, images, stock } = req.body;
    const [product] = await db.insert(productsTable).values({
      shopId: parseInt(shopId), name, description,
      price: parseFloat(price), category, images: images ?? [],
      stock: parseInt(stock) || 0,
    }).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db
      .select({ product: productsTable, shopName: shopsTable.name })
      .from(productsTable)
      .leftJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
      .where(eq(productsTable.id, id)).limit(1);
    if (!result) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(formatProduct(result.product, result.shopName ?? undefined));
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /products/:id
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, category, images, stock, isActive } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (images !== undefined) updates.images = images;
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (isActive !== undefined) updates.isActive = isActive;
    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ message: "Product deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
