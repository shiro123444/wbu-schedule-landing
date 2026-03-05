import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WELCOME_TEXT = `Ciallo(∠・ω< )⌒☆！欢迎来到 ClassFlow

如果你是
喜欢打galgame的喜欢三角洲的打第五人格的打啤酒烧烤的打逆水寒的打烟云十六声的打蛋仔派对的打火影的打瓦的打CSGO的打明日方舟的打我的世界的打三国杀的打CF的打金铲铲的打原神的打星穹铁道的打绝区零的打幻塔的打永劫无间的打天天酷跑的打qq飞车的打植物大战僵尸的打4399的打7k7k的打lol的打光遇的打荒野大乱斗的打猫和老鼠的打鸣潮的打碧蓝档案的打碧蓝航线的打哈里波特的打1999的打未定事件薄的打恋与深空的打恋与制作人的打暗区突围的打阴阳师的打世界之外的打使命召唤的打战地的打深空之眼的打最终幻想的打APex的打和平精英的打王者荣耀的打守望先锋的打逆战的打战双的打塞尔达的打彩六的打传说之下的打去月球的打卡拉比丘的打屁股肉的打战争雷霆的打火柴人战争遗产的打来自星辰的打只狼的打逃离塔科夫的打元气骑士的打泰拉瑞亚的打生化危机的打怪物猎人的打星露谷的打红色警戒的打炉石传说的玩COD的推土机干员访客食客同门游侠蛋仔学员特工悍匪博士史蒂夫主公CFer棋手旅行者开拓者绳匠拓荒者修罗跑者车手邻居冲浪者高玩召唤师光之子斗士巡逻者漂泊者老师指挥官巫师司辰律师猎人制作人先锋阴阳师殿下战士老手管理员光呆传奇特种兵王者英雄NZer首席林克探员人类医生引航者鸽子车长首领调查员忍者PMC骑士泰拉人幸存者苍蓝星农夫统帅酒客们
还有看番跳OPED的看番开倍速的看番看一半去看解说的没看完番就去看本子的看番记不住名字的打三角洲不带子弹的打明日方舟不带先锋的打CF不带枪的打终末地不吃饭的抽卡全吃大保底的强化遗器全歪防御的买游戏只为喜加一的玩剧情游戏疯狂按跳过的玩galgame硬要找纯爱剧情的看番永远只看弹幕的收藏夹里的番永远不看的补番全靠看切片的每天上线只为签到的签到完忘记领奖励的玩单机永远迷路的打瓦出门忘记买甲的打CSGO永远起P90的打Apex跳伞直接下海的打LOL闪现撞墙的打王者荣耀出门不买鞋的打和平精英扔雷炸死队友的玩亚索永远接不到大的挖矿掉进岩浆洗澡的砍树永远留悬空树冠的打第五人格疯狂炸机的玩双人成行找不到搭子的玩魂类贪刀被一套带走的玩怪猎进场忘记吃猫饭的打原神爬山没体力摔死的打星铁不带生存位被秒的打绝区零疯狂弹刀按错的玩乙游死活抽不到推的玩三国杀开局盲狙队友的玩炉石起手全是高费卡的玩泰拉瑞亚被史莱姆砸死的玩只狼疯狂按格挡抖刀的玩植物大战僵尸坚果种最后的玩星露谷熬夜晕倒被扣钱的玩红警造一堆狗去咬坦克的玩塔科夫当仓鼠不敢出门的玩元气骑士开局不带武器的玩卡拉比丘永远打不中人的打鸣潮永远不闪避硬扛的听游戏原声带听到哭出来的等异环虚幻火环公测的
WBUer们

我们是一群武汉商学院的学生
受够了那些满屏广告的课表 App
于是自己动手做了这个

没有广告
没有推送
没有乱七八糟的功能
就是一个纯粹的课表


希望你喜欢 ❤️`;

const TYPING_SPEED = 24;

