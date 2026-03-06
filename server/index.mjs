import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import express from "express";
import Database from "better-sqlite3";

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 8787;
const DB_FILE = path.resolve(process.cwd(), "server/data/classflow.sqlite");
const DOWNLOADS_DIR = path.resolve(process.cwd(), "server/downloads");
const DOWNLOADS_TMP_DIR = path.join(DOWNLOADS_DIR, ".tmp");
const DEFAULT_DOWNLOAD_COUNT = 1286;
const MAX_NICKNAME_LENGTH = 12;
const MAX_QUOTE_LENGTH = 20;
const MAX_DOWNLOAD_UPLOAD_BYTES = 300 * 1024 * 1024;
const DOWNLOAD_SYNC_API_TIMEOUT_MS = 15 * 1000;
const DOWNLOAD_SYNC_FILE_TIMEOUT_MS = 2 * 60 * 1000;
const ENABLE_FEEDBACK_MODERATION = process.env.FEEDBACK_MODERATION !== "off";
const DEFAULT_DOWNLOAD_URL =
  "https://github.com/shiro123444/ClassFlow/releases/latest/download/app-prod-arm64-v8a-release.apk";
const DOWNLOAD_URL = process.env.DOWNLOAD_URL || DEFAULT_DOWNLOAD_URL;
const ADMIN_DEFAULT_USERNAME = normalizeText(process.env.ADMIN_USERNAME) || "admin";
const ADMIN_SESSION_DAYS = 30;
const DOWNLOAD_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_GITHUB_REPO = "shiro123444/ClassFlow";
const DEFAULT_GITHUB_ASSET_NAME = "app-prod-arm64-v8a-release.apk";
const BLOCKED_TERMS = ["傻逼", "妈的", "操你", "色情", "赌博", "诈骗"];
const LEGACY_ADMIN_PASSWORD_HASH =
  "970a1b0ca554572a9dacf1f1eedcb66fb924514b897039eea6137ecff630d221";
const DOWNLOAD_ROUTE = "/downloads/current";
const DOWNLOAD_SYNC_PROXY_URL =
  normalizeText(process.env.DOWNLOAD_SYNC_PROXY_URL) ||
  normalizeText(process.env.ALL_PROXY) ||
  normalizeText(process.env.all_proxy) ||
  normalizeText(process.env.HTTPS_PROXY) ||
  normalizeText(process.env.https_proxy) ||
  normalizeText(process.env.HTTP_PROXY) ||
  normalizeText(process.env.http_proxy);

const DEFAULT_TESTIMONIALS = [
  {
    author: "软件工程 22 级 · 林同学",
    quote: "同步教务系统后，临时调课会自动更新，再也不会因为旧截图跑错教室。",
  },
  {
    author: "市场营销 23 级 · 陈同学",
    quote: "界面很清爽，没有广告弹窗，打开就能看到今天每节课的时间和地点。",
  },
  {
    author: "数据科学 24 级 · 周同学",
    quote: "社团活动多的时候也能快速查空档，课表和生活安排终于不打架了。",
  },
  {
    author: "人工智能 23 级 · 吴同学",
    quote: "周视图切换很顺滑，晚课和实验课都看得很清楚，手机上操作也方便。",
  },
  {
    author: "电子商务 22 级 · 黄同学",
    quote: "最喜欢它的极简设计，信息密度够高但不乱，期中周复习安排很省心。",
  },
];

