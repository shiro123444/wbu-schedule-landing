import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import TestimonialCarousel from "./components/TestimonialCarousel";
import WelcomeScreen from "./components/WelcomeScreen";
import PhoneStoryboardComparison from "./components/PhoneStoryboardComparison";
import FeedbackModal from "./components/FeedbackModal";

const MAX_NICKNAME_LENGTH = 12;
const MAX_MESSAGE_LENGTH = 20;

const DAYS = [
  {
    key: "mon",
    label: "周一",
    courses: [
      { time: "08:00", title: "原神启动学", location: "提瓦特大陆" },
      { time: "10:10", title: "明日方舟战术", location: "罗德岛指挥室" },
      { time: "14:00", title: "星穹铁道概论", location: "太空快线 A 车厢" },
    ],
  },
  {
    key: "tue",
    label: "周二",
    courses: [
      { time: "09:50", title: "王者荣耀实训", location: "峡谷中路河道" },
      { time: "13:30", title: "我的世界建筑", location: "主世界 Y=64" },
      { time: "19:00", title: "三角洲行动学", location: "哈兰要塞" },
    ],
  },
  {
    key: "wed",
    label: "周三",
    courses: [
      { time: "08:00", title: "Galgame 鉴赏", location: "纯爱研究所" },
      { time: "10:10", title: "CSGO 枪法训练", location: "Dust2 A 大道" },
      { time: "15:40", title: "绝区零闪避学", location: "空洞内部" },
    ],
  },
  {
    key: "thu",
    label: "周四",
    courses: [
      { time: "09:50", title: "碧蓝档案攻略", location: "基沃托斯" },
      { time: "14:00", title: "塞尔达探索学", location: "海拉鲁大陆" },
      { time: "19:00", title: "只狼格挡实训", location: "苇名城 弦一郎道场" },
    ],
  },
  {
    key: "fri",
    label: "周五",
    courses: [
      { time: "08:00", title: "怪物猎人狩猎", location: "大社集会所" },
      { time: "10:10", title: "泰拉瑞亚生存", location: "地表 · 史莱姆禁区" },
      { time: "16:20", title: "星露谷摸鱼学", location: "鹈鹕镇 · 自家农场" },
    ],
  },
];

const DOWNLOAD_URL = "https://github.com/shiro123444/ClassFlow/releases/download/v1.0.0.0/app-prod-arm64-v8a-release.apk";
const GITHUB_URL = "https://github.com/shiro123444/ClassFlow";
const RELEASES_URL = "https://github.com/shiro123444/ClassFlow/releases/latest";
const QQ_GROUP_URL = "https://qm.qq.com/q/6HDQuU2R68";
const AI_PORTAL_URL = "https://portal.wbuai.me/";

