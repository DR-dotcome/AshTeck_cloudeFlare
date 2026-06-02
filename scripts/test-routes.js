const crypto = require("crypto");
const { createApp } = require("../src/app");
const { seedAdmin } = require("./seed-admin");

const TEST_ADMIN_EMAIL = "admin@ashtech.example";
const TEST_ADMIN_PASSWORD = "Adminf123";
const VALID_DATABASE_URL =
  "postgresql://postgres.testprojectref:test-password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
const VALID_DIRECT_URL =
  "postgresql://postgres.testprojectref:test-password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

class FakeModel {
  constructor(seed = []) {
    this.rows = seed.map((row) => ({ ...row }));
  }

  async create({ data }) {
    const now = new Date();
    const row = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.rows.push(row);
    return { ...row };
  }

  async findMany({ where, orderBy, skip = 0, take } = {}) {
    const rows = this.rows.filter((row) => matchesWhere(row, where)).map((row) => ({ ...row }));

    if (orderBy?.createdAt === "desc") {
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return rows.slice(skip, take ? skip + take : undefined);
  }

  async count({ where } = {}) {
    return this.rows.filter((row) => matchesWhere(row, where)).length;
  }

  async findUnique({ where }) {
    const key = Object.keys(where)[0];
    const value = where[key];
    const row = this.rows.find((item) => item[key] === value);
    return row ? { ...row } : null;
  }

  async update({ where, data }) {
    const key = Object.keys(where)[0];
    const value = where[key];
    const index = this.rows.findIndex((item) => item[key] === value);

    if (index === -1) {
      throw new Error("Record not found.");
    }

    this.rows[index] = {
      ...this.rows[index],
      ...data,
      updatedAt: new Date()
    };

    return { ...this.rows[index] };
  }

  async upsert({ where, update, create }) {
    const existing = await this.findUnique({ where });
    if (existing) {
      return this.update({ where, data: update });
    }
    return this.create({ data: create });
  }

  async delete({ where }) {
    const key = Object.keys(where)[0];
    const value = where[key];
    const index = this.rows.findIndex((item) => item[key] === value);

    if (index === -1) {
      throw new Error("Record not found.");
    }

    const [deleted] = this.rows.splice(index, 1);
    return { ...deleted };
  }
}

function matchesWhere(row, where = {}) {
  if (!where || !Object.keys(where).length) {
    return true;
  }

  return Object.entries(where).every(([key, condition]) => {
    if (key === "OR") {
      return condition.some((item) => matchesWhere(row, item));
    }

    if (key === "AND") {
      return condition.every((item) => matchesWhere(row, item));
    }

    if (condition && typeof condition === "object" && "contains" in condition) {
      return String(row[key] || "").toLowerCase().includes(String(condition.contains || "").toLowerCase());
    }

    if (condition && typeof condition === "object" && ("gte" in condition || "lte" in condition)) {
      const value = new Date(row[key]).getTime();
      const gte = condition.gte ? new Date(condition.gte).getTime() : Number.NEGATIVE_INFINITY;
      const lte = condition.lte ? new Date(condition.lte).getTime() : Number.POSITIVE_INFINITY;
      return value >= gte && value <= lte;
    }

    return row[key] === condition;
  });
}

async function buildFakePrisma() {
  const prisma = {
    contactMessage: new FakeModel(),
    quoteRequest: new FakeModel(),
    admin: new FakeModel(),
    activityLog: new FakeModel(),
    async $disconnect() {}
  };

  await seedAdmin({
    prisma,
    env: {
      DATABASE_URL: VALID_DATABASE_URL,
      DIRECT_URL: VALID_DIRECT_URL,
      ADMIN_EMAIL: TEST_ADMIN_EMAIL,
      ADMIN_NAME: "Test Admin",
      ADMIN_PASSWORD: TEST_ADMIN_PASSWORD
    },
    logger: { log() {} }
  });

  return prisma;
}

async function request(base, method, path, body, headers = {}) {
  const options = { method, headers: { ...headers } };

  if (body !== undefined && body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${base}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  console.log(`${method} ${path} -> ${response.status}`);
  return { response, data };
}

async function run() {
  const prisma = await buildFakePrisma();
  const app = createApp({
    prisma,
    env: {
      JWT_SECRET: "test-local-jwt-secret-with-more-than-32-characters",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL: VALID_DATABASE_URL,
      DIRECT_URL: VALID_DIRECT_URL,
      CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      CONTACT_RATE_LIMIT_MAX: "20",
      QUOTE_RATE_LIMIT_MAX: "20",
      ADMIN_LOGIN_RATE_LIMIT_MAX: "20"
    }
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    for (const page of ["/", "/index.html", "/services.html", "/solutions.html", "/projects.html", "/contact.html", "/admin.html"]) {
      const result = await request(base, "GET", page);
      assert(result.response.status === 200, `Page failed: ${page}`);
    }

    const health = await request(base, "GET", "/api/health");
    assert(health.response.status === 200 && health.data.message === "API is running", "Health route failed.");

    const helmetCheck = await request(base, "GET", "/");
    assert(helmetCheck.response.headers.get("x-content-type-options") === "nosniff", "Helmet header missing.");

    const blockedCors = await request(base, "GET", "/api/messages", null, { Origin: "http://evil.example" });
    assert(blockedCors.response.status === 403, "CORS block failed.");

    const unauthMessages = await request(base, "GET", "/api/messages");
    assert(unauthMessages.response.status === 401, "Unauthenticated admin route was not blocked.");

    const emptyContact = await request(base, "POST", "/api/contact", {});
    assert(emptyContact.response.status === 400, "Empty contact validation failed.");

    const suspiciousContact = await request(base, "POST", "/api/contact", {
      name: "Bad Actor",
      email: "bad@example.com",
      message: "<script>alert(1)</script>"
    });
    assert(suspiciousContact.response.status === 400, "Suspicious contact input was not rejected.");

    const contact = await request(base, "POST", "/api/contact", {
      name: "Route Test User",
      email: "route-test@example.com",
      phone: "+212600000000",
      subject: "Smoke test",
      preferredLanguage: "English",
      message: "Testing the AshTech contact route."
    });
    assert(contact.response.status === 201 && contact.data.data?.id, "Valid contact failed.");

    const emptyQuote = await request(base, "POST", "/api/quote", {});
    assert(emptyQuote.response.status === 400, "Empty quote validation failed.");

    const suspiciousQuote = await request(base, "POST", "/api/quote", {
      name: "Quote Attacker",
      email: "quote-attacker@example.com",
      service: "Wi-Fi optimization",
      details: "Please run javascript:alert(1)"
    });
    assert(suspiciousQuote.response.status === 400, "Suspicious quote input was not rejected.");

    const quote = await request(base, "POST", "/api/quote", {
      name: "Route Test Quote",
      email: "quote-test@example.com",
      phone: "+212611111111",
      company: "AshTech Test Shop",
      location: "Casablanca",
      businessType: "Shop",
      service: "Wi-Fi optimization",
      budget: "Standard",
      timeline: "This week",
      details: "Testing the AshTech quote route with realistic project details."
    });
    assert(quote.response.status === 201 && quote.data.data?.id, "Valid quote failed.");

    const badLogin = await request(base, "POST", "/api/admin/login", {
      email: TEST_ADMIN_EMAIL,
      password: "wrong-password"
    });
    assert(badLogin.response.status === 401, "Invalid login was not rejected.");

    const login = await request(base, "POST", "/api/admin/login", {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    });
    assert(login.response.status === 200 && login.data.token, "Valid admin login failed.");
    const auth = { Authorization: `Bearer ${login.data.token}` };

    const session = await request(base, "GET", "/api/admin/session", null, auth);
    assert(session.response.status === 200, "Admin session failed.");

    const stats = await request(base, "GET", "/api/admin/stats", null, auth);
    assert(stats.response.status === 200 && typeof stats.data.data?.totalMessages === "number", "Admin stats failed.");

    const activity = await request(base, "GET", "/api/admin/activity?page=1&limit=5", null, auth);
    assert(activity.response.status === 200 && Array.isArray(activity.data.data), "Activity log read failed.");

    const messages = await request(base, "GET", "/api/messages", null, auth);
    assert(messages.response.status === 200 && Array.isArray(messages.data.data), "Messages read failed.");

    const searchedMessages = await request(base, "GET", "/api/messages?search=Route&page=1&limit=5", null, auth);
    assert(searchedMessages.response.status === 200 && searchedMessages.data.data.length === 1, "Message search failed.");

    const messageExport = await request(base, "GET", "/api/messages/export", null, auth);
    assert(messageExport.response.status === 200 && String(messageExport.data).includes("createdAt,name,email"), "Message CSV export failed.");

    const quotes = await request(base, "GET", "/api/quotes", null, auth);
    assert(quotes.response.status === 200 && Array.isArray(quotes.data.data), "Quotes read failed.");

    const searchedQuotes = await request(base, "GET", "/api/quotes?search=Route&page=1&limit=5", null, auth);
    assert(searchedQuotes.response.status === 200 && searchedQuotes.data.data.length === 1, "Quote search failed.");

    const quoteExport = await request(base, "GET", "/api/quotes/export", null, auth);
    assert(quoteExport.response.status === 200 && String(quoteExport.data).includes("createdAt,name,email"), "Quote CSV export failed.");

    const badMessageDelete = await request(base, "DELETE", "/api/messages/not-a-uuid", null, auth);
    assert(badMessageDelete.response.status === 400, "Invalid message delete id was not rejected.");

    const badQuoteDelete = await request(base, "DELETE", "/api/quotes/not-a-uuid", null, auth);
    assert(badQuoteDelete.response.status === 400, "Invalid quote delete id was not rejected.");

    const deleteMessage = await request(base, "DELETE", `/api/messages/${contact.data.data.id}`, null, auth);
    assert(deleteMessage.response.status === 200, "Message delete failed.");

    const deleteQuote = await request(base, "DELETE", `/api/quotes/${quote.data.data.id}`, null, auth);
    assert(deleteQuote.response.status === 200, "Quote delete failed.");

    const missingApi = await request(base, "GET", "/api/not-found", null, auth);
    assert(missingApi.response.status === 404, "API 404 failed.");

    assert(prisma.activityLog.rows.some((entry) => entry.event === "admin_login_failed"), "Failed login activity was not logged.");
    assert(prisma.activityLog.rows.some((entry) => entry.event === "admin_login_success"), "Successful login activity was not logged.");
    await assertAdminLoginBypassesRuntimeConfig();
    await assertRuntimeSetupErrorsReturnedForDataRoutes();
    await assertWeakJwtSecretRejected();

    console.log("All route tests passed.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

async function assertWeakJwtSecretRejected() {
  const prisma = await buildFakePrisma();
  const app = createApp({
    prisma,
    env: {
      JWT_SECRET: "too-short",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL: VALID_DATABASE_URL,
      DIRECT_URL: VALID_DIRECT_URL,
      CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      CONTACT_RATE_LIMIT_MAX: "20",
      QUOTE_RATE_LIMIT_MAX: "20",
      ADMIN_LOGIN_RATE_LIMIT_MAX: "20"
    }
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = await request(base, "POST", "/api/admin/login", {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    });
    assert(login.response.status === 503, "Weak JWT_SECRET was not rejected.");
    assert(
      login.data.errors?.includes("JWT_SECRET must be at least 32 characters."),
      "Weak JWT_SECRET response did not name JWT_SECRET."
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

async function assertAdminLoginBypassesRuntimeConfig() {
  const prisma = await buildFakePrisma();
  const app = createApp({
    prisma,
    env: {
      JWT_SECRET: "test-local-jwt-secret-with-more-than-32-characters",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL:
        "postgresql://postgres.your-project-ref:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
      DIRECT_URL: "",
      CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      CONTACT_RATE_LIMIT_MAX: "20",
      QUOTE_RATE_LIMIT_MAX: "20",
      ADMIN_LOGIN_RATE_LIMIT_MAX: "20"
    }
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = await request(base, "POST", "/api/admin/login", {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    });
    assert(login.response.status === 200 && login.data.token, "Admin login was blocked by runtime config.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

async function assertRuntimeSetupErrorsReturnedForDataRoutes() {
  const prisma = await buildFakePrisma();
  const app = createApp({
    prisma,
    env: {
      JWT_SECRET: "test-local-jwt-secret-with-more-than-32-characters",
      JWT_EXPIRES_IN: "1h",
      DATABASE_URL:
        "postgresql://postgres.your-project-ref:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
      DIRECT_URL: "",
      CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      CONTACT_RATE_LIMIT_MAX: "20",
      QUOTE_RATE_LIMIT_MAX: "20",
      ADMIN_LOGIN_RATE_LIMIT_MAX: "20"
    }
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const messages = await request(base, "GET", "/api/messages");
    assert(messages.response.status === 503, "Runtime setup errors were not returned for data routes.");
    assert(messages.data.errors?.some((error) => error.startsWith("DATABASE_URL")), "DATABASE_URL setup error was not returned.");
    assert(messages.data.errors?.some((error) => error.startsWith("DIRECT_URL")), "DIRECT_URL setup error was not returned.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