const DEFAULT_SITE_CONTENT = {
  hero_badge: "武汉商学院专属",
  hero_title_line1: "你的课表",
  hero_title_highlight: "只属于你",
  hero_description:
    "专为武汉商学院打造的现代化课表应用。无感自动同步教务系统，完全开源。",
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

function createBootstrapPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initDatabase() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  fs.mkdirSync(DOWNLOADS_TMP_DIR, { recursive: true });

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

    CREATE TABLE IF NOT EXISTS download_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      prefer_self_hosted INTEGER NOT NULL DEFAULT 1,
      self_hosted_url TEXT NOT NULL DEFAULT '',
      sync_source_url TEXT NOT NULL DEFAULT '',
      github_repo TEXT NOT NULL DEFAULT 'shiro123444/ClassFlow',
      github_asset_name TEXT NOT NULL DEFAULT 'app-prod-arm64-v8a-release.apk',
      local_file_name TEXT NOT NULL DEFAULT '',
      local_original_name TEXT NOT NULL DEFAULT '',
      local_file_size INTEGER NOT NULL DEFAULT 0,
      local_file_source TEXT NOT NULL DEFAULT '',
      local_updated_at TEXT NOT NULL DEFAULT '',
      latest_release_tag TEXT NOT NULL DEFAULT '',
      latest_github_url TEXT NOT NULL DEFAULT '',
      last_sync_status TEXT NOT NULL DEFAULT 'never',
      last_sync_error TEXT NOT NULL DEFAULT '',
      last_synced_at TEXT NOT NULL DEFAULT ''
    );
  `);

  ensureColumn(
    db,
    "download_settings",
    "sync_source_url",
    "TEXT NOT NULL DEFAULT ''"
  );
  ensureColumn(
    db,
    "download_settings",
    "local_file_name",
    "TEXT NOT NULL DEFAULT ''"
  );
  ensureColumn(
    db,
    "download_settings",
    "local_original_name",
    "TEXT NOT NULL DEFAULT ''"
  );
  ensureColumn(
    db,
    "download_settings",
    "local_file_size",
    "INTEGER NOT NULL DEFAULT 0"
  );
  ensureColumn(
    db,
    "download_settings",
    "local_file_source",
    "TEXT NOT NULL DEFAULT ''"
  );
  ensureColumn(
    db,
    "download_settings",
    "local_updated_at",
    "TEXT NOT NULL DEFAULT ''"
  );

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

  const readAdminSeedByUsername = db.prepare(
    "SELECT id, username, password_hash AS passwordHash, role FROM admin_users WHERE username = ?"
  );

  const upsertAdminUser = db.prepare(
    `
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (@username, @passwordHash, 'super_admin')
      ON CONFLICT(username) DO UPDATE SET
        password_hash = excluded.password_hash,
        role = excluded.role
    `
  );

  const createAdminUser = db.prepare(
    `
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (@username, @passwordHash, 'super_admin')
    `
  );

  const adminPassword = normalizeText(process.env.ADMIN_PASSWORD);
  const existingAdmin = readAdminSeedByUsername.get(ADMIN_DEFAULT_USERNAME);

  if (adminPassword) {
    upsertAdminUser.run({
      username: ADMIN_DEFAULT_USERNAME,
      passwordHash: hashPassword(adminPassword),
    });
  } else if (!existingAdmin) {
    const bootstrapPassword = createBootstrapPassword();
    createAdminUser.run({
      username: ADMIN_DEFAULT_USERNAME,
      passwordHash: hashPassword(bootstrapPassword),
    });

    console.warn(
      `[classflow-api] bootstrap admin created: username=${ADMIN_DEFAULT_USERNAME} password=${bootstrapPassword}`
    );
    console.warn(
      "[classflow-api] Set ADMIN_PASSWORD in the environment to rotate this bootstrap password."
    );
  } else if (existingAdmin.passwordHash === LEGACY_ADMIN_PASSWORD_HASH) {
    console.warn(
      `[classflow-api] Admin ${ADMIN_DEFAULT_USERNAME} is still using a legacy default password hash. Set ADMIN_PASSWORD to rotate it.`
    );
  }

  const insertSiteContent = db.prepare(
    `
      INSERT INTO site_content (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO NOTHING
    `
  );

  const seedSiteContent = db.transaction((entries) => {
    for (const [key, value] of entries) {
      insertSiteContent.run(key, value);
    }
  });

  seedSiteContent(Object.entries(DEFAULT_SITE_CONTENT));

  db.prepare(
    `
      INSERT INTO download_settings (
        id,
        prefer_self_hosted,
        self_hosted_url,
        sync_source_url,
        github_repo,
        github_asset_name,
        local_file_name,
        local_original_name,
        local_file_size,
        local_file_source,
        local_updated_at,
        latest_release_tag,
        latest_github_url,
        last_sync_status,
        last_sync_error,
        last_synced_at
      )
      VALUES (1, 1, '', '', ?, ?, '', '', 0, '', '', '', '', 'never', '', '')
      ON CONFLICT(id) DO NOTHING
    `
  ).run(DEFAULT_GITHUB_REPO, DEFAULT_GITHUB_ASSET_NAME);

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

const deleteTestimonial = db.prepare("DELETE FROM testimonials WHERE id = ?");

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

const deleteAdminSession = db.prepare("DELETE FROM admin_sessions WHERE token = ?");

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

const readDownloadSettings = db.prepare(`
  SELECT
    id,
    prefer_self_hosted AS preferSelfHosted,
    self_hosted_url AS selfHostedUrl,
    sync_source_url AS syncSourceUrl,
    github_repo AS githubRepo,
    github_asset_name AS githubAssetName,
    local_file_name AS localFileName,
    local_original_name AS localOriginalName,
    local_file_size AS localFileSize,
    local_file_source AS localFileSource,
    local_updated_at AS localUpdatedAt,
    latest_release_tag AS latestReleaseTag,
    latest_github_url AS latestGithubUrl,
    last_sync_status AS lastSyncStatus,
    last_sync_error AS lastSyncError,
    last_synced_at AS lastSyncedAt
  FROM download_settings
  WHERE id = 1
`);

const updateDownloadSettings = db.prepare(`
  UPDATE download_settings
  SET
    prefer_self_hosted = @preferSelfHosted,
    self_hosted_url = @selfHostedUrl,
    sync_source_url = @syncSourceUrl,
    github_repo = @githubRepo,
    github_asset_name = @githubAssetName
  WHERE id = 1
`);

const markDownloadSyncSuccess = db.prepare(`
  UPDATE download_settings
  SET
    latest_release_tag = @latestReleaseTag,
    latest_github_url = @latestGithubUrl,
    last_sync_status = 'success',
    last_sync_error = '',
    last_synced_at = datetime('now')
  WHERE id = 1
`);

const markDownloadSyncFailure = db.prepare(`
  UPDATE download_settings
  SET
    last_sync_status = 'failed',
    last_sync_error = @lastSyncError,
    last_synced_at = datetime('now')
  WHERE id = 1
`);

const setLocalDownloadMetadata = db.prepare(`
  UPDATE download_settings
  SET
    local_file_name = @localFileName,
    local_original_name = @localOriginalName,
    local_file_size = @localFileSize,
    local_file_source = @localFileSource,
    local_updated_at = datetime('now')
  WHERE id = 1
`);

const clearLocalDownloadMetadata = db.prepare(`
  UPDATE download_settings
  SET
    local_file_name = '',
    local_original_name = '',
    local_file_size = 0,
    local_file_source = '',
    local_updated_at = ''
  WHERE id = 1
`);

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

function normalizeRepo(value) {
  const repo = normalizeText(value);
  if (!repo) return "";
  const isValid = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
  return isValid ? repo : "";
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeFileName(value) {
  const fileName = path.basename(normalizeText(value));
  if (!fileName || fileName === "." || fileName === "..") return "";

  return fileName
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

function getLocalDownloadPath(settings) {
  const fileName = normalizeFileName(settings?.localFileName);
  if (!fileName) return "";

  const filePath = path.join(DOWNLOADS_DIR, fileName);
  if (!fs.existsSync(filePath)) return "";

  return filePath;
}

function getLocalDownloadFileInfo(settings) {
  const localPath = getLocalDownloadPath(settings);
  if (!localPath) return null;

  const stat = fs.statSync(localPath);
  return {
    name: path.basename(localPath),
    originalName: settings.localOriginalName || path.basename(localPath),
    size: stat.size,
    source: settings.localFileSource || "unknown",
    updatedAt: settings.localUpdatedAt || new Date(stat.mtimeMs).toISOString(),
    url: DOWNLOAD_ROUTE,
    active: true,
  };
}

async function listManagedDownloadFiles() {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const settings = readDownloadSettings.get();
  const activeInfo = getLocalDownloadFileInfo(settings);
  const entries = await fs.promises.readdir(DOWNLOADS_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(DOWNLOADS_DIR, entry.name);
    const stat = await fs.promises.stat(filePath);
    files.push({
      name: entry.name,
      originalName:
        activeInfo && activeInfo.name === entry.name
          ? activeInfo.originalName
          : entry.name,
      size: stat.size,
      source:
        activeInfo && activeInfo.name === entry.name ? activeInfo.source : "unknown",
      updatedAt: new Date(stat.mtimeMs).toISOString(),
      url: activeInfo && activeInfo.name === entry.name ? DOWNLOAD_ROUTE : "",
      active: Boolean(activeInfo && activeInfo.name === entry.name),
    });
  }

  files.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return files;
}

async function clearDownloadDirectory(keepFileName = "") {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const entries = await fs.promises.readdir(DOWNLOADS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".tmp") continue;
    if (keepFileName && entry.name === keepFileName) continue;

    const fullPath = path.join(DOWNLOADS_DIR, entry.name);
    await fs.promises.rm(fullPath, { recursive: true, force: true });
  }
}

async function clearDownloadTempDirectory() {
  fs.mkdirSync(DOWNLOADS_TMP_DIR, { recursive: true });
  const entries = await fs.promises.readdir(DOWNLOADS_TMP_DIR, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(DOWNLOADS_TMP_DIR, entry.name);
    await fs.promises.rm(fullPath, { recursive: true, force: true });
  }
}

async function writeResponseToFile(response, filePath) {
  if (!response.body) {
    throw new Error("下载响应为空");
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_DOWNLOAD_UPLOAD_BYTES) {
    throw new Error("下载文件超过服务器限制");
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(filePath));
  const stat = await fs.promises.stat(filePath);
  if (!stat.size) {
    throw new Error("下载文件为空");
  }
  return stat.size;
}

async function downloadWithCurl(url, filePath) {
  const args = [
    "-L",
    "--fail",
    "--silent",
    "--show-error",
    "--connect-timeout",
    "15",
    "--max-time",
    String(Math.ceil(DOWNLOAD_SYNC_FILE_TIMEOUT_MS / 1000)),
    "--output",
    filePath,
  ];

  if (DOWNLOAD_SYNC_PROXY_URL) {
    args.push("--proxy", DOWNLOAD_SYNC_PROXY_URL);
  }

  args.push(url);
  await execFileAsync("curl", args);

  const stat = await fs.promises.stat(filePath);
  if (!stat.size) {
    throw new Error("下载文件为空");
  }

  if (stat.size > MAX_DOWNLOAD_UPLOAD_BYTES) {
    throw new Error("下载文件超过服务器限制");
  }

  return stat.size;
}

async function downloadUrlToTempFile(url, filePath) {
  try {
    return await downloadWithCurl(url, filePath);
  } catch {
    const response = await fetch(url, {
      headers: {
        Accept: "application/octet-stream,*/*",
        "User-Agent": "classflow-download-sync",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(DOWNLOAD_SYNC_FILE_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`资源下载失败 ${response.status}`);
    }

    return await writeResponseToFile(response, filePath);
  }
}

async function fetchReleaseMetadata(apiUrl) {
  const curlArgs = [
    "-L",
    "--fail",
    "--silent",
    "--show-error",
    "--connect-timeout",
    "15",
    "--max-time",
    String(Math.ceil(DOWNLOAD_SYNC_API_TIMEOUT_MS / 1000)),
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    "User-Agent: classflow-download-sync",
  ];

  if (DOWNLOAD_SYNC_PROXY_URL) {
    curlArgs.push("--proxy", DOWNLOAD_SYNC_PROXY_URL);
  }

  curlArgs.push(apiUrl);

  try {
    const { stdout } = await execFileAsync("curl", curlArgs);
    return JSON.parse(stdout);
  } catch {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "classflow-download-sync",
      },
      signal: AbortSignal.timeout(DOWNLOAD_SYNC_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }

    return response.json();
  }
}

async function replaceManagedDownload(tempPath, options) {
  const fileName = normalizeFileName(options.fileName || options.originalName);
  if (!fileName) {
    await fs.promises.rm(tempPath, { force: true });
    throw new Error("文件名无效");
  }

  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const finalPath = path.join(DOWNLOADS_DIR, fileName);

  if (fs.existsSync(finalPath)) {
    await fs.promises.rm(finalPath, { force: true });
  }

  await fs.promises.rename(tempPath, finalPath);
  await clearDownloadDirectory(fileName);

  const stat = await fs.promises.stat(finalPath);
  setLocalDownloadMetadata.run({
    localFileName: fileName,
    localOriginalName: options.originalName || fileName,
    localFileSize: stat.size,
    localFileSource: options.source,
  });

  return {
    fileName,
    filePath: finalPath,
    size: stat.size,
  };
}

function resolveDownloadUrl(settings) {
  if (settings.preferSelfHosted && getLocalDownloadPath(settings)) {
    return DOWNLOAD_ROUTE;
  }
  if (settings.preferSelfHosted && settings.selfHostedUrl) {
    return settings.selfHostedUrl;
  }
  if (settings.latestGithubUrl) {
    return settings.latestGithubUrl;
  }
  return DOWNLOAD_URL;
}

let isSyncingDownload = false;

async function syncLatestDownload(trigger = "interval") {
  if (isSyncingDownload) {
    return {
      trigger,
      skipped: true,
      reason: "sync_in_progress",
    };
  }

  isSyncingDownload = true;
  let tempPath = "";
  try {
    const settings = readDownloadSettings.get();
    const shouldUseLocalDownload = Boolean(settings?.preferSelfHosted);
    const repo = normalizeRepo(settings?.githubRepo) || DEFAULT_GITHUB_REPO;
    const assetName =
      normalizeText(settings?.githubAssetName) || DEFAULT_GITHUB_ASSET_NAME;
    const syncSourceUrl = normalizeText(settings?.syncSourceUrl);
    let latestReleaseTag = "";
    let latestGithubUrl = "";
    let selectedFileName = assetName;

    if (syncSourceUrl) {
      latestReleaseTag = "direct-url";
      latestGithubUrl = syncSourceUrl;
      selectedFileName =
        normalizeFileName(path.basename(new URL(syncSourceUrl).pathname)) || assetName;
    } else {
      const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
      const payload = await fetchReleaseMetadata(apiUrl);
      const assets = Array.isArray(payload?.assets) ? payload.assets : [];
      const exactAsset = assets.find((item) => item?.name === assetName);
      const fuzzyAsset = assets.find(
        (item) =>
          typeof item?.name === "string" &&
          item.name.toLowerCase().includes(assetName.toLowerCase())
      );
      const fallbackApk = assets.find(
        (item) =>
          typeof item?.name === "string" && item.name.toLowerCase().endsWith(".apk")
      );
      const chosen = exactAsset || fuzzyAsset || fallbackApk;

      latestGithubUrl = normalizeText(chosen?.browser_download_url);
      if (!latestGithubUrl) {
        throw new Error("未找到可用的 release 下载资源");
      }

      latestReleaseTag = normalizeText(payload?.tag_name);
      selectedFileName = chosen?.name || assetName;
    }

    let fileSize = 0;
    if (shouldUseLocalDownload) {
      await clearDownloadTempDirectory();
      fs.mkdirSync(DOWNLOADS_TMP_DIR, { recursive: true });
      tempPath = path.join(
        DOWNLOADS_TMP_DIR,
        `${Date.now()}-${crypto.randomUUID()}.download`
      );
      fileSize = await downloadUrlToTempFile(latestGithubUrl, tempPath);
      await replaceManagedDownload(tempPath, {
        fileName: selectedFileName,
        originalName: selectedFileName,
        source: "github_sync",
      });
    }

    markDownloadSyncSuccess.run({
      latestReleaseTag,
      latestGithubUrl,
    });

    const next = readDownloadSettings.get();
    return {
      trigger,
      skipped: false,
      settings: next,
      effectiveDownloadUrl: resolveDownloadUrl(next),
      localFileSize: fileSize,
    };
  } catch (error) {
    if (tempPath) {
      await fs.promises.rm(tempPath, { force: true }).catch(() => {});
    }
    const message = normalizeText(error?.message) || "同步失败";
    markDownloadSyncFailure.run({ lastSyncError: message.slice(0, 300) });
    return {
      trigger,
      skipped: false,
      error: message,
    };
  } finally {
    isSyncingDownload = false;
  }
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
app.use(express.json({ limit: "300mb" }));

app.get(DOWNLOAD_ROUTE, (req, res) => {
  const settings = readDownloadSettings.get();
  if (settings.preferSelfHosted) {
    const localPath = getLocalDownloadPath(settings);

    if (localPath) {
      return res.download(localPath, settings.localOriginalName || path.basename(localPath));
    }

    if (settings.selfHostedUrl) {
      return res.redirect(settings.selfHostedUrl);
    }
  }

  return res.redirect(settings.latestGithubUrl || DOWNLOAD_URL);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  const settings = readDownloadSettings.get();
  res.json({
    feedbackModeration: ENABLE_FEEDBACK_MODERATION,
    maxNicknameLength: MAX_NICKNAME_LENGTH,
    maxMessageLength: MAX_QUOTE_LENGTH,
    downloadUrl: resolveDownloadUrl(settings),
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
  const settings = readDownloadSettings.get();

  res.json({
    downloadCount: row.value,
    updatedAt: row.updatedAt,
    downloadUrl: resolveDownloadUrl(settings),
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
  return res.json({ success: true });
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

  if (!value) {
    return res.status(400).json({ error: "文案内容不能为空" });
  }

  if (value.length > 200) {
    return res.status(400).json({ error: "文案不能超过 200 字" });
  }

  upsertSiteContent.run(key, value);
  return res.json({ success: true, key, value });
});

app.get("/api/admin/download-settings", requireAdmin, (_req, res) => {
  const settings = readDownloadSettings.get();
  return res.json({
    settings,
    effectiveDownloadUrl: resolveDownloadUrl(settings),
    localFile: getLocalDownloadFileInfo(settings),
    syncIntervalMinutes: DOWNLOAD_SYNC_INTERVAL_MS / 60000,
  });
});

app.get("/api/admin/download-files", requireAdmin, async (_req, res) => {
  const settings = readDownloadSettings.get();
  const files = await listManagedDownloadFiles();
  return res.json({
    directory: DOWNLOADS_DIR,
    files,
    activeFile: getLocalDownloadFileInfo(settings),
  });
});

app.post("/api/admin/download-files/upload", requireAdmin, async (req, res) => {
  const fileName = normalizeFileName(req.body?.fileName);
  const rawBase64 = normalizeText(req.body?.contentBase64).replace(
    /^data:[^;]+;base64,/,""
  );

  if (!fileName) {
    return res.status(400).json({ error: "文件名不能为空" });
  }

  if (!rawBase64) {
    return res.status(400).json({ error: "上传内容不能为空" });
  }

  let buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    return res.status(400).json({ error: "文件内容不是有效的 Base64" });
  }

  if (!buffer.length) {
    return res.status(400).json({ error: "上传文件为空" });
  }

  if (buffer.length > MAX_DOWNLOAD_UPLOAD_BYTES) {
    return res.status(400).json({ error: "上传文件超过服务器限制" });
  }

  fs.mkdirSync(DOWNLOADS_TMP_DIR, { recursive: true });
  const tempPath = path.join(
    DOWNLOADS_TMP_DIR,
    `${Date.now()}-${crypto.randomUUID()}.upload`
  );

  try {
    await fs.promises.writeFile(tempPath, buffer);
    await replaceManagedDownload(tempPath, {
      fileName,
      originalName: fileName,
      source: "admin_upload",
    });
  } catch (error) {
    await fs.promises.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }

  const settings = readDownloadSettings.get();
  return res.status(201).json({
    success: true,
    activeFile: getLocalDownloadFileInfo(settings),
    effectiveDownloadUrl: resolveDownloadUrl(settings),
  });
});

app.delete("/api/admin/download-files/current", requireAdmin, async (_req, res) => {
  const settings = readDownloadSettings.get();
  const localPath = getLocalDownloadPath(settings);

  if (localPath) {
    await fs.promises.rm(localPath, { force: true });
  }

  await clearDownloadDirectory();
  clearLocalDownloadMetadata.run();

  const next = readDownloadSettings.get();
  return res.json({
    success: true,
    effectiveDownloadUrl: resolveDownloadUrl(next),
  });
});

app.put("/api/admin/download-settings", requireAdmin, (req, res) => {
  const current = readDownloadSettings.get();
  const next = {
    preferSelfHosted:
      typeof req.body?.preferSelfHosted === "boolean"
        ? req.body.preferSelfHosted
          ? 1
          : 0
        : current.preferSelfHosted,
    selfHostedUrl:
      req.body?.selfHostedUrl === undefined
        ? current.selfHostedUrl
        : normalizeText(req.body.selfHostedUrl),
    syncSourceUrl:
      req.body?.syncSourceUrl === undefined
        ? current.syncSourceUrl
        : normalizeText(req.body.syncSourceUrl),
    githubRepo:
      req.body?.githubRepo === undefined
        ? current.githubRepo
        : normalizeRepo(req.body.githubRepo),
    githubAssetName:
      req.body?.githubAssetName === undefined
        ? current.githubAssetName
        : normalizeText(req.body.githubAssetName),
  };

  if (req.body?.githubRepo !== undefined && !next.githubRepo) {
    return res.status(400).json({ error: "GitHub 仓库格式应为 owner/repo" });
  }

  if (!next.githubAssetName) {
    return res.status(400).json({ error: "资源文件名不能为空" });
  }

  if (next.selfHostedUrl.length > 500) {
    return res.status(400).json({ error: "自托管链接过长" });
  }

  if (next.syncSourceUrl.length > 500) {
    return res.status(400).json({ error: "同步源地址过长" });
  }

  if (next.syncSourceUrl && !isHttpUrl(next.syncSourceUrl)) {
    return res.status(400).json({ error: "同步源地址必须是有效的 http/https 链接" });
  }

  updateDownloadSettings.run(next);
  const settings = readDownloadSettings.get();
  return res.json({
    success: true,
    settings,
    effectiveDownloadUrl: resolveDownloadUrl(settings),
  });
});

app.post("/api/admin/download-settings/sync", requireAdmin, async (_req, res) => {
  const result = await syncLatestDownload("manual");
  if (result.error) {
    return res.status(500).json({ success: false, ...result });
  }
  return res.json({ success: true, ...result });
});

setTimeout(() => {
  syncLatestDownload("startup").catch(() => {});
}, 1000);

const downloadSyncTimer = setInterval(() => {
  syncLatestDownload("interval").catch(() => {});
}, DOWNLOAD_SYNC_INTERVAL_MS);
downloadSyncTimer.unref();

app.listen(PORT, () => {
  console.log(`[classflow-api] running on http://localhost:${PORT}`);
});
