const RATE_LIMITS = {
  contact: { limit: 8, windowMs: 15 * 60 * 1000 },
  quote: { limit: 8, windowMs: 15 * 60 * 1000 },
  login: { limit: 5, windowMs: 15 * 60 * 1000 }
};

const rateBuckets = new Map();

const contactLimits = {
  name: 80,
  email: 120,
  phone: 40,
  subject: 120,
  message: 1600,
  preferredLanguage: 40
};

const quoteLimits = {
  name: 80,
  email: 120,
  phone: 40,
  company: 120,
  location: 120,
  businessType: 80,
  service: 120,
  budget: 80,
  timeline: 80,
  details: 1800
};

const allowedValues = {
  preferredLanguage: ["English", "French", "Arabic"],
  businessType: ["Small business", "Shop", "School", "Home", "Office"],
  service: [
    "Network installation",
    "Router and switch configuration",
    "CCTV/IP cameras",
    "Wi-Fi optimization",
    "IT maintenance",
    "Backup solutions",
    "Basic cybersecurity audit"
  ],
  budget: ["Starter", "Standard", "Advanced", "Maintenance plan"],
  timeline: ["Urgent", "This week", "This month", "Planning ahead"]
};

const suspiciousInputPatterns = [
  /<\s*\/?\s*[a-z][^>]*>/i,
  /<\s*script/i,
  /javascript\s*:/i,
  /\bon[a-z]+\s*=/i,
  /\bsrcdoc\s*=/i,
  /&lt;\s*script/i,
  /&lt;\/?\s*[a-z]/i,
  /&#x?[0-9a-f]+;/i
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: securityHeaders() });
  }

  try {
    return await routeApi(request, env, url);
   } catch (error) {
    console.error("API error:", error);

    return jsonResponse(500, {
      success: false,
      message: error?.message || "Unknown API error",
      stack: String(error?.stack || "")
    });
  }
}

async function routeApi(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (method === "GET" && path === "/api/health") {
    return jsonResponse(200, { success: true, message: "API is running" });
  }

  if (!env.DB) {
    return jsonResponse(503, {
      success: false,
      message: "D1 database binding DB is missing."
    });
  }

  if (method === "POST" && path === "/api/contact") {
    return handleContact(request, env);
  }

  if (method === "POST" && path === "/api/quote") {
    return handleQuote(request, env);
  }

  if (method === "POST" && path === "/api/admin/login") {
    return handleAdminLogin(request, env);
  }

  if (method === "GET" && path === "/api/admin/session") {
    const admin = await requireAdmin(request, env);
    return jsonResponse(200, {
      success: true,
      message: "Admin session is active.",
      data: publicAdmin(admin)
    });
  }

  if (method === "GET" && path === "/api/admin/stats") {
    const admin = await requireAdmin(request, env);
    return handleAdminStats(env, admin);
  }

  if (method === "GET" && path === "/api/admin/activity") {
    await requireAdmin(request, env);
    return handleActivity(env, url);
  }

  if (method === "GET" && path === "/api/messages") {
    await requireAdmin(request, env);
    return handleMessages(env, url);
  }

  if (method === "GET" && path === "/api/messages/export") {
    const admin = await requireAdmin(request, env);
    return handleMessagesExport(request, env, url, admin);
  }

  if (method === "DELETE" && path.startsWith("/api/messages/")) {
    const admin = await requireAdmin(request, env);
    return handleDeleteMessage(request, env, path.split("/").pop(), admin);
  }

  if (method === "GET" && path === "/api/quotes") {
    await requireAdmin(request, env);
    return handleQuotes(env, url);
  }

  if (method === "GET" && path === "/api/quotes/export") {
    const admin = await requireAdmin(request, env);
    return handleQuotesExport(request, env, url, admin);
  }

  if (method === "DELETE" && path.startsWith("/api/quotes/")) {
    const admin = await requireAdmin(request, env);
    return handleDeleteQuote(request, env, path.split("/").pop(), admin);
  }

  return jsonResponse(404, {
    success: false,
    message: "API route was not found."
  });
}