const SITE_TEXT_DEFAULTS = {
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

  // Feedback Modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [siteText, setSiteText] = useState(SITE_TEXT_DEFAULTS);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitPending(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: nickname, quote: message }),
      });
      if (!res.ok) throw new Error("提交失败，请稍后再试");
      setNickname("");
      setMessage("");
      setFeedbackOpen(false);
    } catch (err) {
      setSubmitError(err.message || "提交失败");
    } finally {
      setSubmitPending(false);
    }
  };

  const showcaseRef = useRef(null);
  const showcaseInView = useInView(showcaseRef, { amount: 0.4, once: false });

  const shouldAnimateProgress = useMemo(
    () => showcaseInView && !reducedMotion && !paused && !autoCycleCompleted,
    [showcaseInView, reducedMotion, paused, autoCycleCompleted]
  );

  const features = useMemo(
    () => [
      {
        title: siteText.feature_1_title,
        desc: siteText.feature_1_desc,
        color: "cyan",
      },
      {
        title: siteText.feature_2_title,
        desc: siteText.feature_2_desc,
        color: "blue",
      },
      {
        title: siteText.feature_3_title,
        desc: siteText.feature_3_desc,
        color: "green",
      },
    ],
    [siteText]
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

  useEffect(() => {
    let cancelled = false;

    async function loadSiteContent() {
      try {
        const res = await fetch("/api/site-content");
        if (!res.ok) return;
        const payload = await res.json();
        if (cancelled || !payload?.content) return;
        setSiteText((prev) => ({ ...prev, ...payload.content }));
      } catch (_error) {
        // Keep local defaults when API is unavailable.
      }
    }

    loadSiteContent();
    return () => {
      cancelled = true;
    };
  }, []);

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
              <a href={QQ_GROUP_URL} target="_blank" rel="noreferrer" className="text-solarized-base01 hover:text-solarized-base02 transition-colors font-medium cursor-pointer">
                社群
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-solarized-base01 hover:text-solarized-base02 transition-colors cursor-pointer" title="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              </a>
            </div>

            <a href={DOWNLOAD_URL} download className="btn-primary cursor-pointer">
              下载 App
            </a>
          </div>
        </motion.nav>

        {/* Hero Section - Asymmetric & Bold Typography */}
        <section className="pt-32 pb-20 px-4 relative overflow-x-clip">
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
                    {siteText.hero_badge}
                  </span>
                </motion.div>

                <motion.h1
                  variants={staggerItem}
                  className="text-7xl lg:text-8xl font-display font-bold leading-none text-solarized-base02"
                >
                  {siteText.hero_title_line1}
                  <br />
                  <span className="text-solarized-orange">{siteText.hero_title_highlight}</span>
                </motion.h1>

                <motion.p
                  variants={staggerItem}
                  className="text-xl text-solarized-base01 leading-relaxed max-w-xl"
                >
                  {siteText.hero_description}
                </motion.p>

                <motion.div variants={staggerItem} className="flex flex-wrap gap-4 pt-4">
                  <a href={DOWNLOAD_URL} download className="btn-primary cursor-pointer">
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
                <TestimonialCarousel />
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
                {siteText.feature_section_badge}
              </span>
              <h2 className="text-5xl lg:text-6xl font-display font-bold text-solarized-base02 mb-4">
                {siteText.feature_section_title}
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
              {features.map((feature, index) => (
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
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <PhoneStoryboardComparison reducedMotion={reducedMotion} />
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
                <span className="text-sm font-normal text-solarized-base01 ml-2 align-middle">(实际上不造写什么了ww)</span>
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
                    className={`px-6 py-2.5 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer border-2 ${index === dayIndex
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
                    className={`absolute inset-0 transition-all duration-500 ${index === dayIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
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
                  className={`h-full bg-solarized-orange ${shouldAnimateProgress ? 'animate-progress' : 'w-0'
                    }`}
                  style={{
                    animation: shouldAnimateProgress ? `progress ${cycleDuration}ms linear` : 'none',
                  }}
                ></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center"
            >
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-solarized-base02 mb-4">
                不只是课表
              </h2>
              <p className="text-xl text-solarized-base01 mb-10 max-w-2xl mx-auto">
                ClassFlow 背后是武商院智汇 AI 协会的一群学生。欢迎加入我们，一起搞点有意思的。
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
            >
              <motion.a
                variants={staggerItem}
                href={QQ_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="card-asymmetric group cursor-pointer text-center"
              >
                <div className="w-12 h-1 bg-solarized-cyan mb-4 mx-auto"></div>
                <h3 className="text-xl font-display font-bold text-solarized-base02 mb-2">
                  智汇 AI 协会群
                </h3>
                <p className="text-solarized-base01 text-sm">聊天 · 组队 · 一起写代码</p>
              </motion.a>

              <motion.a
                variants={staggerItem}
                href={AI_PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="card-asymmetric group cursor-pointer text-center"
              >
                <div className="w-12 h-1 bg-solarized-violet mb-4 mx-auto"></div>
                <h3 className="text-xl font-display font-bold text-solarized-base02 mb-2">
                  AI 公益站
                </h3>
                <p className="text-solarized-base01 text-sm">免费使用 · 欢迎体验</p>
              </motion.a>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-4"
            >
              <a href={DOWNLOAD_URL} download className="btn-primary cursor-pointer">
                下载 ClassFlow
              </a>
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-solarized-base01 hover:text-solarized-base02 transition-colors cursor-pointer underline underline-offset-4"
              >
                其他架构 / 历史版本
              </a>
            </motion.div>
          </div>
        </section>

        {/* Footer - Minimal */}
        <footer className="bg-solarized-base02 text-solarized-base2 py-12 px-4 border-t-4 border-solarized-orange">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">ClassFlow</h3>
                <div className="space-y-2">
                  <a href="#features" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">功能</a>
                  <a href="#compare" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">对比</a>
                  <a href="#showcase" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">展示</a>
                  <a href={DOWNLOAD_URL} download className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">下载</a>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">社区</h3>
                <div className="space-y-2">
                  <a href={QQ_GROUP_URL} target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                    智汇 AI 协会群
                  </a>
                  <a href={AI_PORTAL_URL} target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                    AI 公益站
                  </a>
                  <a href="https://wbu.edu.cn" target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                    武汉商学院
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-4 text-solarized-base3">开源</h3>
                <div className="space-y-2">
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                    GitHub 仓库
                  </a>
                  <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="block text-solarized-base1 hover:text-solarized-base3 transition-colors cursor-pointer">
                    版本发布
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-solarized-base01 pt-8 text-center text-solarized-base1">
              <p className="font-mono text-sm">© 2026 ClassFlow / WBU Student Project</p>
            </div>
          </div>
        </footer>

        {/* Floating Feedback Button */}
        <motion.button
          onClick={() => setFeedbackOpen(true)}
          className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-solarized-orange text-solarized-base3 border-2 border-solarized-base02 shadow-[4px_4px_0px_0px_rgba(0,43,54,1)] flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="留下你的评价"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>

        <FeedbackModal
          isOpen={feedbackOpen}
          nickname={nickname}
          message={message}
          maxNicknameLength={MAX_NICKNAME_LENGTH}
          maxMessageLength={MAX_MESSAGE_LENGTH}
          moderationEnabled={true}
          submitPending={submitPending}
          submitError={submitError}
          onNicknameChange={(e) => setNickname(e.target.value)}
          onMessageChange={(e) => setMessage(e.target.value)}
          onClose={() => setFeedbackOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />

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
