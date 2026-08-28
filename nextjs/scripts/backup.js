// ─────────────────────────────────────────────────────────
//  BARAKAH FINANCE — Hourly Database Backup Script
//  Usage: node scripts/backup.js
//  Cron:  0 * * * * cd /path/to/app && node scripts/backup.js
// ─────────────────────────────────────────────────────────
require("dotenv").config({ path: ".env" });
const { execSync } = require("child_process");
const path         = require("path");
const fs           = require("fs");

const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  console.error("[Backup] ERROR: DATABASE_URL not set");
  process.exit(1);
}

// Parse connection string
const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^/:]+):?(\d*)\/([\w-]+)/);
if (!match) {
  console.error("[Backup] ERROR: Could not parse DATABASE_URL:", dbUrl.slice(0, 40));
  process.exit(1);
}
const [, user, pass, host, portStr, dbName] = match;
const port = portStr || "5432";

const backupDir = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.join(__dirname, "..", "backups");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const filePath = path.join(backupDir, `backup_${ts}.sql`);

try {
  process.env.PGPASSWORD = pass;
  execSync(
    `pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} --no-password -f "${filePath}"`,
    { stdio: "pipe" }
  );
  execSync(`gzip -f "${filePath}"`);
  console.log(`[Backup] ✅ Saved: ${filePath}.gz`);

  // Prune old backups
  const retention = parseInt(process.env.BACKUP_RETENTION_DAYS || "60", 10);
  const cutoff    = Date.now() - retention * 24 * 60 * 60 * 1000;
  let pruned = 0;
  fs.readdirSync(backupDir).forEach((f) => {
    const fp = path.join(backupDir, f);
    if (f.startsWith("backup_") && fs.statSync(fp).mtimeMs < cutoff) {
      fs.unlinkSync(fp);
      pruned++;
    }
  });
  if (pruned > 0) console.log(`[Backup] 🗑️  Pruned ${pruned} old backup(s) (>${retention} days)`);
} catch (err) {
  console.error("[Backup] ❌ Error:", err.message || err);
  process.exit(1);
}