async function handleContact(request, env) {
  const limited = checkRateLimit(request, "contact");
  if (limited) return limited;

  const body = await readJson(request);
  const { payload, errors } = validateContact(body);

  if (errors.length) {
    return validationResponse("Contact submission failed validation.", errors);
  }

  const saved = await env.DB.prepare(
    `INSERT INTO contact_messages (id, name, email, phone, subject, message, preferred_language, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     RETURNING *`
  )
    .bind(crypto.randomUUID(), payload.name, payload.email, payload.phone, payload.subject, payload.message, payload.preferredLanguage)
    .first();

  return jsonResponse(201, {
    success: true,
    message: "Your message was received. AshTech will contact you soon.",
    data: mapContact(saved)
  });
}

async function handleQuote(request, env) {
  const limited = checkRateLimit(request, "quote");
  if (limited) return limited;

  const body = await readJson(request);
  const { payload, errors } = validateQuote(body);

  if (errors.length) {
    return validationResponse("Quote request failed validation.", errors);
  }

  const saved = await env.DB.prepare(
    `INSERT INTO quote_requests (
      id, name, email, phone, company, location, business_type, service, budget, timeline, details, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *`
  )
    .bind(
      crypto.randomUUID(),
      payload.name,
      payload.email,
      payload.phone,
      payload.company,
      payload.location,
      payload.businessType,
      payload.service,
      payload.budget,
      payload.timeline,
      payload.details
    )
    .first();

  return jsonResponse(201, {
    success: true,
    message: "Your quote request was received. AshTech will prepare a response soon.",
    data: mapQuote(saved)
  });
}

async function handleAdminLogin(request, env) {
  const limited = checkRateLimit(request, "login");
  if (limited) return limited;

  const jwtErrors = getJwtSetupErrors(env);
  const body = await readJson(request);
  const { payload, password, errors } = validateAdminLogin(body);

  if (errors.length) {
    await logActivity(env, request, "admin_login_failed", { reason: "validation", email: payload.email || null });
    return validationResponse("Admin login failed.", errors);
  }

  if (jwtErrors.length) {
    await logActivity(env, request, "admin_login_failed", { reason: "jwt_not_configured", email: payload.email });
    return jsonResponse(503, { success: false, message: `Setup error: ${jwtErrors.join(" ")}`, errors: jwtErrors });
  }

  const admin = await env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(payload.email).first();

  if (!admin || !admin.is_active) {
    await logActivity(env, request, "admin_login_failed", { reason: "unknown_or_inactive_admin", email: payload.email });
    return jsonResponse(401, { success: false, message: "Admin login failed." });
  }

  const isValidPassword = await verifyPassword(password, admin.password_salt, admin.password_hash, admin.password_iterations);

  if (!isValidPassword) {
    await logActivity(env, request, "admin_login_failed", { reason: "invalid_password", email: payload.email }, admin.id);
    return jsonResponse(401, { success: false, message: "Admin login failed." });
  }

  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE admins SET last_login_at = ?, updated_at = datetime('now') WHERE id = ?").bind(now, admin.id).run();
  await logActivity(env, request, "admin_login_success", { email: payload.email }, admin.id);

  const token = await signJwt(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role || "ADMIN"
    },
    env
  );

  return jsonResponse(200, {
    success: true,
    message: "Admin login successful.",
    token,
    expiresIn: env.JWT_EXPIRES_IN || "1h"
  });
}

