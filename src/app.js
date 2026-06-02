const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { formatSetupMessage, getJwtSetupErrors, getRuntimeSetupErrors } = require("./config");

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

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function createApp({ prisma, env = process.env, staticDir = path.join(__dirname, "..", "public") }) {
  if (!prisma) {
    throw new Error("Prisma client is required.");
  }

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.locals.prisma = prisma;
  app.locals.env = env;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"]
        }
      },
      crossOriginResourcePolicy: { policy: "same-origin" },
      hsts: env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    })
  );
  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    next();
  });
  app.use(cors(buildCorsOptions(env)));
  app.use(express.json({ limit: "25kb" }));
  app.use(express.urlencoded({ extended: true, limit: "25kb" }));
  app.use(express.static(staticDir));

  const contactRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(env.CONTACT_RATE_LIMIT_MAX) || 8,
    message: "Too many contact attempts. Please try again later."
  });

  const quoteRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(env.QUOTE_RATE_LIMIT_MAX) || 8,
    message: "Too many quote attempts. Please try again later."
  });

  const adminLoginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(env.ADMIN_LOGIN_RATE_LIMIT_MAX) || 5,
    message: "Too many admin login attempts. Please try again later.",
    securityEvent: "admin_login_failed"
  });
  const adminApiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: Number(env.ADMIN_API_RATE_LIMIT_MAX) || 120,
    message: "Too many admin API requests. Please try again later."
  });
  const runtimeConfig = requireRuntimeConfig(env);

  app.get("/api/health", (req, res) => {
    return res.json({
      success: true,
      message: "API is running"
    });
  });

  app.post(
    "/api/admin/login",
    adminLoginRateLimiter,
    asyncHandler(async (req, res) => {
      const { payload, password, errors } = validateAdminLogin(req.body || {});

      if (errors.length) {
        await logActivity(prisma, req, "admin_login_failed", { reason: "validation", email: payload.email || null });
        return res.status(400).json(buildValidationError("Admin login failed.", errors));
      }

      const jwtSetupErrors = getJwtSetupErrors(env);
      if (jwtSetupErrors.length) {
        await logActivity(prisma, req, "admin_login_failed", { reason: "jwt_not_configured", email: payload.email });
        return res.status(503).json({
          success: false,
          message: formatSetupMessage(jwtSetupErrors),
          errors: jwtSetupErrors
        });
      }

      const admin = await prisma.admin.findUnique({
        where: { email: payload.email }
      });

      if (!admin || !admin.isActive) {
        await logActivity(prisma, req, "admin_login_failed", { reason: "unknown_or_inactive_admin", email: payload.email });
        return res.status(401).json({
          success: false,
          message: "Admin login failed."
        });
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

      if (!isValidPassword) {
        await logActivity(prisma, req, "admin_login_failed", { reason: "invalid_password", email: payload.email }, admin.id);
        return res.status(401).json({
          success: false,
          message: "Admin login failed."
        });
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() }
      });

      await logActivity(prisma, req, "admin_login_success", { email: payload.email }, admin.id);

      const token = jwt.sign(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.role
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN || "1h",
          issuer: "ashtech"
        }
      );

      return res.json({
        success: true,
        message: "Admin login successful.",
        token,
        expiresIn: env.JWT_EXPIRES_IN || "1h"
      });
    })
  );

  app.get(
    "/api/admin/session",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      return res.json({
        success: true,
        message: "Admin session is active.",
        data: {
          email: req.admin.email,
          name: req.admin.name,
          lastLoginAt: req.admin.lastLoginAt,
          role: req.admin.role
        }
      });
    })
  );

  app.get(
    "/api/admin/stats",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMessages, totalQuotes, todayMessages, todayQuotes, recentActivity] = await Promise.all([
        prisma.contactMessage.count(),
        prisma.quoteRequest.count(),
        prisma.contactMessage.count({ where: { createdAt: { gte: today } } }),
        prisma.quoteRequest.count({ where: { createdAt: { gte: today } } }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 6
        })
      ]);

      return res.json({
        success: true,
        data: {
          totalMessages,
          totalQuotes,
          todaySubmissions: todayMessages + todayQuotes,
          todayMessages,
          todayQuotes,
          lastLoginAt: req.admin.lastLoginAt,
          recentActivity
        }
      });
    })
  );

  app.get(
    "/api/admin/activity",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const { page, limit, skip, errors } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

      if (errors.length) {
        return res.status(400).json(buildValidationError("Activity log query failed validation.", errors));
      }

      const [activity, count] = await Promise.all([
        prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.activityLog.count()
      ]);

      return res.json(buildListResponse(activity, count, page, limit));
    })
  );

  app.post(
    "/api/contact",
    contactRateLimiter,
    runtimeConfig,
    asyncHandler(async (req, res) => {
      const { payload, errors } = validateContact(req.body || {});

      if (errors.length) {
        return res.status(400).json(buildValidationError("Contact submission failed validation.", errors));
      }

      const savedMessage = await prisma.contactMessage.create({
        data: payload
      });

      return res.status(201).json({
        success: true,
        message: "Your message was received. AshTech will contact you soon.",
        data: savedMessage
      });
    })
  );

  app.post(
    "/api/quote",
    quoteRateLimiter,
    runtimeConfig,
    asyncHandler(async (req, res) => {
      const { payload, errors } = validateQuote(req.body || {});

      if (errors.length) {
        return res.status(400).json(buildValidationError("Quote request failed validation.", errors));
      }

      const savedQuote = await prisma.quoteRequest.create({
        data: payload
      });

      return res.status(201).json({
        success: true,
        message: "Your quote request was received. AshTech will prepare a response soon.",
        data: savedQuote
      });
    })
  );

  app.get(
    "/api/messages",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const { page, limit, skip, errors, search } = parseListQuery(req.query, { defaultLimit: 6, maxLimit: 50 });
      const language = sanitizeOptionalQuery(req.query.preferredLanguage || req.query.language, 40);

      if (language && !allowedValues.preferredLanguage.includes(language)) {
        errors.push("Preferred language has an unsupported value.");
      }

      if (errors.length) {
        return res.status(400).json(buildValidationError("Messages query failed validation.", errors));
      }

      const where = buildMessageWhere({ search, language });
      const [messages, count] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.contactMessage.count({ where })
      ]);

      return res.json(buildListResponse(messages, count, page, limit));
    })
  );

  app.get(
    "/api/messages/export",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const search = sanitizeOptionalQuery(req.query.search, 120);
      const language = sanitizeOptionalQuery(req.query.preferredLanguage || req.query.language, 40);
      const where = buildMessageWhere({ search, language });
      const messages = await prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000
      });

      await logActivity(prisma, req, "contact_messages_exported", { count: messages.length }, req.admin.id);
      return sendCsv(res, "ashtech-contact-messages.csv", messagesToCsv(messages));
    })
  );

  app.get(
    "/api/quotes",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const { page, limit, skip, errors, search } = parseListQuery(req.query, { defaultLimit: 6, maxLimit: 50 });
      const service = sanitizeOptionalQuery(req.query.service, quoteLimits.service);
      const businessType = sanitizeOptionalQuery(req.query.businessType, quoteLimits.businessType);

      if (service && !allowedValues.service.includes(service)) {
        errors.push("Service has an unsupported value.");
      }

      if (businessType && !allowedValues.businessType.includes(businessType)) {
        errors.push("Space type has an unsupported value.");
      }

      if (errors.length) {
        return res.status(400).json(buildValidationError("Quote requests query failed validation.", errors));
      }

      const where = buildQuoteWhere({ search, service, businessType });
      const [quotes, count] = await Promise.all([
        prisma.quoteRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.quoteRequest.count({ where })
      ]);

      return res.json(buildListResponse(quotes, count, page, limit));
    })
  );

  app.get(
    "/api/quotes/export",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      const search = sanitizeOptionalQuery(req.query.search, 120);
      const service = sanitizeOptionalQuery(req.query.service, quoteLimits.service);
      const businessType = sanitizeOptionalQuery(req.query.businessType, quoteLimits.businessType);
      const where = buildQuoteWhere({ search, service, businessType });
      const quotes = await prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000
      });

      await logActivity(prisma, req, "quote_requests_exported", { count: quotes.length }, req.admin.id);
      return sendCsv(res, "ashtech-quote-requests.csv", quotesToCsv(quotes));
    })
  );

  app.delete(
    "/api/messages/:id",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      if (!isValidUuid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Message id is invalid."
        });
      }

      const message = await prisma.contactMessage.findUnique({
        where: { id: req.params.id }
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message was not found."
        });
      }

      await prisma.contactMessage.delete({
        where: { id: req.params.id }
      });
      await logActivity(prisma, req, "contact_message_deleted", { messageId: req.params.id }, req.admin.id);

      return res.json({
        success: true,
        message: "Message deleted successfully."
      });
    })
  );

  app.delete(
    "/api/quotes/:id",
    runtimeConfig,
    adminApiRateLimiter,
    requireAdmin(prisma, env),
    asyncHandler(async (req, res) => {
      if (!isValidUuid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Quote request id is invalid."
        });
      }

      const quote = await prisma.quoteRequest.findUnique({
        where: { id: req.params.id }
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Quote request was not found."
        });
      }

      await prisma.quoteRequest.delete({
        where: { id: req.params.id }
      });
      await logActivity(prisma, req, "quote_request_deleted", { quoteRequestId: req.params.id }, req.admin.id);

      return res.json({
        success: true,
        message: "Quote request deleted successfully."
      });
    })
  );

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({
        success: false,
        message: "API route was not found."
      });
    }

    return res.status(404).sendFile(path.join(staticDir, "404.html"));
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const statusCode = Number(error.statusCode) || 500;
    const safeMessage =
      statusCode >= 500
        ? "Something went wrong. Please try again later."
        : error.message || "Request failed.";

    if (statusCode >= 500) {
      console.error("Server error:", {
        message: error.message,
        stack: error.stack,
        method: req.method,
        path: req.originalUrl
      });
    }

    if (req.path.startsWith("/api/")) {
      return res.status(statusCode).json({
        success: false,
        message: safeMessage
      });
    }

    return res.status(statusCode).sendFile(path.join(staticDir, "error.html"));
  });

  return app;
}

