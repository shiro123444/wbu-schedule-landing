import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import WelcomeScreen from "./components/WelcomeScreen";

const DAYS = [
  {
    key: "mon",
    label: "周一",
    courses: [
      { time: "08:00", title: "高等数学 II", location: "教学楼 A301" },
      { time: "10:10", title: "数据结构", location: "实验楼 B205" },
      { time: "14:00", title: "Web 前端开发", location: "机房 C102" },
    ],
  },
  {
    key: "tue",
    label: "周二",
    courses: [
      { time: "09:50", title: "大学英语 IV", location: "教学楼 A205" },
      { time: "13:30", title: "概率统计", location: "教学楼 B301" },
      { time: "19:00", title: "智能应用导论", location: "图书馆报告厅" },
    ],
  },
  {
    key: "wed",
    label: "周三",
    courses: [
      { time: "08:00", title: "数据库原理", location: "实验楼 B203" },
      { time: "10:10", title: "市场营销", location: "教学楼 D401" },
      { time: "15:40", title: "软件工程", location: "教学楼 A302" },
    ],
  },
  {
    key: "thu",
    label: "周四",
    courses: [
      { time: "09:50", title: "形势与政策", location: "大礼堂" },
      { time: "14:00", title: "UI 设计基础", location: "设计楼 201" },
      { time: "19:00", title: "课程项目答疑", location: "实验楼 B205" },
    ],
  },
  {
    key: "fri",
    label: "周五",
    courses: [
      { time: "08:00", title: "操作系统", location: "教学楼 A303" },
      { time: "10:10", title: "移动应用开发", location: "机房 C103" },
      { time: "16:20", title: "班级周会", location: "教学楼 A101" },
    ],
  },
];

const FEATURES = [
  {
    title: "教务系统同步",
    desc: "自动对接武汉商学院教务系统，课表实时更新",
    color: "cyan",
  },
  {
    title: "现代化界面",
    desc: "高对比度设计语言，清晰直观的视觉体验",
    color: "blue",
  },
  {
    title: "轻量无广告",
    desc: "纯净体验，专注课表管理，无任何广告干扰",
    color: "green",
  },
];