async function handleAdminStats(env, admin) {
  const [totalMessages, totalQuotes, todayMessages, todayQuotes, activity] = await Promise.all([
    countRows(env, "contact_messages"),
    countRows(env, "quote_requests"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM contact_messages WHERE created_at >= date('now')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM quote_requests WHERE created_at >= date('now')").first(),
    env.DB.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 6").all()
  ]);

  return jsonResponse(200, {
    success: true,
    data: {
      totalMessages,
      totalQuotes,
      todaySubmissions: Number(todayMessages.count || 0) + Number(todayQuotes.count || 0),
      todayMessages: Number(todayMessages.count || 0),
      todayQuotes: Number(todayQuotes.count || 0),
      lastLoginAt: admin.last_login_at,
      recentActivity: (activity.results || []).map(mapActivity)
    }
  });
}

async function handleActivity(env, url) {
  const { page, limit, offset, errors } = parsePagination(url.searchParams, { defaultLimit: 10, maxLimit: 50 });

  if (errors.length) {
    return validationResponse("Activity log query failed validation.", errors);
  }

  const [rows, count] = await Promise.all([
    env.DB.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all(),
    countRows(env, "activity_logs")
  ]);

  return jsonResponse(200, listResponse((rows.results || []).map(mapActivity), count, page, limit));
}

async function handleMessages(env, url) {
  const query = parseListQuery(url.searchParams, { defaultLimit: 6, maxLimit: 50 });
  const language = sanitizeOptionalQuery(url.searchParams.get("preferredLanguage") || url.searchParams.get("language"), 40);

  if (language && !allowedValues.preferredLanguage.includes(language)) {
    query.errors.push("Preferred language has an unsupported value.");
  }

  if (query.errors.length) {
    return validationResponse("Messages query failed validation.", query.errors);
  }

  const filter = buildMessageFilter(query.search, language);
  const [rows, count] = await Promise.all([
    env.DB.prepare(`SELECT * FROM contact_messages ${filter.sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...filter.values, query.limit, query.offset)
      .all(),
    countWhere(env, "contact_messages", filter)
  ]);

  return jsonResponse(200, listResponse((rows.results || []).map(mapContact), count, query.page, query.limit));
}

async function handleMessagesExport(request, env, url, admin) {
  const search = sanitizeOptionalQuery(url.searchParams.get("search"), 120);
  const language = sanitizeOptionalQuery(url.searchParams.get("preferredLanguage") || url.searchParams.get("language"), 40);
  const filter = buildMessageFilter(search, language);
  const rows = await env.DB.prepare(`SELECT * FROM contact_messages ${filter.sql} ORDER BY created_at DESC LIMIT 5000`)
    .bind(...filter.values)
    .all();
  const messages = (rows.results || []).map(mapContact);

  await logActivity(env, request, "contact_messages_exported", { count: messages.length }, admin.id);
  return csvResponse("ashtech-contact-messages.csv", messagesToCsv(messages));
}

async function handleDeleteMessage(request, env, id, admin) {
  if (!isValidUuid(id)) {
    return jsonResponse(400, { success: false, message: "Message id is invalid." });
  }

  const existing = await env.DB.prepare("SELECT id FROM contact_messages WHERE id = ?").bind(id).first();
  if (!existing) {
    return jsonResponse(404, { success: false, message: "Message was not found." });
  }

  await env.DB.prepare("DELETE FROM contact_messages WHERE id = ?").bind(id).run();
  await logActivity(env, request, "contact_message_deleted", { messageId: id }, admin.id);
  return jsonResponse(200, { success: true, message: "Message deleted successfully." });
}

async function handleQuotes(env, url) {
  const query = parseListQuery(url.searchParams, { defaultLimit: 6, maxLimit: 50 });
  const service = sanitizeOptionalQuery(url.searchParams.get("service"), quoteLimits.service);
  const businessType = sanitizeOptionalQuery(url.searchParams.get("businessType"), quoteLimits.businessType);

  if (service && !allowedValues.service.includes(service)) {
    query.errors.push("Service has an unsupported value.");
  }

  if (businessType && !allowedValues.businessType.includes(businessType)) {
    query.errors.push("Space type has an unsupported value.");
  }

  if (query.errors.length) {
    return validationResponse("Quote requests query failed validation.", query.errors);
  }

  const filter = buildQuoteFilter(query.search, service, businessType);
  const [rows, count] = await Promise.all([
    env.DB.prepare(`SELECT * FROM quote_requests ${filter.sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...filter.values, query.limit, query.offset)
      .all(),
    countWhere(env, "quote_requests", filter)
  ]);

  return jsonResponse(200, listResponse((rows.results || []).map(mapQuote), count, query.page, query.limit));
}

async function handleQuotesExport(request, env, url, admin) {
  const search = sanitizeOptionalQuery(url.searchParams.get("search"), 120);
  const service = sanitizeOptionalQuery(url.searchParams.get("service"), quoteLimits.service);
  const businessType = sanitizeOptionalQuery(url.searchParams.get("businessType"), quoteLimits.businessType);
  const filter = buildQuoteFilter(search, service, businessType);
  const rows = await env.DB.prepare(`SELECT * FROM quote_requests ${filter.sql} ORDER BY created_at DESC LIMIT 5000`)
    .bind(...filter.values)
    .all();
  const quotes = (rows.results || []).map(mapQuote);

  await logActivity(env, request, "quote_requests_exported", { count: quotes.length }, admin.id);
  return csvResponse("ashtech-quote-requests.csv", quotesToCsv(quotes));
}

async function handleDeleteQuote(request, env, id, admin) {
  if (!isValidUuid(id)) {
    return jsonResponse(400, { success: false, message: "Quote request id is invalid." });
  }

  const existing = await env.DB.prepare("SELECT id FROM quote_requests WHERE id = ?").bind(id).first();
  if (!existing) {
    return jsonResponse(404, { success: false, message: "Quote request was not found." });
  }

  await env.DB.prepare("DELETE FROM quote_requests WHERE id = ?").bind(id).run();
  await logActivity(env, request, "quote_request_deleted", { quoteRequestId: id }, admin.id);
  return jsonResponse(200, { success: true, message: "Quote request deleted successfully." });
}

function buildMessageFilter(search, language) {
  const clauses = [];
  const values = [];

  if (search) {
    const like = `%${search.toLowerCase()}%`;
    clauses.push(
      "(LOWER(name) LIKE ? OR LOWER(COALESCE(email, '')) LIKE ? OR LOWER(COALESCE(phone, '')) LIKE ? OR LOWER(COALESCE(subject, '')) LIKE ? OR LOWER(message) LIKE ? OR LOWER(COALESCE(preferred_language, '')) LIKE ?)"
    );
    values.push(like, like, like, like, like, like);
  }

  if (language) {
    clauses.push("preferred_language = ?");
    values.push(language);
  }

  return sqlFilter(clauses, values);
}

function buildQuoteFilter(search, service, businessType) {
  const clauses = [];
  const values = [];

  if (search) {
    const like = `%${search.toLowerCase()}%`;
    clauses.push(
      "(LOWER(name) LIKE ? OR LOWER(COALESCE(email, '')) LIKE ? OR LOWER(COALESCE(phone, '')) LIKE ? OR LOWER(COALESCE(company, '')) LIKE ? OR LOWER(COALESCE(location, '')) LIKE ? OR LOWER(COALESCE(business_type, '')) LIKE ? OR LOWER(service) LIKE ? OR LOWER(COALESCE(budget, '')) LIKE ? OR LOWER(COALESCE(timeline, '')) LIKE ? OR LOWER(details) LIKE ?)"
    );
    values.push(like, like, like, like, like, like, like, like, like, like);
  }

  if (service) {
    clauses.push("service = ?");
    values.push(service);
  }

  if (businessType) {
    clauses.push("business_type = ?");
    values.push(businessType);
  }

  return sqlFilter(clauses, values);
}

function sqlFilter(clauses, values) {
  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
}

async function countRows(env, table) {
  const result = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first();
  return Number(result?.count || 0);
}

async function countWhere(env, table, filter) {
  const result = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table} ${filter.sql}`).bind(...filter.values).first();
  return Number(result?.count || 0);
}

async function requireAdmin(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    throw new HttpError(401, "Admin login is required.");
  }

  const decoded = await verifyJwt(token, env);
  const admin = await env.DB.prepare("SELECT * FROM admins WHERE id = ?").bind(decoded.sub).first();

  if (!admin || !admin.is_active) {
    throw new HttpError(401, "Admin session is invalid or expired.");
  }

  return admin;
}

function validateContact(body) {
  const errors = [];
  const payload = {
    name: sanitizeField(body, "name", contactLimits.name, "Name", errors, { required: true }),
    email: (sanitizeField(body, "email", contactLimits.email, "Email", errors) || "").toLowerCase() || null,
    phone: sanitizeField(body, "phone", contactLimits.phone, "Phone", errors),
    subject: sanitizeField(body, "subject", contactLimits.subject, "Subject", errors),
    message: sanitizeField(body, "message", contactLimits.message, "Message", errors, { required: true }),
    preferredLanguage: sanitizeField(body, "preferredLanguage", contactLimits.preferredLanguage, "Preferred language", errors)
  };

  if (!payload.email && !payload.phone) errors.push("Email or phone is required.");
  if (!isValidEmail(payload.email)) errors.push("Email format is invalid.");
  if (!isValidPhone(payload.phone)) errors.push("Phone format is invalid.");
  ensureAllowedValue(payload, "preferredLanguage", "Preferred language", errors);
  return { payload, errors };
}

function validateQuote(body) {
  const errors = [];
  const payload = {
    name: sanitizeField(body, "name", quoteLimits.name, "Name", errors, { required: true }),
    email: (sanitizeField(body, "email", quoteLimits.email, "Email", errors) || "").toLowerCase() || null,
    phone: sanitizeField(body, "phone", quoteLimits.phone, "Phone", errors),
    company: sanitizeField(body, "company", quoteLimits.company, "Company", errors),
    location: sanitizeField(body, "location", quoteLimits.location, "Location", errors),
    businessType: sanitizeField(body, "businessType", quoteLimits.businessType, "Space type", errors),
    service: sanitizeField(body, "service", quoteLimits.service, "Service", errors, { required: true }),
    budget: sanitizeField(body, "budget", quoteLimits.budget, "Budget", errors),
    timeline: sanitizeField(body, "timeline", quoteLimits.timeline, "Timeline", errors),
    details: sanitizeField(body, "details", quoteLimits.details, "Project details", errors, { required: true })
  };

  if (!payload.email && !payload.phone) errors.push("Email or phone is required.");
  if (!isValidEmail(payload.email)) errors.push("Email format is invalid.");
  if (!isValidPhone(payload.phone)) errors.push("Phone format is invalid.");
  ensureAllowedValue(payload, "businessType", "Space type", errors);
  ensureAllowedValue(payload, "service", "Service", errors);
  ensureAllowedValue(payload, "budget", "Budget", errors);
  ensureAllowedValue(payload, "timeline", "Timeline", errors);
  return { payload, errors };
}

function validateAdminLogin(body) {
  const errors = [];
  const payload = {
    email: (sanitizeField(body, "email", 120, "Email", errors, { required: true }) || "").toLowerCase() || null
  };

  if (!isValidEmail(payload.email)) errors.push("Email format is invalid.");

  if (!body || typeof body.password !== "string" || !body.password.trim()) {
    errors.push("Password is required.");
    return { payload, password: "", errors };
  }

  if (body.password.length > 200) errors.push("Password must be 200 characters or fewer.");
  return { payload, password: body.password, errors };
}

function sanitizeField(body, field, limit, label, errors, options = {}) {
  const rawValue = body?.[field];

  if (rawValue === undefined || rawValue === null) {
    if (options.required) errors.push(`${label} is required.`);
    return null;
  }

  if (typeof rawValue !== "string") {
    errors.push(`${label} must be text.`);
    return null;
  }

  const cleaned = normalizeText(rawValue);

  if (options.required && !cleaned) errors.push(`${label} is required.`);
  if (cleaned.length > limit) errors.push(`${label} must be ${limit} characters or fewer.`);
  if (containsSuspiciousInput(rawValue) || containsSuspiciousInput(cleaned)) {
    errors.push(`${label} contains unsupported HTML or script-like content.`);
  }

  return cleaned || null;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsSuspiciousInput(value) {
  return suspiciousInputPatterns.some((pattern) => pattern.test(String(value || "")));
}

function ensureAllowedValue(payload, field, label, errors) {
  if (payload[field] && !allowedValues[field].includes(payload[field])) {
    errors.push(`${label} has an unsupported value.`);
  }
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  return !phone || /^[0-9+\-().\s]{6,40}$/.test(phone);
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseListQuery(searchParams, options) {
  const pagination = parsePagination(searchParams, options);
  const search = sanitizeOptionalQuery(searchParams.get("search"), 120);

  if (search && containsSuspiciousInput(search)) {
    pagination.errors.push("Search contains unsupported HTML or script-like content.");
  }

  return { ...pagination, search };
}

function parsePagination(searchParams, options = {}) {
  const defaultLimit = Number(options.defaultLimit) || 10;
  const maxLimit = Number(options.maxLimit) || 50;
  const errors = [];
  const page = parsePositiveInteger(searchParams.get("page"), 1, "Page", errors);
  const requestedLimit = parsePositiveInteger(searchParams.get("limit"), defaultLimit, "Limit", errors);
  const limit = Math.min(requestedLimit, maxLimit);

  return { page, limit, offset: (page - 1) * limit, errors };
}

function parsePositiveInteger(value, fallback, label, errors) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${label} must be a positive number.`);
    return fallback;
  }
  return parsed;
}

