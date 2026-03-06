# ClassFlow Landing

武汉商学院课表产品展示站（Vite + React），现已接入：
- 首页 Hero 右侧评论轮播
- 下载次数实时统计（Express + SQLite）
- 右下角悬浮留言弹层（昵称最多 12 字，留言最多 20 字）
- 服务端每 10 分钟自动拉取 GitHub 最新安装包到本机缓存，仅保留当前版本
- `/admin` 可管理下载源、手动上传替代安装包、删除当前缓存文件

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

## 管理员后台
- 访问路径：`/admin`
- 默认账号名：`admin`，可通过 `ADMIN_USERNAME` 覆盖
- 密码不再写死在源码里：
```bash
ADMIN_PASSWORD='your-strong-password' npm run dev:api
```
- 如果数据库里还没有管理员，且未提供 `ADMIN_PASSWORD`，服务端会在首次启动时生成一次性随机密码，并打印到控制台日志。
- 如果历史数据库仍保留旧的默认密码哈希，服务端启动时会打印警告，提示你尽快通过 `ADMIN_PASSWORD` 轮换。

## 下载缓存策略
- 前端的下载按钮统一读取 `/api/config` 返回的 `downloadUrl`
- 当服务器本机缓存目录存在当前安装包时，下载按钮会优先走 `/downloads/current`
- 如果本机没有缓存文件，则回退到后台配置的自托管地址；若仍未配置，则回退到 GitHub Release
- 自动同步和管理员上传都会清理旧文件，仅保留当前有效版本，避免服务器堆积历史包
- 后台可设置“同步源覆盖地址”，把自动拉取切到 GitHub 代理、镜像或其它直链资源

## 生产部署脚本
- 启动脚本：`scripts/start-api-production.sh`
- systemd 安装脚本：`scripts/install-systemd-service.sh`
- 前端发布脚本：`scripts/deploy-frontend.sh`
- 安装脚本会创建 `/etc/wbu-schedule-api.env`，并把 systemd 服务接到该环境文件上
- 如需让自动同步走 `mihomo`/`clash` 代理，可在环境文件中设置：`DOWNLOAD_SYNC_PROXY_URL=http://127.0.0.1:7890`

## 留言审核开关
- 默认开启关键词过滤（敏感词命中将拒绝提交）
- 关闭方式：
```bash
FEEDBACK_MODERATION=off npm run dev:api
```

## 数据存储
- SQLite 文件路径：`server/data/classflow.sqlite`
- 数据库文件已在 `.gitignore` 中排除