const ease = [0.22, 1, 0.36, 1];
const cycleDuration = 4500;

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [dayIndex, setDayIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoCycleCompleted, setAutoCycleCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const showcaseRef = useRef(null);
  const showcaseInView = useInView(showcaseRef, { amount: 0.4, once: false });

  const shouldAnimateProgress = useMemo(
    () => showcaseInView && !reducedMotion && !paused && !autoCycleCompleted,
    [showcaseInView, reducedMotion, paused, autoCycleCompleted]
  );

  useEffect(() => {
    if (!shouldAnimateProgress) return undefined;

    const timer = window.setInterval(() => {
      setDayIndex((prev) => {
        const next = (prev + 1) % DAYS.length;
        if (next === 0) setAutoCycleCompleted(true);
        return next;
      });
    }, cycleDuration);

    return () => window.clearInterval(timer);
  }, [shouldAnimateProgress]);

  const resetCycleFrom = (index) => {
    setDayIndex(index);
    setAutoCycleCompleted(false);
  };

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}

      <div className="min-h-screen bg-solarized-base3">
      {/* Navigation - Minimal & High Contrast */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-solarized-base3 border-b-2 border-solarized-base02"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="#top"
            className="text-2xl font-display font-bold text-solarized-base02"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            ClassFlow
          </motion.a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-solarized-base01 hover:text-solarized-base02 transition-colors font-medium cursor-pointer">
              功能
            </a>
            <a href="#compare" className="text-solarized-base01 hover:text-solarized-base02 transition-colors font-medium cursor-pointer">
              对比
            </a>
            <a href="#showcase" className="text-solarized-base01 hover:text-solarized-base02 transition-colors font-medium cursor-pointer">
              展示
            </a>
            <a href="https://qm.qq.com/q/6HDQuU2R68" target="_blank" rel="noreferrer" className="text-solarized-base01 hover:text-solarized-base02 transition-colors font-medium cursor-pointer">
              社群
            </a>
          </div>

          <a href="./ClassFlow.apk" download className="btn-primary cursor-pointer">
            下载 App
          </a>
        </div>
      </motion.nav>

      {/* Hero Section - Asymmetric & Bold Typography */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative">
          {/* Breaking Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Hero Content - Asymmetric positioning */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 space-y-6"
            >
              <motion.div variants={staggerItem}>
                <span className="inline-block px-4 py-2 bg-solarized-yellow/20 border-2 border-solarized-yellow text-solarized-base02 text-sm font-bold uppercase tracking-wider">
                  武汉商学院专属
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                className="text-7xl lg:text-8xl font-display font-bold leading-none text-solarized-base02"
              >
                智能课表
                <br />
                <span className="text-solarized-orange">轻松管理</span>
              </motion.h1>

              <motion.p
                variants={staggerItem}
                className="text-xl text-solarized-base01 leading-relaxed max-w-xl"
              >
                专为武汉商学院打造的现代化课表应用。自动同步教务系统，实时提醒上课时间，让你的学习生活井井有条。
              </motion.p>

              <motion.div variants={staggerItem} className="flex flex-wrap gap-4 pt-4">
                <a href="./ClassFlow.apk" download className="btn-primary cursor-pointer">
                  立即下载
                </a>
                <a href="#showcase" className="btn-secondary cursor-pointer">
                  查看演示
                </a>
              </motion.div>

              <motion.div variants={staggerItem} className="flex flex-wrap gap-3 pt-6">
                <span className="px-4 py-2 bg-solarized-base2 border-l-4 border-solarized-cyan text-solarized-base02 text-sm font-semibold">
                  无广告
                </span>
                <span className="px-4 py-2 bg-solarized-base2 border-l-4 border-solarized-blue text-solarized-base02 text-sm font-semibold">
                  自动同步
                </span>
                <span className="px-4 py-2 bg-solarized-base2 border-l-4 border-solarized-green text-solarized-base02 text-sm font-semibold">
                  现代设计
                </span>
              </motion.div>
            </motion.div>

            {/* Hero Visual - Overlapping Elements */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="lg:col-span-5 relative"
            >
              {/* Layered Cards with Overlap */}
              <div className="relative">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 * i }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                    className="card-asymmetric mb-4"
                    style={{
                      marginLeft: `${(i - 1) * 20}px`,
                      zIndex: 4 - i
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-solarized-orange flex items-center justify-center text-solarized-base3 font-bold text-lg">
                        {`0${i}`}
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-solarized-base01/30 w-3/4 mb-2"></div>
                        <div className="h-2 bg-solarized-base01/20 w-1/2"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Breaking Grid */}
      <section id="features" className="py-20 px-4 bg-solarized-base2">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mb-16"
          >
            <span className="inline-block px-4 py-2 bg-solarized-orange text-solarized-base3 text-sm font-bold uppercase tracking-wider mb-4">
              核心功能
            </span>
            <h2 className="text-5xl lg:text-6xl font-display font-bold text-solarized-base02 mb-4">
              为什么选择 ClassFlow
            </h2>
          </motion.div>

          {/* Asymmetric Grid Layout */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="card-asymmetric group cursor-pointer"
                style={{
                  marginTop: index === 1 ? '40px' : '0',
                }}
              >
                <div className={`w-12 h-1 bg-solarized-${feature.color} mb-6`}></div>
                <h3 className="text-2xl font-display font-bold text-solarized-base02 mb-3">
                  {feature.title}
                </h3>
                <p className="text-solarized-base01 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Compare Section - High Contrast */}
      <section id="compare" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-display font-bold text-solarized-base02 mb-4">
              告别<span className="text-solarized-red">广告干扰</span>
            </h2>
            <p className="text-xl text-solarized-base01">专注课表，纯净体验</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Other Apps - Cluttered */}
            <motion.div variants={staggerItem} className="bg-solarized-base2 border-2 border-solarized-base01 p-8 space-y-4">
              <h3 className="text-2xl font-display font-bold text-solarized-base02 mb-6">其他课表应用</h3>
              <div className="space-y-3">
                <div className="h-12 bg-solarized-red flex items-center px-4 text-solarized-base3 font-semibold border-2 border-solarized-base02">
                  广告横幅
                </div>
                <div className="h-12 bg-solarized-magenta flex items-center px-4 text-solarized-base3 font-semibold border-2 border-solarized-base02">
                  推广内容
                </div>
                <div className="h-10 bg-solarized-base01/20"></div>
                <div className="h-10 bg-solarized-base01/20"></div>
                <div className="h-10 bg-solarized-base01/20"></div>
              </div>
            </motion.div>

            {/* ClassFlow - Clean */}
            <motion.div variants={staggerItem} className="bg-solarized-base3 border-4 border-solarized-orange p-8 space-y-4 relative">
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-solarized-orange text-solarized-base3 font-bold uppercase text-xs">
                推荐
              </div>
              <h3 className="text-2xl font-display font-bold text-solarized-orange mb-6">ClassFlow</h3>
              <div className="space-y-3">
                {DAYS[0].courses.map((course, i) => (
                  <div key={i} className={`schedule-item ${i === 0 ? 'schedule-item-active' : ''} flex items-center gap-3`}>
                    <span className="text-solarized-cyan font-mono font-bold text-sm">{course.time}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-solarized-base02">{course.title}</p>
                      <p className="text-xs text-solarized-base01">{course.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Showcase Section - Layered Depth */}
      <section id="showcase" className="py-20 px-4 bg-solarized-base2">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mb-16"
          >
            <span className="inline-block px-4 py-2 bg-solarized-cyan text-solarized-base3 text-sm font-bold uppercase tracking-wider mb-4">
              实时演示
            </span>
            <h2 className="text-5xl lg:text-6xl font-display font-bold text-solarized-base02">
              课表界面展示
            </h2>
          </motion.div>

          <motion.div
            ref={showcaseRef}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-solarized-base3 border-2 border-solarized-base02 p-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-solarized-base02">
              <h3 className="text-xl font-display font-bold text-solarized-base02">第 8 周</h3>
              <span className="px-3 py-1 bg-solarized-blue text-solarized-base3 text-sm font-bold">
                Android
              </span>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {DAYS.map((day, index) => (
                <button
                  key={day.key}
                  onClick={() => resetCycleFrom(index)}
                  className={`px-6 py-2.5 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer border-2 ${
                    index === dayIndex
                      ? 'bg-solarized-orange border-solarized-orange text-solarized-base3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-solarized-base2 border-solarized-base02 text-solarized-base02 hover:bg-solarized-base3'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Schedule Content */}
            <div className="relative min-h-[280px]">
              {DAYS.map((day, index) => (
                <div
                  key={day.key}
                  className={`absolute inset-0 transition-all duration-500 ${
                    index === dayIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <div className="space-y-3">
                    {day.courses.map((course, i) => (
                      <div
                        key={`${day.key}-${i}`}
                        className="schedule-item flex items-center gap-4"
                      >
                        <div className="w-16 text-center">
                          <span className="text-solarized-cyan font-mono font-bold text-sm">{course.time}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-solarized-base02 mb-1">{course.title}</p>
                          <p className="text-sm text-solarized-base01">{course.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 h-2 bg-solarized-base2 border-2 border-solarized-base02 overflow-hidden">
              <div
                key={`progress-${dayIndex}-${shouldAnimateProgress}`}
                className={`h-full bg-solarized-orange ${
                  shouldAnimateProgress ? 'animate-progress' : 'w-0'
                }`}
                style={{
                  animation: shouldAnimateProgress ? `progress ${cycleDuration}ms linear` : 'none',
                }}
              ></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-solarized-base02 text-solarized-base2 py-12 px-4 mt-20 border-t-4 border-solarized-orange">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">ClassFlow</h3>
              <div className="space-y-2">
                <a href="#features" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">功能</a>
                <a href="#compare" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">对比</a>
                <a href="#showcase" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">展示</a>
                <a href="./ClassFlow.apk" download className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">下载</a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">社区</h3>
              <div className="space-y-2">
                <a href="https://qm.qq.com/q/6HDQuU2R68" target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                  智汇 AI 协会群
                </a>
                <a href="https://portal.wbuai.me/" target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                  AI 公益站
                </a>
                <a href="https://wbu.edu.cn" target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                  武汉商学院
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">政策</h3>
              <div className="space-y-2">
                <a href="#" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">使用条款</a>
                <a href="#" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">隐私政策</a>
                <a href="#" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">Cookie 设置</a>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-solarized-base01 pt-8 text-center text-solarized-base1">
            <p className="font-mono text-sm">© 2026 ClassFlow / WBU Student Project</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
    </>
  );
}
