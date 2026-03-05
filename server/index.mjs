import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import Database from "better-sqlite3";

const PORT = Number(process.env.PORT) || 8787;
const DB_FILE = path.resolve(process.cwd(), "server/data/classflow.sqlite");
const DEFAULT_DOWNLOAD_COUNT = 1286;
const MAX_NICKNAME_LENGTH = 12;
const MAX_QUOTE_LENGTH = 20;
const ENABLE_FEEDBACK_MODERATION = process.env.FEEDBACK_MODERATION !== "off";
const ADMIN_DEFAULT_USERNAME = "admin";
const ADMIN_DEFAULT_PASSWORD = "fyz040913";
const ADMIN_SESSION_DAYS = 30;
const BLOCKED_TERMS = [
  "傻逼",
  "妈的",
  "操你",
  "色情",
  "赌博",
  "诈骗",
];

const DEFAULT_TESTIMONIALS = [
  {
    author: "软件工程 22 级 · 林同学",
    quote:
      "同步教务系统后，临时调课会自动更新，再也不会因为旧截图跑错教室。",
  },
  {
    author: "市场营销 23 级 · 陈同学",
    quote:
      "界面很清爽，没有广告弹窗，打开就能看到今天每节课的时间和地点。",
  },
  {
    author: "数据科学 24 级 · 周同学",
    quote:
      "社团活动多的时候也能快速查空档，课表和生活安排终于不打架了。",
  },
  {
    author: "人工智能 23 级 · 吴同学",
    quote:
      "周视图切换很顺滑，晚课和实验课都看得很清楚，手机上操作也方便。",
  },
  {
    author: "电子商务 22 级 · 黄同学",
    quote:
      "最喜欢它的极简设计，信息密度够高但不乱，期中周复习安排很省心。",
  },
];

const DEFAULT_SITE_CONTENT = {
  hero_badge: "武汉商学院专属",
  hero_title_line1: "你的课表，",
  hero_title_highlight: "只属于你",
  hero_description:
    "专为武汉商学院打造的现代化课表应用。无感自动同步教务系统，完全开源，无隐私泄漏。",
  feature_section_badge: "核心功能",
  feature_section_title: "为什么选择 ClassFlow",
  feature_1_title: "教务系统同步",
  feature_1_desc: "自动对接武汉商学院教务系统，课表实时更新",
  feature_2_title: "现代化界面",
  feature_2_desc: "高对比度设计语言，清晰直观的视觉体验",
  feature_3_title: "轻量无广告",
  feature_3_desc: "纯净体验，专注课表管理，无任何广告干扰",
};

function hashPassword(rawPassword) {
  return crypto.createHash("sha256").update(rawPassword).digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function initDatabase() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL CHECK (value >= 0),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      quote TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.prepare(
    `
      INSERT INTO metrics (key, value)
      VALUES ('downloads', ?)
      ON CONFLICT(key) DO NOTHING
    `
  ).run(DEFAULT_DOWNLOAD_COUNT);

  const testimonialCount = db
    .prepare("SELECT COUNT(*) AS count FROM testimonials")
    .get().count;

  if (testimonialCount === 0) {
    const insert = db.prepare(
      "INSERT INTO testimonials (author, quote) VALUES (@author, @quote)"
    );

    const seed = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });

    seed(DEFAULT_TESTIMONIALS);
  }

  db.prepare(
    `
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (@username, @passwordHash, 'super_admin')
      ON CONFLICT(username) DO UPDATE SET
        password_hash = excluded.password_hash,
        role = excluded.role
    `
  ).run({
    username: ADMIN_DEFAULT_USERNAME,
    passwordHash: hashPassword(ADMIN_DEFAULT_PASSWORD),
  });

  const upsertSiteContent = db.prepare(
    `
      INSERT INTO site_content (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO NOTHING
    `
  );

  const seedSiteContent = db.transaction((entries) => {
    for (const [key, value] of entries) {
      upsertSiteContent.run(key, value);
    }
  });

  seedSiteContent(Object.entries(DEFAULT_SITE_CONTENT));

  return db;
}

const db = initDatabase();

const readDownloadCount = db.prepare(
  "SELECT value, updated_at AS updatedAt FROM metrics WHERE key = 'downloads'"
);

const readTestimonials = db.prepare(`
  SELECT id, author, quote
  FROM testimonials
  ORDER BY id DESC
  LIMIT 12
`);

const readAllTestimonials = db.prepare(`
  SELECT id, author, quote, created_at AS createdAt
  FROM testimonials
  ORDER BY id DESC
`);

const createTestimonial = db.prepare(
  "INSERT INTO testimonials (author, quote) VALUES (?, ?)"
);

const readTestimonialById = db.prepare(
  "SELECT id, author, quote FROM testimonials WHERE id = ?"
);

