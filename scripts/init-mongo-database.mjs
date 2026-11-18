import fs from "fs";
import path from "path";
import dns from "dns";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const envText = fs.readFileSync(".env.local", "utf-8");
const match = envText.match(/MONGODB_URI="?([^"\r\n]+)"?/);

if (!match) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const uri = match[1];
console.log("Connecting to MongoDB Atlas...");

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
console.log("Connected successfully to database:", mongoose.connection.name);

const db = mongoose.connection.db;

// Read local data
const localDbPath = path.join(process.cwd(), ".data", "db.json");
const localDb = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));

// All system permission keys for superadmin
const ALL_PERMISSIONS = [
  "dashboard:view",
  "parcels:create",
  "parcels:edit",
  "parcels:delete",
  "parcels:import",
  "batches:manage",
  "delivery:update",
  "returns:manage",
  "couriers:manage",
  "settlements:view",
  "settlements:manage",
  "payments:manage",
  "ledger:view",
  "reports:view",
  "reports:export",
  "users:manage",
  "settings:manage",
  "customers:view",
  "customers:manage",
];

// Ensure superadmin user exists
const superadminPasswordHash = await bcrypt.hash("Daisy@143", 10);
const superadminUser = {
  _id: "user-superadmin-santosh",
  name: "Santosh Sahani",
  username: "santoshkingsahani95@gmail.com",
  email: "santoshkingsahani95@gmail.com",
  phone: "9801122334",
  passwordHash: superadminPasswordHash,
  role: "superadmin",
  permissions: ALL_PERMISSIONS,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Also ensure default admin has valid passwordHash
const adminPasswordHash = await bcrypt.hash("admin123", 10);
const staffPasswordHash = await bcrypt.hash("staff123", 10);

const existingUsers = (localDb.users || []).filter(
  (u) => u.username !== "santoshkingsahani95@gmail.com"
);

for (const u of existingUsers) {
  if (u.username === "admin" && !u.passwordHash) {
    u.passwordHash = adminPasswordHash;
  }
  if (u.username === "staff" && !u.passwordHash) {
    u.passwordHash = staffPasswordHash;
  }
}

const allUsers = [superadminUser, ...existingUsers];

// Update local db.json with the new superadmin user
localDb.users = allUsers;
fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2), "utf-8");
console.log("Updated local .data/db.json with Super Admin account!");

// Collections to create and seed
const collections = [
  { name: "users", data: allUsers },
  { name: "couriercompanies", data: localDb.couriers || [] },
  { name: "batches", data: localDb.batches || [] },
  { name: "parcels", data: localDb.parcels || [] },
  { name: "returns", data: localDb.returns || [] },
  { name: "settlements", data: localDb.settlements || [] },
  { name: "payments", data: localDb.payments || [] },
  { name: "courierledgerentries", data: localDb.ledger || [] },
  {
    name: "systemsettings",
    data: localDb.settings ? [{ _id: "settings-global", ...localDb.settings }] : [],
  },
  { name: "activitylogs", data: localDb.activityLogs || [] },
  { name: "customers", data: [] },
  { name: "importbatches", data: [] },
];

// Extract unique customers from parcels if customers is empty
if (localDb.parcels && localDb.parcels.length > 0) {
  const customerMap = new Map();
  for (const p of localDb.parcels) {
    const phone = p.customerPhone?.trim();
    if (phone && !customerMap.has(phone)) {
      customerMap.set(phone, {
        _id: "cust-" + phone,
        name: p.customerName || "Customer",
        phone: phone,
        address: p.customerAddress || "",
        totalOrders: 1,
        totalSpent: Number(p.codAmount) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (phone && customerMap.has(phone)) {
      const c = customerMap.get(phone);
      c.totalOrders += 1;
      c.totalSpent += Number(p.codAmount) || 0;
    }
  }
  const custCol = collections.find((c) => c.name === "customers");
  if (custCol) {
    custCol.data = Array.from(customerMap.values());
  }
}

console.log("\nCreating collections and inserting data into MongoDB Atlas...");

for (const col of collections) {
  console.log(`\nProcessing collection: "${col.name}"...`);

  // Check if collection exists
  const existingCols = await db.listCollections({ name: col.name }).toArray();
  if (existingCols.length === 0) {
    await db.createCollection(col.name);
    console.log(`  ✓ Created collection "${col.name}"`);
  } else {
    console.log(`  • Collection "${col.name}" already exists`);
  }

  const collection = db.collection(col.name);

  // Clear any existing docs to ensure fresh clean sync
  await collection.deleteMany({});

  if (col.data && col.data.length > 0) {
    const res = await collection.insertMany(col.data);
    console.log(`  ✓ Inserted ${res.insertedCount} records into "${col.name}"`);
  } else {
    console.log(`  • Initialized empty collection "${col.name}" (ready for new records)`);
  }
}

// Create essential indexes
console.log("\nCreating indexes...");

try {
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("couriercompanies").createIndex({ name: 1 }, { unique: true });
  await db.collection("batches").createIndex({ batchId: 1 }, { unique: true });
  await db.collection("batches").createIndex({ courierId: 1 });
  await db.collection("parcels").createIndex({ parcelId: 1 }, { unique: true });
  await db.collection("parcels").createIndex({ batchId: 1 });
  await db.collection("parcels").createIndex({ customerPhone: 1 });
  await db.collection("parcels").createIndex({ status: 1 });
  await db.collection("returns").createIndex({ returnId: 1 }, { unique: true });
  await db.collection("returns").createIndex({ parcelId: 1 });
  await db.collection("settlements").createIndex({ settlementNumber: 1 }, { unique: true });
  await db.collection("settlements").createIndex({ courierId: 1 });
  await db.collection("payments").createIndex({ paymentNumber: 1 }, { unique: true });
  await db.collection("payments").createIndex({ courierId: 1 });
  await db.collection("courierledgerentries").createIndex({ ledgerId: 1 }, { unique: true });
  await db.collection("courierledgerentries").createIndex({ courierId: 1 });
  await db.collection("customers").createIndex({ phone: 1 }, { unique: true, sparse: true });
  console.log("  ✓ All indexes created successfully!");
} catch (e) {
  console.warn("  ! Note on index creation:", e.message);
}

// Summary Verification
console.log("\n================ MONGO DB AUDIT SUMMARY ================");
const allCols = await db.listCollections().toArray();
console.log(`Total Collections in Database "${mongoose.connection.name}":`, allCols.length);

for (const col of allCols) {
  const count = await db.collection(col.name).countDocuments();
  console.log(` - Table "${col.name}": ${count} records`);
}
console.log("========================================================\n");

await mongoose.disconnect();
console.log("Disconnected. Database initialization finished successfully!");
process.exit(0);
