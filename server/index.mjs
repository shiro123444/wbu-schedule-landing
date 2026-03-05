import fs from "node:fs";
import path from "node:path";
import express from "express";
import Database from "better-sqlite3";

const PORT = Number(process.env.PORT) || 8787;
const DB_FILE = path.resolve(process.cwd(), "server/data/classflow.sqlite");
const DEFAULT_DOWNLOAD_COUNT = 1286;
const MAX_NICKNAME_LENGTH = 12;
const MAX_QUOTE_LENGTH = 20;
const ENABLE_FEEDBACK_MODERATION = process.env.FEEDBACK_MODERATION !== "off";
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