function buildCorsOptions(env) {
  const renderUrl = env.RENDER_EXTERNAL_URL ? env.RENDER_EXTERNAL_URL.replace(/\/$/, "") : "";
  const port = Number(env.PORT) || 3000;
  const localOrigins = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  const defaultOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", ...localOrigins, renderUrl].filter(Boolean);
  const allowedOrigins = [...(env.CORS_ORIGINS || "").split(","), ...defaultOrigins]
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new AppError(403, "Request origin is not allowed."));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  };
}

function requireRuntimeConfig(env) {
  return (req, res, next) => {
    if (req.path === "/admin/login" || req.path === "/health") {
      return next();
    }

    const setupErrors = getRuntimeSetupErrors(env);

    if (!setupErrors.length) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: formatSetupMessage(setupErrors),
      errors: setupErrors
    });
  };
}

function createRateLimiter({ windowMs, max, message, securityEvent }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res) {
      if (securityEvent) {
        void logActivity(req.app.locals.prisma, req, securityEvent, { reason: "rate_limited" });
      }

      return res.status(429).json({
        success: false,
        message
      });
    }
  });
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsSuspiciousInput(value) {
  return suspiciousInputPatterns.some((pattern) => pattern.test(String(value || "")));
}

function sanitizeField(body, field, limit, label, errors, options = {}) {
  const rawValue = body[field];

  if (rawValue === undefined || rawValue === null) {
    if (options.required) {
      errors.push(`${label} is required.`);
    }
    return null;
  }

  if (typeof rawValue !== "string") {
    errors.push(`${label} must be text.`);
    return null;
  }

  const cleaned = normalizeText(rawValue);

  if (options.required && !cleaned) {
    errors.push(`${label} is required.`);
  }

  if (cleaned.length > limit) {
    errors.push(`${label} must be ${limit} characters or fewer.`);
  }

  if (containsSuspiciousInput(rawValue) || containsSuspiciousInput(cleaned)) {
    errors.push(`${label} contains unsupported HTML or script-like content.`);
  }

  return cleaned || null;
}

