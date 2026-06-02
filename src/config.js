const PLACEHOLDER_PATTERN =
  /(your-project-ref|your-password|\[YOUR-PASSWORD\]|replace-with|placeholder|\bDATABASE_URL=|\bDIRECT_URL=)/i;

function getRuntimeSetupErrors(env = process.env) {
  return [
    ...getDatabaseSetupErrors(env),
    ...getJwtSetupErrors(env)
  ];
}

function getDatabaseSetupErrors(env = process.env) {
  const errors = [];
  const databaseUrlError = validateSupabasePostgresUrl("DATABASE_URL", env.DATABASE_URL, {
    expected: "pooled"
  });
  const directUrlError = validateSupabasePostgresUrl("DIRECT_URL", env.DIRECT_URL, {
    expected: "direct"
  });

  if (databaseUrlError) {
    errors.push(databaseUrlError);
  }

  if (directUrlError) {
    errors.push(directUrlError);
  }

  return errors;
}

function getJwtSetupErrors(env = process.env) {
  const secret = cleanEnvValue(env.JWT_SECRET);

  if (!secret) {
    return ["JWT_SECRET is missing."];
  }

  if (secret.length < 32) {
    return ["JWT_SECRET must be at least 32 characters."];
  }

  return [];
}

function validateSupabasePostgresUrl(name, value, options = {}) {
  const cleaned = cleanEnvValue(value);

  if (!cleaned) {
    return `${name} is missing.`;
  }

  if (PLACEHOLDER_PATTERN.test(cleaned)) {
    return `${name} contains a placeholder value. Paste the real Supabase ${options.expected || "PostgreSQL"} URL in .env.`;
  }

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    return `${name} must be a valid PostgreSQL connection URL.`;
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    return `${name} must start with postgresql:// or postgres://.`;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!hostname.endsWith("supabase.com") && !hostname.endsWith("supabase.co")) {
    return `${name} must be a Supabase PostgreSQL URL.`;
  }

  if (options.expected === "pooled" && !isSupabasePoolerUrl(parsed, "6543")) {
    return "DATABASE_URL must be the Supabase transaction pooler URL on port 6543 from Connect > ORMs > Prisma.";
  }

  if (options.expected === "direct" && !isSupabaseDirectMigrationUrl(parsed)) {
    return "DIRECT_URL must be the Supabase session pooler URL on port 5432 from Connect > ORMs > Prisma.";
  }

  return "";
}

function isSupabasePoolerUrl(parsed, expectedPort) {
  return parsed.hostname.toLowerCase().includes("pooler.supabase.com") && parsed.port === expectedPort;
}

function isSupabaseDirectMigrationUrl(parsed) {
  const hostname = parsed.hostname.toLowerCase();

  return isSupabasePoolerUrl(parsed, "5432") || hostname.startsWith("db.");
}

function cleanEnvValue(value) {
  const raw = String(value || "").trim();

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }

  return raw;
}

function formatSetupMessage(errors) {
  return `Setup error: ${errors.join(" ")}`;
}

module.exports = {
  cleanEnvValue,
  formatSetupMessage,
  getDatabaseSetupErrors,
  getJwtSetupErrors,
  getRuntimeSetupErrors,
  validateSupabasePostgresUrl
};
