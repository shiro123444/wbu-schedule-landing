# ClassFlow Landing

武汉商学院课表产品展示站（Vite + React），现已接入：
- 首页 Hero 右侧评论轮播
- 下载次数实时统计（Express + SQLite）
- 右下角悬浮留言弹层（昵称最多 12 字，留言最多 20 字）

## 环境要求
- Node.js 20+（建议 22）
- npm

## 安装
```bash
npm install
```

## 本地开发
1. 启动 API（终端 1）
```bash
npm run dev:api
```

2. 启动前端（终端 2）
```bash
npm run dev
```

Vite 已配置 `/api` 代理到 `http://localhost:8787`。

## 生产构建
```bash
npm run build
```

## API 一览
- `GET /api/health`：健康检查
- `GET /api/config`：前端配置（留言长度限制、审核开关）
- `GET /api/stats`：获取下载计数
- `POST /api/download`：下载计数 +1
- `GET /api/testimonials`：获取评论列表
- `POST /api/testimonials`：提交用户留言（昵称最多 12 字，留言最多 20 字）

## 留言审核开关
- 默认开启关键词过滤（敏感词命中将拒绝提交）
- 关闭方式：
```bash
FEEDBACK_MODERATION=off npm run dev:api
```

## 数据存储
- SQLite 文件路径：`server/data/classflow.sqlite`
- 数据库文件已在 `.gitignore` 中排除