function ensureAllowedValue(payload, field, label, errors) {
  if (!payload[field]) {
    return;
  }

  if (!allowedValues[field].includes(payload[field])) {
    errors.push(`${label} has an unsupported value.`);
  }
}

function isValidEmail(email) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) {
    return true;
  }

  return /^[0-9+\-().\s]{6,40}$/.test(phone);
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildValidationError(message, details = []) {
  return {
    success: false,
    message,
    errors: details
  };
}

function parseListQuery(query, options = {}) {
  const pagination = parsePagination(query, options);
  const search = sanitizeOptionalQuery(query.search, 120);

  if (search && containsSuspiciousInput(search)) {
    pagination.errors.push("Search contains unsupported HTML or script-like content.");
  }

  return {
    ...pagination,
    search
  };
}

function parsePagination(query, options = {}) {
  const defaultLimit = Number(options.defaultLimit) || 10;
  const maxLimit = Number(options.maxLimit) || 50;
  const errors = [];
  const page = parsePositiveInteger(query.page, 1, "Page", errors);
  const requestedLimit = parsePositiveInteger(query.limit, defaultLimit, "Limit", errors);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip, errors };
}

function parsePositiveInteger(value, fallback, label, errors) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${label} must be a positive number.`);
    return fallback;
  }

  return parsed;
}

function sanitizeOptionalQuery(value, limit) {
  if (value === undefined || value === null) {
    return "";
  }

  return normalizeText(String(value)).slice(0, limit);
}

function buildMessageWhere({ search, language }) {
  const where = {};

  if (search) {
    where.OR = buildContainsFilter(["name", "email", "phone", "subject", "message", "preferredLanguage"], search);
  }

  if (language) {
    where.preferredLanguage = language;
  }

  return where;
}

function buildQuoteWhere({ search, service, businessType }) {
  const where = {};

  if (search) {
    where.OR = buildContainsFilter(
      ["name", "email", "phone", "company", "location", "businessType", "service", "budget", "timeline", "details"],
      search
    );
  }

  if (service) {
    where.service = service;
  }

  if (businessType) {
    where.businessType = businessType;
  }

  return where;
}

function buildContainsFilter(fields, search) {
  return fields.map((field) => ({
    [field]: {
      contains: search,
      mode: "insensitive"
    }
  }));
}

function buildListResponse(data, count, page, limit) {
  return {
    success: true,
    count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
    data
  };
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(`\uFEFF${csv}`);
}

function messagesToCsv(messages) {
  return toCsv(
    ["createdAt", "name", "email", "phone", "subject", "preferredLanguage", "message"],
    messages
  );
}

function quotesToCsv(quotes) {
  return toCsv(
    ["createdAt", "name", "email", "phone", "company", "location", "businessType", "service", "budget", "timeline", "details"],
    quotes
  );
}

function toCsv(fields, rows) {
  const header = fields.join(",");
  const body = rows.map((row) => fields.map((field) => csvCell(row[field])).join(","));
  return [header, ...body].join("\r\n");
}

function csvCell(value) {
  const text = value instanceof Date ? value.toISOString() : String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function validateContact(body) {
  const errors = [];
  const payload = {
    name: sanitizeField(body, "name", contactLimits.name, "Name", errors, { required: true }),
    email: sanitizeField(body, "email", contactLimits.email, "Email", errors)?.toLowerCase() || null,
    phone: sanitizeField(body, "phone", contactLimits.phone, "Phone", errors),
    subject: sanitizeField(body, "subject", contactLimits.subject, "Subject", errors),
    message: sanitizeField(body, "message", contactLimits.message, "Message", errors, { required: true }),
    preferredLanguage: sanitizeField(body, "preferredLanguage", contactLimits.preferredLanguage, "Preferred language", errors)
  };

  if (!payload.email && !payload.phone) {
    errors.push("Email or phone is required.");
  }

  if (!isValidEmail(payload.email)) {
    errors.push("Email format is invalid.");
  }

  if (!isValidPhone(payload.phone)) {
    errors.push("Phone format is invalid.");
  }

  ensureAllowedValue(payload, "preferredLanguage", "Preferred language", errors);

  return { payload, errors };
}

function validateQuote(body) {
  const errors = [];
  const payload = {
    name: sanitizeField(body, "name", quoteLimits.name, "Name", errors, { required: true }),
    email: sanitizeField(body, "email", quoteLimits.email, "Email", errors)?.toLowerCase() || null,
    phone: sanitizeField(body, "phone", quoteLimits.phone, "Phone", errors),
    company: sanitizeField(body, "company", quoteLimits.company, "Company", errors),
    location: sanitizeField(body, "location", quoteLimits.location, "Location", errors),
    businessType: sanitizeField(body, "businessType", quoteLimits.businessType, "Space type", errors),
    service: sanitizeField(body, "service", quoteLimits.service, "Service", errors, { required: true }),
    budget: sanitizeField(body, "budget", quoteLimits.budget, "Budget", errors),
    timeline: sanitizeField(body, "timeline", quoteLimits.timeline, "Timeline", errors),
    details: sanitizeField(body, "details", quoteLimits.details, "Project details", errors, { required: true })
  };

  if (!payload.email && !payload.phone) {
    errors.push("Email or phone is required.");
  }

  if (!isValidEmail(payload.email)) {
    errors.push("Email format is invalid.");
  }

  if (!isValidPhone(payload.phone)) {
    errors.push("Phone format is invalid.");
  }

  ensureAllowedValue(payload, "businessType", "Space type", errors);
  ensureAllowedValue(payload, "service", "Service", errors);
  ensureAllowedValue(payload, "budget", "Budget", errors);
  ensureAllowedValue(payload, "timeline", "Timeline", errors);

  return { payload, errors };
}

function validateAdminLogin(body) {
  const errors = [];
  const payload = {
    email: sanitizeField(body, "email", 120, "Email", errors, { required: true })?.toLowerCase() || null
  };

  if (!isValidEmail(payload.email)) {
    errors.push("Email format is invalid.");
  }

  if (!body || typeof body.password !== "string" || !body.password.trim()) {
    errors.push("Password is required.");
    return { payload, password: "", errors };
  }

  if (body.password.length > 200) {
    errors.push("Password must be 200 characters or fewer.");
  }

  return { payload, password: body.password, errors };
}

function getBearerToken(req) {
  const authorization = req.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

function requireAdmin(prisma, env) {
  return asyncHandler(async (req, res, next) => {
    const jwtSetupErrors = getJwtSetupErrors(env);
    if (jwtSetupErrors.length) {
      return next(new AppError(503, formatSetupMessage(jwtSetupErrors)));
    }

    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login is required."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, { issuer: "ashtech" });
    } catch {
      return res.status(401).json({
        success: false,
        message: "Admin session is invalid or expired."
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.sub }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin session is invalid or expired."
      });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    };
    return next();
  });
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

async function logActivity(prisma, req, event, metadata = {}, adminId = null) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId,
        event,
        ipAddress: getClientIp(req),
        userAgent: req.get("user-agent") || "unknown",
        metadata
      }
    });
  } catch (error) {
    console.error("Unable to write activity log:", error.message);
  }
}

module.exports = {
  createApp,
  validateContact,
  validateQuote,
  validateAdminLogin
};