const deleteTestimonial = db.prepare(
  "DELETE FROM testimonials WHERE id = ?"
);

const updateTestimonial = db.prepare(
  "UPDATE testimonials SET author = ?, quote = ? WHERE id = ?"
);

const readAdminByUsername = db.prepare(
  "SELECT id, username, password_hash AS passwordHash, role FROM admin_users WHERE username = ?"
);

const readAdminById = db.prepare(
  "SELECT id, username, role FROM admin_users WHERE id = ?"
);

const createAdminSession = db.prepare(
  `
    INSERT INTO admin_sessions (token, user_id, expires_at)
    VALUES (?, ?, datetime('now', '+${ADMIN_SESSION_DAYS} days'))
  `
);

const readAdminBySessionToken = db.prepare(`
  SELECT
    s.token,
    s.expires_at AS expiresAt,
    u.id,
    u.username,
    u.role
  FROM admin_sessions s
  JOIN admin_users u ON u.id = s.user_id
  WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
`);

const deleteAdminSession = db.prepare(
  "DELETE FROM admin_sessions WHERE token = ?"
);

const readSiteContentRows = db.prepare(
  "SELECT key, value, updated_at AS updatedAt FROM site_content ORDER BY key ASC"
);

const upsertSiteContent = db.prepare(
  `
    INSERT INTO site_content (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `
);

const incrementDownloadCount = db.transaction(() => {
  db.prepare(
    "UPDATE metrics SET value = value + 1, updated_at = datetime('now') WHERE key = 'downloads'"
  ).run();

  return readDownloadCount.get();
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function findBlockedTerm(author, quote) {
  const lowerAuthor = author.toLowerCase();
  const lowerQuote = quote.toLowerCase();

  return BLOCKED_TERMS.find(
    (term) => lowerAuthor.includes(term) || lowerQuote.includes(term)
  );
}

function buildSiteContentMap() {
  const rows = readSiteContentRows.all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function parseBearerToken(req) {
  const raw = req.headers.authorization;
  if (typeof raw !== "string") return "";
  if (!raw.startsWith("Bearer ")) return "";
  return raw.slice(7).trim();
}

function requireAdmin(req, res, next) {
  const token = parseBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "未登录或登录已过期" });
  }

  const session = readAdminBySessionToken.get(token);
  if (!session) {
    return res.status(401).json({ error: "未登录或登录已过期" });
  }

  req.admin = {
    id: session.id,
    username: session.username,
    role: session.role,
    token,
  };

  return next();
}

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  res.json({
    feedbackModeration: ENABLE_FEEDBACK_MODERATION,
    maxNicknameLength: MAX_NICKNAME_LENGTH,
    maxMessageLength: MAX_QUOTE_LENGTH,
  });
});

app.get("/api/stats", (_req, res) => {
  const row = readDownloadCount.get();
  res.json({
    downloadCount: row.value,
    updatedAt: row.updatedAt,
  });
});

app.post("/api/download", (_req, res) => {
  const row = incrementDownloadCount();

  res.json({
    downloadCount: row.value,
    updatedAt: row.updatedAt,
  });
});

app.get("/api/testimonials", (_req, res) => {
  const testimonials = readTestimonials.all();
  res.json({ testimonials });
});

app.get("/api/site-content", (_req, res) => {
  res.json({ content: buildSiteContentMap() });
});

app.post("/api/testimonials", (req, res) => {
  const author = normalizeText(req.body?.author);
  const quote = normalizeText(req.body?.quote);

  if (!author || !quote) {
    return res.status(400).json({
      error: "昵称和留言不能为空",
    });
  }

  if (author.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({
      error: `昵称不能超过 ${MAX_NICKNAME_LENGTH} 字`,
    });
  }

  if (quote.length > MAX_QUOTE_LENGTH) {
    return res.status(400).json({
      error: `留言不能超过 ${MAX_QUOTE_LENGTH} 字`,
    });
  }

  if (ENABLE_FEEDBACK_MODERATION) {
    const blockedTerm = findBlockedTerm(author, quote);
    if (blockedTerm) {
      return res.status(400).json({
        error: "留言包含敏感词，请修改后再提交",
        blockedTerm,
      });
    }
  }

  const result = createTestimonial.run(author, quote);
  const testimonial = readTestimonialById.get(Number(result.lastInsertRowid));

  return res.status(201).json({ testimonial });
});

