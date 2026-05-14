import { db } from "@workspace/db";
import {
  usersTable,
  techniciansTable,
  shopsTable,
  productsTable,
} from "../src";
import bcrypt from "bcryptjs";

import { or, like } from "drizzle-orm";

const LUCKNOW = [
  { name: "Hazratganj",   lat: 26.8467, lng: 80.9462 },
  { name: "Gomti Nagar",  lat: 26.8540, lng: 81.0234 },
  { name: "Aliganj",      lat: 26.8966, lng: 80.9606 },
  { name: "Indira Nagar", lat: 26.8693, lng: 80.9925 },
  { name: "Alambagh",     lat: 26.8021, lng: 80.8916 },
];

const SHOP_CATEGORIES = ["mobile", "laptop", "tv", "ac"];
const PRODUCT_NAMES = [
  "Type-C Charger 25W",
  "Laptop Battery 4-cell",
  "Universal TV Remote",
  "Wireless Earphones",
  "10000mAh Power Bank",
  "AC Remote",
  "Laptop Cooling Pad",
  "Tempered Glass Protector",
];
const TECH_SKILLS: string[][] = [
  ["mobile", "laptop"],
  ["ac", "refrigerator"],
  ["tv", "washing-machine"],
  ["laptop", "desktop"],
  ["mobile", "tablet"],
];

async function main() {

  console.log("🧹 Clearing previous seed data...");
  await db.delete(productsTable);
  await db.delete(techniciansTable);
  await db.delete(shopsTable);
  await db.delete(usersTable).where(
    or(
      like(usersTable.email, "shop%@example.com"),
      like(usersTable.email, "tech%@example.com"),
    ),
  );
  console.log("  ✓ Cleared");
  // ↑ End cleanup ↑

  const hash = await bcrypt.hash("admin123", 10);
  // ... rest as-is ...

  // 5 shops
  for (let i = 0; i < 5; i++) {
    const area = LUCKNOW[i];
    const [owner] = await db.insert(usersTable).values({
      name: `Shop Owner ${i + 1}`,
      email: `shop${i + 1}@example.com`,
      phone: `+9190000100${i}`,
      passwordHash: hash,
      role: "shop_owner",
      lat: area.lat,
      lng: area.lng,
      address: `${area.name}, Lucknow`,
    }).returning();

    const [shop] = await db.insert(shopsTable).values({
      ownerId: owner.id,
      name: `${area.name} Electronics`,
      description: "Quality electronics, repair & accessories",
      address: `Main Road, ${area.name}, Lucknow`,
      lat: area.lat,
      lng: area.lng,
      phone: owner.phone,
      email: owner.email,
      category: SHOP_CATEGORIES[i % SHOP_CATEGORIES.length],
      images: [],
      isVerified: true,
      isActive: true,
      workingHours: "10:00 AM - 9:00 PM",
    }).returning();

    for (let p = 0; p < 3; p++) {
      await db.insert(productsTable).values({
        shopId: shop.id,
        name: PRODUCT_NAMES[(i + p) % PRODUCT_NAMES.length],
        description: "Original quality, 6-month warranty",
        price: 499 + p * 250,
        category: shop.category,
        images: [],
        stock: 10 + p,
        isActive: true,
      });
    }
  }

  // 5 technicians
  for (let i = 0; i < 5; i++) {
    const area = LUCKNOW[i];
    const [techUser] = await db.insert(usersTable).values({
      name: `Technician ${i + 1}`,
      email: `tech${i + 1}@example.com`,
      phone: `+9190000200${i}`,
      passwordHash: hash,
      role: "technician",
      lat: area.lat,
      lng: area.lng,
      address: `${area.name}, Lucknow`,
    }).returning();

    await db.insert(techniciansTable).values({
      userId: techUser.id,
      name: techUser.name,
      bio: `Expert in ${TECH_SKILLS[i].join(", ")}. ${2 + i}+ years experience.`,
      skills: TECH_SKILLS[i],
      experienceYears: 2 + i,
      hourlyRate: 300 + i * 50,
      lat: area.lat,
      lng: area.lng,
      isAvailable: true,
      isVerified: true,
      isActive: true,
      serviceRadius: 25,
      phone: techUser.phone,
      email: techUser.email,
    });
  }

  console.log("✅ Seeded: 5 shops + 15 products + 5 technicians around Lucknow");
  console.log("   Login: shop1@example.com / tech1@example.com (password: admin123)");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});