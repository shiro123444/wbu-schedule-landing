import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import "react-device-frameset/lib/css/marvel-devices.min.css";

const WEEK_DAYS = ["周一", "周二", "周三", "周四", "周五"];
const DATES = ["02-23", "02-24", "02-25", "02-26", "02-27"];
const GRID_ROWS = 10;
const DAY_HEADER_HEIGHT = 45;
const TIME_COL_WIDTH = 40;

const CLASSFLOW_COLORS = [
  "#FFCC99", // 0
  "#FFE699", // 1
  "#E6FF99", // 2
  "#CCFF99", // 3
  "#99FFB3", // 4
  "#99FFE6", // 5
  "#99FFFF", // 6
  "#99E6FF", // 7
  "#B399FF", // 8
  "#FF99E6", // 9
  "#FF99CC", // 10
  "#FF99B3", // 11
];

const BASE_BLOCKS = [
  {
    id: "math",
    title: "高等数学",
    location: "A301",
    dayIndex: 0,
    start: 0,
    span: 2,
    colorIndex: 0,
  },
  {
    id: "physics",
    title: "大学物理实验",
    location: "实验楼402",
    dayIndex: 1,
    start: 2,
    span: 2,
    colorIndex: 1,
  },
  {
    id: "network",
    title: "计算机网络",
    location: "实验楼309",
    dayIndex: 2,
    start: 4,
    span: 2,
    colorIndex: 7,
  },
  {
    id: "policy",
    title: "形势与政策",
    location: "大礼堂",
    dayIndex: 4,
    start: 6,
    span: 2,
    colorIndex: 5,
  },
];

const IMPORTED_BLOCK = {
  id: "imported-ai",
  title: "智能应用导论",
  location: "图书馆报告厅",
  dayIndex: 1,
  start: 5,
  span: 2,
  colorIndex: 4,
};

const TODAY_COURSES = [
  { id: "t-physics", name: "大学物理实验", time: "08:00 - 09:35", location: "实验楼402", teacher: "张老师", colorIndex: 1, finished: true },
  { id: "t-ai", name: "智能应用导论", time: "14:00 - 15:35", location: "图书馆报告厅", teacher: "李老师", colorIndex: 4, finished: false, isNew: true },
];

const SCENES = [
  { id: "launch", duration: 2400, leftPanel: 0, dayIndex: 0, showSyncPulse: false, showSheet: false, showLoading: false, showSuccess: false, showImported: false, bgDimAlpha: 0, camera: { scale: 1, x: 0, y: 0 }, focusKey: null, showToday: false },
  { id: "swipe", duration: 2100, leftPanel: 1, dayIndex: 1, showSyncPulse: false, showSheet: false, showLoading: false, showSuccess: false, showImported: false, bgDimAlpha: 0, camera: { scale: 1.04, x: -15, y: -17 }, focusKey: null, showToday: false },
  { id: "focus-sync", duration: 2200, leftPanel: 1, dayIndex: 1, showSyncPulse: true, showSheet: false, showLoading: false, showSuccess: false, showImported: false, bgDimAlpha: 0, camera: { scale: 1.36, x: -200, y: -2 }, focusKey: "sync", showToday: false },
  { id: "open-sheet", duration: 2400, leftPanel: 2, dayIndex: 1, showSyncPulse: false, showSheet: true, showLoading: false, showSuccess: false, showImported: false, bgDimAlpha: 0.1, camera: { scale: 1.16, x: -47, y: -191 }, focusKey: "sheet", showToday: false },
  { id: "syncing", duration: 2400, leftPanel: 2, dayIndex: 1, showSyncPulse: false, showSheet: true, showLoading: true, showSuccess: false, showImported: false, bgDimAlpha: 0.1, camera: { scale: 1.18, x: -52, y: -207 }, focusKey: "sheet", showToday: false },
  { id: "done", duration: 2900, leftPanel: 3, dayIndex: 1, showSyncPulse: false, showSheet: false, showLoading: false, showSuccess: true, showImported: true, bgDimAlpha: 0, camera: { scale: 1.15, x: -31, y: -57 }, focusKey: "imported", showToday: false },
  { id: "today", duration: 3200, leftPanel: 3, dayIndex: 1, showSyncPulse: false, showSheet: false, showLoading: false, showSuccess: false, showImported: true, bgDimAlpha: 0, camera: { scale: 1, x: 0, y: 0 }, focusKey: "today-card", showToday: true },
];

