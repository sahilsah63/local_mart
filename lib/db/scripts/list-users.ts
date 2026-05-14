import { db, usersTable } from "@workspace/db";
const users = await db.select({
  id: usersTable.id,
  email: usersTable.email,
  role: usersTable.role,
}).from(usersTable);
console.log("Total users:", users.length);
console.log("Email\t\t\t\tRole");
console.log("─".repeat(60));
users.forEach(u => console.log(`${u.email.padEnd(32)}${u.role}`));
process.exit(0);