function sanitizeOptionalQuery(value, limit) {
  return normalizeText(value || "").slice(0, limit);
}

function listResponse(data, count, page, limit) {
  return {
    success: true,
    count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
    data
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function checkRateLimit(request, bucket) {
  const config = RATE_LIMITS[bucket];
  const ip = getClientIp(request);
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const existing = rateBuckets.get(key) || { count: 0, resetAt: now + config.windowMs };

  if (existing.resetAt <= now) {
    existing.count = 0;
    existing.resetAt = now + config.windowMs;
  }

  existing.count += 1;
  rateBuckets.set(key, existing);

  if (existing.count > config.limit) {
    return jsonResponse(429, { success: false, message: "Too many requests. Please try again later." });
  }

  return null;
}

async function verifyPassword(password, saltHex, expectedHash, iterations = 100000) {
  const actualHash = await derivePasswordHash(password, saltHex, Number(iterations) || 100000);
  return constantTimeEqual(actualHash, expectedHash);
}

async function derivePasswordHash(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey("raw", textBytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations
    },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function signJwt(payload, env) {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iss: "ashtech",
    iat: now,
    exp: now + parseExpirySeconds(env.JWT_EXPIRES_IN || "1h")
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = await hmacSha256(`${header}.${body}`, env.JWT_SECRET);
  return `${header}.${body}.${signature}`;
}

async function verifyJwt(token, env) {
  const jwtErrors = getJwtSetupErrors(env);
  if (jwtErrors.length) {
    throw new HttpError(503, `Setup error: ${jwtErrors.join(" ")}`);
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "Admin session is invalid or expired.");
  }

  const expected = await hmacSha256(`${parts[0]}.${parts[1]}`, env.JWT_SECRET);
  if (!constantTimeEqual(expected, parts[2])) {
    throw new HttpError(401, "Admin session is invalid or expired.");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    throw new HttpError(401, "Admin session is invalid or expired.");
  }

  if (payload.iss !== "ashtech" || !payload.sub || Number(payload.exp) <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "Admin session is invalid or expired.");
  }

  return payload;
}

async function hmacSha256(input, secret) {
  const key = await crypto.subtle.importKey("raw", textBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, textBytes(input));
  return bytesToBase64Url(new Uint8Array(signature));
}

function parseExpirySeconds(value) {
  const text = String(value || "1h").trim();
  const match = text.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;
  const amount = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * multipliers[match[2]];
}

function getJwtSetupErrors(env) {
  const errors = [];
  if (!env.JWT_SECRET) errors.push("JWT_SECRET is missing.");
  if (env.JWT_SECRET && String(env.JWT_SECRET).length < 32) errors.push("JWT_SECRET must be at least 32 characters.");
  return errors;
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
}

async function logActivity(env, request, event, metadata = {}, adminId = null) {
  try {
    await env.DB.prepare(
      "INSERT INTO activity_logs (id, admin_id, event, ip_address, user_agent, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
    )
      .bind(crypto.randomUUID(), adminId, event, getClientIp(request), request.headers.get("user-agent") || "unknown", JSON.stringify(metadata))
      .run();
  } catch (error) {
    console.error("Unable to write activity log:", error);
  }
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...securityHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function validationResponse(message, errors) {
  return jsonResponse(400, { success: false, message, errors });
}

function csvResponse(filename, csv) {
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      ...securityHeaders(),
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

function securityHeaders() {
  return {
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
  };
}

function mapContact(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    preferredLanguage: row.preferred_language,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapQuote(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    location: row.location,
    businessType: row.business_type,
    service: row.service,
    budget: row.budget,
    timeline: row.timeline,
    details: row.details,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapActivity(row) {
  return {
    id: row.id,
    adminId: row.admin_id,
    event: row.event,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: safeJson(row.metadata),
    createdAt: row.created_at
  };
}

function publicAdmin(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    lastLoginAt: row.last_login_at
  };
}

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function messagesToCsv(messages) {
  return toCsv(["createdAt", "name", "email", "phone", "subject", "preferredLanguage", "message"], messages);
}

function quotesToCsv(quotes) {
  return toCsv(["createdAt", "name", "email", "phone", "company", "location", "businessType", "service", "budget", "timeline", "details"], quotes);
}

function toCsv(fields, rows) {
  return [fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\r\n");
}

function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function base64UrlEncode(value) {
  return bytesToBase64Url(textBytes(value));
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textBytes(value) {
  return new TextEncoder().encode(String(value));
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}