# WBU ClassFlow Landing

武汉商学院课程表官网展示页（独立静态站点）。

## 设计目标

- 复用 `cliproxy` / `Kiro-Kroxy` 的液态玻璃思路（`backdrop-filter + 半透明 + 高光边框`）
- 布局和动效全部独立设计，不沿用现有公益站结构
- 纯展示导向，聚焦品牌与页面模块说明
- 对桌面和移动端都可正常访问

## 文件结构

- `index.html`: 页面结构与文案
- `styles.css`: 视觉风格、响应式布局、动画
- `script.js`: 滚动显隐动效

## 本地预览

在目录内使用任意静态服务即可，例如：

```bash
cd /root/wbu-schedule-landing
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`。
# wbu-schedule-landing
