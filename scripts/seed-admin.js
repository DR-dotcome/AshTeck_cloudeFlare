const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { getDatabaseSetupErrors } = require("../src/config");

dotenv.config();

async function main() {
  const { PrismaClient } = require("../generated/client");
  const prisma = new PrismaClient();

  try {
    await seedAdmin({ prisma });
  } finally {
    await prisma.$disconnect();
  }
}

async function seedAdmin({ prisma, env = process.env, logger = console }) {
  validateDatabaseUrl(env);
  const email = normalizeEmail(env.ADMIN_EMAIL);
  const name = String(env.ADMIN_NAME || "").trim();

  if (!email) {
    throw new Error("ADMIN_EMAIL is required.");
  }

  if (!name) {
    throw new Error("ADMIN_NAME is required.");
  }

  const passwordHash = await resolvePasswordHash(env);
  const existingAdmin = await prisma.admin.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    await prisma.admin.update({
      where: { email },
      data: {
        passwordHash,
        name,
        isActive: true
      }
    });
    logger.log(`Admin already exists: ${email}`);
    return;
  }

  await prisma.admin.create({
    data: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
      isActive: true
    }
  });

  logger.log(`Admin ready: ${email}`);
}

function validateDatabaseUrl(env = process.env) {
  const errors = getDatabaseSetupErrors(env);

  if (errors.length) {
    throw new Error(`Database setup error: ${errors.join(" ")}`);
  }
}

async function resolvePasswordHash(env = process.env) {
  const plainPassword = String(env.ADMIN_PASSWORD || "").trim();

  if (!plainPassword) {
    throw new Error("ADMIN_PASSWORD is required.");
  }

  if (plainPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  return bcrypt.hash(plainPassword, 12);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  resolvePasswordHash,
  seedAdmin,
  validateDatabaseUrl
};
