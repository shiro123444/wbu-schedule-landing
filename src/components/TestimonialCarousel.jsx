import { useEffect, useMemo, useState } from "react";
import { AnimatedList } from "./AnimatedList";

/* ─── Testimonial data ─── */
const TESTIMONIALS = [
  {
    id: "t-1",
    author: "电子商务 22 级 · 黄同学",
    quote: "最喜欢它的极简设计，信息密度够高但不乱，期中周复习安排很省心。",
  },
  {
    id: "t-2",
    author: "人工智能 23 级 · 吴同学",
    quote: "周视图切换很顺滑，晚课和实验课都看得很清楚，手机上操作也方便。",
  },
  {
    id: "t-3",
    author: "数据科学 24 级 · 周同学",
    quote: "社团活动多的时候也能快速查空档，课表和生活安排终于不打架了。",
  },
  {
    id: "t-4",
    author: "市场营销 23 级 · 陈同学",
    quote: "界面很清爽，没有广告弹窗，打开就能看到今天每节课的时间和地点。",
  },
  {
    id: "t-5",
    author: "软件工程 22 级 · 林同学",
    quote: "同步教务系统后，临时调课会自动更新，再也不会因为旧截图跑错教室。",
  },
];

/* Multiply so the list keeps cycling */
const allNotifications = Array.from({ length: 8 }, () => TESTIMONIALS).flat();

function normalizeTestimonials(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(
      (item) =>
        item &&
        typeof item.author === "string" &&
        typeof item.quote === "string"
    )
    .map((item, index) => ({
      id: item.id ?? `api-${index}`,
      author: item.author.trim(),
      quote: item.quote.trim(),
    }))
    .filter((item) => item.author && item.quote);
}

/* ─── Single notification card ─── */
function TestimonialCard({ author, quote, index }) {
  return (
    <figure
      className="relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden p-4"
      style={{
        background: "var(--color-solarized-base2)",
        border: "2px solid var(--color-solarized-base02)",
        boxShadow: "4px 4px 0px 0px rgba(0, 43, 54, 1)",
        marginLeft: `${(index % 3) * 18}px`,
        width: `calc(100% - ${(index % 3) * 18}px)`,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(2px, -2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
      }}
    >
      <div className="flex flex-row items-start gap-4">
        <div
          className="flex w-12 h-12 items-center justify-center shrink-0 font-bold text-lg"
          style={{
            backgroundColor: "var(--color-solarized-orange)",
            color: "var(--color-solarized-base3)",
          }}
        >
          {`0${(index % 3) + 1}`}
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <p
            className="leading-relaxed font-medium"
            style={{ color: "var(--color-solarized-base02)" }}
          >
            &ldquo;{quote}&rdquo;
          </p>
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: "var(--color-solarized-base01)" }}
          >
            {author}
          </p>
        </div>
      </div>
    </figure>
  );
}

/* ─── Main component ─── */
export default function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);

  /* Fetch remote testimonials */
  useEffect(() => {
    let cancelled = false;
    async function loadTestimonials() {
      try {
        const response = await fetch("/api/testimonials");
        if (!response.ok) return;
        const payload = await response.json();
        const normalized = normalizeTestimonials(payload?.testimonials);
        if (!cancelled && normalized.length > 0) {
          setTestimonials(normalized);
        }
      } catch (_error) {
        // Keep fallback
      }
    }
    loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Build the repeating notification list */
  const notifications = useMemo(
    () => Array.from({ length: 8 }, () => testimonials).flat(),
    [testimonials]
  );

  return (
    <div className="relative">
      <div className="inline-block px-3 py-1.5 mb-4 bg-solarized-cyan text-solarized-base3 text-xs font-bold uppercase tracking-wide">
        同学留言
      </div>

      <div
        className="relative flex w-full flex-col overflow-y-hidden overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ height: "520px" }}
      >
        <AnimatedList delay={2000}>
          {notifications.map((item, idx) => (
            <TestimonialCard
              key={`${item.id}-${idx}`}
              author={item.author}
              quote={item.quote}
              index={idx}
            />
          ))}
        </AnimatedList>

        {/* Bottom fade gradient */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
          style={{
            background:
              "linear-gradient(to top, var(--color-solarized-base3), transparent)",
          }}
        />
      </div>
    </div>
  );
}