function getParagraphClass(paragraph, index) {
  const baseClass = "whitespace-pre-wrap tracking-[0.01em]";

  if (index === 0) {
    return `${baseClass} text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight text-solarized-base02 text-center`;
  }

  if (paragraph.includes("WBUer们")) {
    return `${baseClass} text-xl md:text-2xl font-display font-bold leading-snug text-solarized-orange text-center`;
  }

  if (paragraph.startsWith("我们是一群")) {
    return `${baseClass} text-lg md:text-xl leading-relaxed text-solarized-base02`;
  }

  if (paragraph.startsWith("没有广告")) {
    return `${baseClass} text-lg md:text-xl font-semibold leading-loose text-solarized-base02`;
  }

  return `${baseClass} text-base md:text-lg leading-relaxed text-solarized-base01`;
}

export default function WelcomeScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const textViewportRef = useRef(null);

  const typedText = useMemo(
    () => WELCOME_TEXT.slice(0, currentIndex),
    [currentIndex]
  );
  const typedParagraphs = useMemo(
    () => typedText.split("\n\n"),
    [typedText]
  );
  const progress = Math.min(
    100,
    (currentIndex / WELCOME_TEXT.length) * 100
  );

  useEffect(() => {
    if (currentIndex >= WELCOME_TEXT.length) {
      setIsTypingComplete(true);
      return;
    }

    const currentChar = WELCOME_TEXT[currentIndex];
    const delay = /[，。！？,.!]/.test(currentChar)
      ? TYPING_SPEED * 1.4
      : currentChar === "\n"
      ? TYPING_SPEED * 0.5
      : TYPING_SPEED;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (!textViewportRef.current) return;
    textViewportRef.current.scrollTop = textViewportRef.current.scrollHeight;
  }, [currentIndex]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-solarized-base3/95 backdrop-blur-[2px] flex items-center justify-center overflow-hidden px-4 py-8"
          onClick={handleSkip}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(7,54,66,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(7,54,66,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed top-6 right-6 text-solarized-base01 text-sm font-mono z-10"
          >
            按 ESC 或点击背景跳过
          </motion.div>

          {/* Center panel */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-2 border-solarized-base02 bg-solarized-base3 shadow-[10px_10px_0_0_rgba(0,43,54,1)]">
              <div className="border-b-2 border-solarized-base01/40 px-5 py-4 md:px-8 md:py-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-solarized-base01">
                      ClassFlow Opening
                    </p>
                    <h2 className="mt-1 text-xl md:text-3xl font-display font-bold text-solarized-base02">
                      写给 WBUer 的欢迎词
                    </h2>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-solarized-base01">
                    {Math.round(progress)}%
                  </p>
                </div>
                <div className="mt-4 h-2 border border-solarized-base01/50 bg-solarized-base2">
                  <motion.div
                    className="h-full bg-solarized-cyan"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15, ease: "linear" }}
                  />
                </div>
              </div>

              <div
                ref={textViewportRef}
                className="h-[56vh] min-h-[360px] overflow-y-auto px-5 py-6 md:px-8 md:py-8"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--color-solarized-base01) transparent",
                }}
              >
                <div className="space-y-6">
                  {typedParagraphs.map((paragraph, index) => (
                    <p
                      key={`${index}-${paragraph.length}`}
                      className={getParagraphClass(paragraph, index)}
                    >
                      {paragraph}
                    </p>
                  ))}

                  {!isTypingComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="inline-block h-6 w-[3px] bg-solarized-orange align-middle"
                    />
                  )}
                </div>
              </div>

              <div className="border-t-2 border-solarized-base01/40 px-5 py-4 md:px-8 md:py-5 flex flex-wrap items-center justify-between gap-3">
                <motion.div
                  animate={isTypingComplete ? { opacity: 1 } : { opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.2, repeat: isTypingComplete ? 0 : Infinity }}
                  className="text-sm md:text-base text-solarized-base01"
                >
                  {isTypingComplete ? "欢迎词已播放完成" : "正在输入中..."}
                </motion.div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSkip}
                    className="btn-secondary text-sm md:text-base cursor-pointer"
                  >
                    跳过
                  </button>

                  <AnimatePresence>
                    {isTypingComplete && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleContinue}
                        className="btn-primary text-sm md:text-base px-6 md:px-8 cursor-pointer"
                        whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.97 }}
                      >
                        让我看看？
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