app.post("/api/admin/login", (req, res) => {
  const username = normalizeText(req.body?.username);
  const password = normalizeText(req.body?.password);

  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }

  const admin = readAdminByUsername.get(username);
  if (!admin) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }

  const givenHash = hashPassword(password);
  const expectedHash = admin.passwordHash;
  const matches =
    givenHash.length === expectedHash.length &&
    crypto.timingSafeEqual(Buffer.from(givenHash), Buffer.from(expectedHash));

  if (!matches) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }

  const token = createSessionToken();
  createAdminSession.run(token, admin.id);

  return res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
    expiresInDays: ADMIN_SESSION_DAYS,
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  deleteAdminSession.run(req.admin.token);
  res.json({ success: true });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  const admin = readAdminById.get(req.admin.id);
  if (!admin) {
    return res.status(401).json({ error: "管理员不存在" });
  }

  return res.json({ user: admin });
});

app.get("/api/admin/testimonials", requireAdmin, (_req, res) => {
  const testimonials = readAllTestimonials.all();
  return res.json({ testimonials });
});

app.post("/api/admin/testimonials", requireAdmin, (req, res) => {
  const author = normalizeText(req.body?.author);
  const quote = normalizeText(req.body?.quote);

  if (!author || !quote) {
    return res.status(400).json({ error: "昵称和留言不能为空" });
  }

  if (author.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({ error: `昵称不能超过 ${MAX_NICKNAME_LENGTH} 字` });
  }

  if (quote.length > MAX_QUOTE_LENGTH) {
    return res.status(400).json({ error: `留言不能超过 ${MAX_QUOTE_LENGTH} 字` });
  }

  if (ENABLE_FEEDBACK_MODERATION) {
    const blockedTerm = findBlockedTerm(author, quote);
    if (blockedTerm) {
      return res.status(400).json({
        error: "留言包含敏感词，请修改后再提交",
        blockedTerm,
      });
    }
  }

  const result = createTestimonial.run(author, quote);
  const testimonial = readTestimonialById.get(Number(result.lastInsertRowid));
  return res.status(201).json({ testimonial });
});

app.put("/api/admin/testimonials/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const author = normalizeText(req.body?.author);
  const quote = normalizeText(req.body?.quote);

  if (!author || !quote) {
    return res.status(400).json({ error: "昵称和留言不能为空" });
  }

  if (author.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({ error: `昵称不能超过 ${MAX_NICKNAME_LENGTH} 字` });
  }

  if (quote.length > MAX_QUOTE_LENGTH) {
    return res.status(400).json({ error: `留言不能超过 ${MAX_QUOTE_LENGTH} 字` });
  }

  if (ENABLE_FEEDBACK_MODERATION) {
    const blockedTerm = findBlockedTerm(author, quote);
    if (blockedTerm) {
      return res.status(400).json({
        error: "留言包含敏感词，请修改后再提交",
        blockedTerm,
      });
    }
  }

  const info = updateTestimonial.run(author, quote, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "Testimonial not found" });
  }

  const testimonial = readTestimonialById.get(id);
  return res.json({ testimonial });
});

app.delete("/api/admin/testimonials/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const info = deleteTestimonial.run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "Testimonial not found" });
  }

  return res.json({ success: true, deletedId: id });
});

app.get("/api/admin/site-content", requireAdmin, (_req, res) => {
  const rows = readSiteContentRows.all();
  return res.json({ content: rows });
});

app.put("/api/admin/site-content/:key", requireAdmin, (req, res) => {
  const key = normalizeText(req.params.key);
  const value = normalizeText(req.body?.value);

  if (!key) {
    return res.status(400).json({ error: "文案 key 不能为空" });
  }

  if (value.length === 0) {
    return res.status(400).json({ error: "文案内容不能为空" });
  }

  if (value.length > 200) {
    return res.status(400).json({ error: "文案不能超过 200 字" });
  }

  upsertSiteContent.run(key, value);
  return res.json({ success: true, key, value });
});

app.delete("/api/testimonials/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const info = deleteTestimonial.run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "Testimonial not found" });
  }

  return res.json({ success: true, deletedId: id });
});

app.put("/api/testimonials/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const author = normalizeText(req.body?.author);
  const quote = normalizeText(req.body?.quote);

  if (!author || !quote) {
    return res.status(400).json({ error: "昵称和留言不能为空" });
  }

  if (author.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({ error: `昵称不能超过 ${MAX_NICKNAME_LENGTH} 字` });
  }

  if (quote.length > MAX_QUOTE_LENGTH) {
    return res.status(400).json({ error: `留言不能超过 ${MAX_QUOTE_LENGTH} 字` });
  }

  if (ENABLE_FEEDBACK_MODERATION) {
    const blockedTerm = findBlockedTerm(author, quote);
    if (blockedTerm) {
      return res.status(400).json({
        error: "留言包含敏感词，请修改后再提交",
        blockedTerm,
      });
    }
  }

  const info = updateTestimonial.run(author, quote, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "Testimonial not found" });
  }

  const testimonial = readTestimonialById.get(id);
  return res.json({ testimonial });
});

app.listen(PORT, () => {
  console.log(`[classflow-api] running on http://localhost:${PORT}`);
});
