import mysql from "mysql2/promise";

async function testMySQLConnection() {
  console.log("🔍 Connecting to VPS MySQL via local tunnel (127.0.0.1:13306)...");

  try {
    const connection = await mysql.createConnection({
      host: process.env.VPS_MYSQL_HOST || "127.0.0.1",
      port: parseInt(process.env.VPS_MYSQL_PORT || "13306", 10),
      user: process.env.VPS_MYSQL_USER || "pdhpayment_user",
      password: process.env.VPS_MYSQL_PASSWORD || "",
      database: process.env.VPS_MYSQL_DATABASE || "pdhpayment",
      connectTimeout: 10000,
    });

    console.log("✅ MySQL Connection Established Successfully!\n");

    // Task 3: Test query SELECT DATABASE(), VERSION(), NOW();
    console.log("📌 Query 1: SELECT DATABASE(), VERSION(), NOW();");
    const [rows1] = await connection.query("SELECT DATABASE(), VERSION(), NOW();");
    console.table(rows1);

    // Task 4: Check database 'pdhpayment' and list all tables
    console.log("\n📌 Query 2: SHOW TABLES;");
    const [rows2] = (await connection.query("SHOW TABLES;")) as [unknown[], unknown];
    console.log(`Found ${rows2.length} tables in database 'pdhpayment':`);
    console.table(rows2);

    await connection.end();
    console.log("\n🎉 MySQL Test Completed Successfully!");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ MySQL Connection Failed:", msg);
  }
}

testMySQLConnection();