const FOCUS_LABELS = {
  sync: "一键同步武商院课表",
  sheet: "一键全自动同步",
  imported: "新课程已导入",
  "today-card": "今日课程一目了然",
};

const OTHER_PANELS = [
  {
    title: "首页",
    lines: ["顶部广告轮播", "课程区插入会员推荐", "底部弹窗常驻"],
  },
  {
    title: "切周",
    lines: ["滑动后先进入推广页", "5 秒倒计时后可关闭", "课表信息被打断"],
  },
  {
    title: "导课",
    lines: ["导入流程多级跳转", "需要反复确认权限", "期间插入活动 banner"],
  },
  {
    title: "结果",
    lines: ["导入完成但弹窗仍在", "首页信息密度不稳定", "课程阅读流持续受扰"],
  },
];

const sceneEase = [0.22, 1, 0.36, 1];
const cameraTransition = {
  duration: 0.9,
  ease: [0.4, 0, 0.2, 1],
};
const springTransition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 0.7,
};

function FocusOverlay({ containerRef, focusKey, focusLabel, reducedMotion }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container) return;

    if (!focusKey) {
      overlay.style.display = "none";
      return undefined;
    }
    overlay.style.display = "";

    let rafId;
    const update = () => {
      const target = container.querySelector(`[data-focus-id="${focusKey}"]`);
      if (target) {
        const cBox = container.getBoundingClientRect();
        const tBox = target.getBoundingClientRect();
        const scale = cBox.width / container.offsetWidth || 1;
        const x = (tBox.left - cBox.left) / scale - 4;
        const y = (tBox.top - cBox.top) / scale - 4;
        const w = tBox.width / scale + 8;
        const h = tBox.height / scale + 8;
        overlay.style.transform = `translate(${x}px, ${y}px)`;
        overlay.style.width = `${w}px`;
        overlay.style.height = `${h}px`;
        overlay.style.opacity = "1";
        overlay.style.display = "";
      } else {
        overlay.style.display = "none";
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [containerRef, focusKey]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute z-40 rounded-lg border-2 border-solarized-orange/90"
      style={{
        opacity: 0,
        top: 0,
        left: 0,
        willChange: "transform, width, height, opacity",
        animation: reducedMotion ? undefined : "focusBreath 1.05s ease-in-out infinite",
      }}
    >
      {focusKey && (
        <span className="absolute -top-7 left-0 rounded-sm border border-solarized-orange bg-solarized-base3 px-2 py-0.5 text-[10px] font-bold text-solarized-base02 whitespace-nowrap">
          {focusLabel}
        </span>
      )}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-1.5 pt-3 text-[10px] font-semibold text-[#1a1c1e]">
      <span>00:23</span>
      <div className="flex items-end gap-1" aria-hidden="true">
        <span className="h-1.5 w-1 rounded-sm bg-[#1a1c1e]"></span>
        <span className="h-2.5 w-1 rounded-sm bg-[#1a1c1e]"></span>
        <span className="h-3.5 w-1 rounded-sm bg-[#1a1c1e]"></span>
        <span className="ml-1 h-2 w-4 rounded-sm border border-[#1a1c1e]/75">
          <span className="block h-full w-[72%] bg-[#1a1c1e]"></span>
        </span>
      </div>
    </div>
  );
}

function PhoneShell({ children, glowClass }) {
  return (
    <div className="relative mx-auto flex justify-center">
      <div
        className={`pointer-events-none absolute -inset-8 rounded-full blur-3xl opacity-35 ${glowClass}`}
        aria-hidden="true"
      ></div>
      <div className="relative origin-top [transform:scale(0.82)] sm:[transform:scale(0.9)] lg:[transform:scale(0.84)] xl:[transform:scale(0.92)]">
        <div className="marvel-device iphone-x" style={{ width: 360, height: 780 }}>
          <div className="notch">
            <div className="camera"></div>
            <div className="speaker"></div>
          </div>
          <div className="top-bar"></div>
          <div className="sleep"></div>
          <div className="bottom-bar"></div>
          <div className="volume"></div>
          <div className="overflow">
            <div className="shadow shadow--tr"></div>
            <div className="shadow shadow--tl"></div>
            <div className="shadow shadow--br"></div>
            <div className="shadow shadow--bl"></div>
          </div>
          <div className="inner-shadow"></div>
          <div className="screen">{children}</div>
        </div>
      </div>
    </div>
  );
}

function OtherScheduleRuntime({ panelIndex, reducedMotion }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-linear-to-b from-[#1d2735] to-[#101824]">
      <div className="flex items-center justify-between px-4 pb-1.5 pt-3 text-[10px] font-semibold text-[#f5f8ff]">
        <span>00:23</span>
        <div className="flex items-end gap-1" aria-hidden="true">
          <span className="h-1.5 w-1 rounded-sm bg-white/70"></span>
          <span className="h-2.5 w-1 rounded-sm bg-white/85"></span>
          <span className="h-3.5 w-1 rounded-sm bg-white"></span>
          <span className="ml-1 h-2 w-4 rounded-sm border border-white/75">
            <span className="block h-full w-[72%] bg-white"></span>
          </span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-1">
        <div className="mb-2 flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-white">
          <span className="text-sm font-bold">某课表 App</span>
          <span className="rounded border border-white/30 px-2 py-0.5 text-[10px]">广告流</span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/20 bg-[#131c2a]/95">
          <motion.div
            className="flex h-full"
            animate={{ x: `-${panelIndex * 100}%` }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.62, ease: sceneEase }
            }
          >
            {OTHER_PANELS.map((panel) => (
              <section key={panel.title} className="min-w-full p-3">
                <div className="space-y-3 rounded-xl border border-white/16 bg-white/7 p-3">
                  <p className="text-sm font-bold text-white">{panel.title}</p>
                  <div className="space-y-2">
                    {panel.lines.map((line) => (
                      <div
                        key={`${panel.title}-${line}`}
                        className="rounded-md border border-[#f87171]/40 bg-[#f87171]/15 px-2 py-1.5 text-[11px] text-white"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-md border border-white/15 bg-black/25 p-2 text-[10px] text-white/80">
                    关键流程被打断
                  </div>
                </div>
              </section>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TodayScheduleView() {
  const isDark = false; // landing page simulates light theme
  const textColor = "#1a1c1e";
  const subtextColor = "#444746";

  return (
    <div className="relative flex flex-col h-full bg-[#fdfcff]">
      <StatusBar />

      <div className="flex flex-col px-4 pt-2">
        <span className="text-[28px] font-bold text-[#1a1c1e] leading-tight">今日课表</span>

        <div className="mt-3 rounded-[22px] px-4 py-[14px] bg-white/55 border"
          style={{ borderImage: "linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.12)) 1" }}>
          <p className="text-base font-bold text-[#1a1c1e]">3月6日 星期四</p>
          <p className="text-sm text-[#5D3B45] mt-1">第 5 周</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pt-[14px] pb-4 flex flex-col gap-[10px]">
        {TODAY_COURSES.map(course => (
          <div
            key={course.id}
            data-focus-id={!course.finished ? "today-card" : undefined}
            className="rounded-[18px] px-[14px] py-[12px] border"
            style={{
              backgroundColor: CLASSFLOW_COLORS[course.colorIndex] + (course.finished ? "6B" : "AD"),
              borderImage: "linear-gradient(to bottom, rgba(255,255,255,0.65), rgba(255,255,255,0.12)) 1",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-base font-bold truncate flex-1 ${course.finished ? "line-through opacity-60" : ""}`}
                style={{ color: textColor }}
              >
                {course.name}
              </span>
              {!course.finished && (
                <span className="w-2 h-2 rounded-full bg-[#39D98A] ml-2 shrink-0"></span>
              )}
            </div>
            <p className="text-[13px] font-semibold mt-[6px] opacity-90" style={{ color: textColor }}>{course.time}</p>
            <p className="text-[13px] mt-[2px] opacity-80 truncate" style={{ color: textColor }}>
              {course.location}{course.teacher ? ` · ${course.teacher}` : ""}
            </p>
            {course.isNew && (
              <span className="inline-block mt-[6px] rounded-[4px] bg-[#39D98A]/25 border border-[#39D98A]/50 px-[6px] py-[2px] text-[10px] font-bold text-[#1a1c1e]">
                NEW - 刚刚导入
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuntimeScheduleGrid({ dayIndex, showImported, reducedMotion }) {
  const blocks = showImported ? [...BASE_BLOCKS, IMPORTED_BLOCK] : BASE_BLOCKS;

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#fdfcff] text-[#1a1c1e]">
      {/* Table Header merged into Grid */}
      <div className="flex border-b border-[#1a1c1e]/10 bg-[#fdfcff]" style={{ height: `${DAY_HEADER_HEIGHT}px` }}>
        <div style={{ width: `${TIME_COL_WIDTH}px` }} className="shrink-0 border-r border-[#1a1c1e]/10 bg-[#fdfcff]"></div>
        {WEEK_DAYS.map((day, idx) => (
          <div key={day} className={`flex-1 flex flex-col items-center justify-center border-l border-[#1a1c1e]/10 ${idx === dayIndex ? 'bg-[#c2e7ff]/40' : 'bg-[#fdfcff]'}`}>
            <span className="text-[15px] font-extrabold text-[#1a1c1e]">{day}</span>
            <span className="text-[10px] text-[#444746] mt-[1px]">{DATES[idx]}</span>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="relative flex-1 bg-[#fdfcff]">
        <div className="absolute inset-y-0 left-0 border-r border-[#1a1c1e]/10 bg-[#fdfcff]" style={{ width: `${TIME_COL_WIDTH}px` }}>
          {Array.from({ length: GRID_ROWS }).map((_, i) => (
            <div key={`t-${i}`} className="flex flex-col items-center justify-center border-b border-[#1a1c1e]/10" style={{ height: `${100 / GRID_ROWS}%` }}>
              <span className="text-[16px] font-bold text-[#1a1c1e]">{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 right-0 bg-[#fdfcff]" style={{ left: `${TIME_COL_WIDTH}px` }}>
          {/* Horizontal Lines */}
          {Array.from({ length: GRID_ROWS }).map((_, i) => (
            <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-[#1a1c1e]/10" style={{ top: `${((i + 1) * 100) / GRID_ROWS}%` }}></div>
          ))}
          {/* Vertical Lines */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-[#1a1c1e]/10" style={{ left: `${((i + 1) * 100) / 5}%` }}></div>
          ))}

          <AnimatePresence>
            {blocks.map(block => {
              return (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={reducedMotion ? { duration: 0 } : { layout: springTransition, default: { duration: 0.42, ease: sceneEase } }}
                  className="absolute"
                  style={{
                    left: `${(block.dayIndex * 100) / 5}%`,
                    width: `${100 / 5}%`,
                    top: `${(block.start * 100) / GRID_ROWS}%`,
                    height: `${(block.span * 100) / GRID_ROWS}%`,
                    padding: "1px" // 1px outerPadding
                  }}
                  data-focus-id={block.id === IMPORTED_BLOCK.id ? "imported" : undefined}
                >
                  <div
                    className="w-full h-full rounded-[4px] border overflow-hidden p-[4px] flex flex-col items-start"
                    style={{
                      backgroundColor: CLASSFLOW_COLORS[block.colorIndex],
                      borderColor: 'rgba(255,255,255,0.32)', // glassPreset 1
                    }}
                  >
                    <span className="text-[13px] font-bold text-[#1a1c1e] leading-[1.2] opacity-90 line-clamp-3 w-full" style={{ fontFamily: "System-ui, sans-serif" }}>{block.title}</span>
                    <span className="text-[10px] text-[#1a1c1e] leading-[1] mt-[3px] opacity-80 truncate w-full" style={{ fontFamily: "System-ui, sans-serif" }}>@{block.location}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ClassFlowRuntime({ scene, reducedMotion }) {
  const runtimeRef = useRef(null);
  const focusLabel = useMemo(
    () => (scene.focusKey ? FOCUS_LABELS[scene.focusKey] : ""),
    [scene.focusKey]
  );

  return (
    <div
      ref={runtimeRef}
      className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#edf4ff] via-[#eef5ff] to-[#f7faff]"
    >
      <AnimatePresence mode="wait">
      {scene.showToday ? (
        <motion.div
          key="today-view"
          className="absolute inset-0"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: sceneEase }}
        >
          <TodayScheduleView />
        </motion.div>
      ) : (
      <motion.div
        key="weekly-view"
        className="absolute inset-0"
        style={{ transformOrigin: "0 0" }}
        initial={{ opacity: 0, x: -40 }}
        animate={{
          opacity: 1,
          x: scene.camera.x,
          scale: scene.camera.scale,
          y: scene.camera.y,
        }}
        exit={{ opacity: 0, x: 40 }}
        transition={reducedMotion ? { duration: 0 } : cameraTransition}
      >
        <div className="relative flex flex-col h-full bg-[#fdfcff]">
          <motion.div
            className="absolute inset-0 bg-black z-10 pointer-events-none"
            animate={{ opacity: scene.bgDimAlpha }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: sceneEase }}
          ></motion.div>

          <StatusBar />

          {/* Top Bar Area */}
          <div className="flex z-0 items-center justify-between px-4" style={{ height: '64px' }}>
            <div className="w-[44px]"></div> {/* Spacer to center title */}
            <span className="text-[18px] font-extrabold text-[#1a1c1e]">第 18 周</span>
            <div className="relative flex justify-end min-w-[44px]">
              <div
                data-focus-id="sync"
                className="flex items-center justify-center w-[36px] h-[36px] rounded-[14px] bg-[#fdfcff]/70 shadow-sm relative overflow-hidden"
                style={{ borderWidth: "0.8px", borderColor: "rgba(255,255,255,0.4)" }}
              >
                {/* Sync Icon */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px] text-[#1a1c1e]">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>

                {scene.showSyncPulse ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-[14px] border-2 border-solarized-blue/80"
                    animate={
                      reducedMotion
                        ? { opacity: 1, scale: 1 }
                        : { opacity: [0.3, 0.9, 0.3], scale: [0.94, 1.08, 0.94] }
                    }
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { duration: 1.05, repeat: Infinity, ease: "easeInOut" }
                    }
                  ></motion.span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 flex flex-col z-0">
            <RuntimeScheduleGrid
              dayIndex={scene.dayIndex}
              showImported={scene.showImported}
              reducedMotion={reducedMotion}
            />
          </div>

          <AnimatePresence>
            {scene.showSheet ? (
              <motion.div
                initial={{ y: 340, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 340, opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.52, ease: sceneEase }}
                className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] bg-[#fbfdf8] px-6 pb-6 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex flex-col"
              >
                <div className="mx-auto w-[44px] h-[5px] rounded-full bg-[#444746]/40 mb-4" />
                <h2 className="text-[22px] font-medium text-center text-[#1a1c1e] mb-5">武汉商学院教务处登录</h2>

                <div className="space-y-4">
                  <div className="w-full h-[56px] rounded-[16px] border border-[#747775]/30 bg-[#fbfdf8] flex items-center px-4">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px] text-[#444746] mr-4">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    <div className="flex flex-col flex-1">
                      <span className="text-[12px] text-[#444746] leading-tight">学号</span>
                      <span className="text-[16px] text-[#1a1c1e] leading-tight mt-[1px]">2024****</span>
                    </div>
                  </div>

                  <div className="w-full h-[56px] rounded-[16px] border border-[#747775]/30 bg-[#fbfdf8] flex items-center px-4">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px] text-[#444746] mr-4">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                    </svg>
                    <div className="flex flex-col flex-1">
                      <span className="text-[12px] text-[#444746] leading-tight">教务系统密码</span>
                      <span className="text-[16px] text-[#1a1c1e] leading-tight mt-[1px] tracking-[4px]">••••••••</span>
                    </div>
                  </div>

                  <div className="w-full h-[64px] rounded-[16px] bg-[#c2e7ff]/45 border border-white/50 flex items-center px-4">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px] text-[#001d35] mr-4">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                    </svg>
                    <span className="text-[16px] font-medium text-[#001d35] flex-1">校园网直连 (校内)</span>
                    <div className="w-[52px] h-[32px] rounded-full bg-[#d3e3fd] border-[2px] border-[#0a56d1] p-[2px] flex justify-end">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#0a56d1]"></div>
                    </div>
                  </div>
                </div>

                <div
                  data-focus-id="sheet"
                  className="mt-8 w-full h-[56px] rounded-[16px] bg-[#0a56d1] flex items-center justify-center"
                >
                  {scene.showLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin w-5 h-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[16px] font-medium text-white">正在获取课表...</span>
                    </div>
                  ) : (
                    <span className="text-[16px] font-medium text-white">一键全自动同步</span>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {scene.showSuccess ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: sceneEase }}
                className="absolute bottom-[24px] left-[16px] right-[16px] z-30 rounded-[4px] bg-[#2b3133] shadow-lg flex items-center px-4 py-3"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px] text-[#81c995] shrink-0 mr-3">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-[#f1f3f4] text-[14px]">已复用登录态，同步成功！</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
      )}
      </AnimatePresence>

      <FocusOverlay
        containerRef={runtimeRef}
        focusKey={scene.focusKey}
        focusLabel={focusLabel}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

export default function PhoneStoryboardComparison({ reducedMotion = false }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const activeScene = SCENES[sceneIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % SCENES.length);
    }, activeScene.duration);

    return () => window.clearTimeout(timer);
  }, [activeScene.duration, sceneIndex]);

  return (
    <>
      <div className="-mt-10 grid gap-8 lg:-mt-6 lg:grid-cols-2 lg:gap-10">
        <PhoneShell glowClass="bg-solarized-red">
          <OtherScheduleRuntime
            panelIndex={activeScene.leftPanel}
            reducedMotion={reducedMotion}
          />
        </PhoneShell>

        <PhoneShell glowClass="bg-solarized-cyan">
          <ClassFlowRuntime scene={activeScene} reducedMotion={reducedMotion} />
        </PhoneShell>
      </div>

      <style>{`
        @keyframes focusBreath {
          0% { box-shadow: 0 0 0 0 rgba(203,75,22,0.35); opacity: 0.72; }
          50% { box-shadow: 0 0 0 8px rgba(203,75,22,0.1); opacity: 1; }
          100% { box-shadow: 0 0 0 0 rgba(203,75,22,0.35); opacity: 0.72; }
        }
      `}</style>
    </>
  );
}
