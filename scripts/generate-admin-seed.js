const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const env = {
  ...process.env,
  ...loadEnv(path.join(process.cwd(), ".env")),
  ...loadEnv(path.join(process.cwd(), ".dev.vars"))
};
const email = clean(env.ADMIN_EMAIL).toLowerCase();
const name = clean(env.ADMIN_NAME);
const password = clean(env.ADMIN_PASSWORD);
const iterations = Number(env.ADMIN_PASSWORD_ITERATIONS || 100000);

if (!email) {
  fail("ADMIN_EMAIL is required.");
}

if (!name) {
  fail("ADMIN_NAME is required.");
}

if (!password || password.length < 8) {
  fail("ADMIN_PASSWORD must be at least 8 characters.");
}

const id = crypto.randomUUID();
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), iterations, 32, "sha256").toString("hex");
const sql = `INSERT INTO admins (
  id, email, name, password_hash, password_salt, password_iterations, role, is_active, created_at, updated_at
) VALUES (
  '${escapeSql(id)}',
  '${escapeSql(email)}',
  '${escapeSql(name)}',
  '${escapeSql(hash)}',
  '${escapeSql(salt)}',
  ${iterations},
  'ADMIN',
  1,
  datetime('now'),
  datetime('now')
)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt,
  password_iterations = excluded.password_iterations,
  is_active = 1,
  updated_at = datetime('now');
`;

fs.writeFileSync(path.join(process.cwd(), "seed-admin.sql"), sql);
console.log("Generated seed-admin.sql. Run: npx wrangler d1 execute straitsec-db --file=./seed-admin.sql");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = {};
  const content = fs.readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      return;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    parsed[key] = value;
  });

  return parsed;
}

function clean(value) {
  return String(value || "").trim();
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
