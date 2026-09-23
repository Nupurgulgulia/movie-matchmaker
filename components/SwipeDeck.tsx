"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import type { SwipeDirection, TitleCard } from "@/lib/types";
import { SwipeCardContent } from "./SwipeCard";

const SWIPE_THRESHOLD = 120;
const FLY_OUT_DISTANCE = 600;

function TopCard({
  title,
  onSwiped,
  forceSwipe,
  onForceSwipeHandled,
}: {
  title: TitleCard;
  onSwiped: (direction: SwipeDirection) => void;
  forceSwipe: SwipeDirection | null;
  onForceSwipeHandled: () => void;
}) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  async function flyOut(direction: SwipeDirection) {
    await controls.start({
      x: direction === "right" ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE,
      rotate: direction === "right" ? 30 : -30,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" },
    });
    onSwiped(direction);
  }

  useEffect(() => {
    if (forceSwipe) {
      onForceSwipeHandled();
      flyOut(forceSwipe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceSwipe]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      animate={controls}
      drag="x"
      dragElastic={1}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) flyOut("right");
        else if (info.offset.x < -SWIPE_THRESHOLD) flyOut("left");
        else controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 22 } });
      }}
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-6 top-6 z-10 rotate-[-12deg] rounded-lg border-4 border-success px-3 py-1 text-lg font-black uppercase tracking-wide text-success"
      >
        Like
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-6 top-6 z-10 rotate-[12deg] rounded-lg border-4 border-danger px-3 py-1 text-lg font-black uppercase tracking-wide text-danger"
      >
        Pass
      </motion.div>
      <SwipeCardContent title={title} />
    </motion.div>
  );
}

export function SwipeDeck({
  titles,
  onSwipe,
  onEmpty,
}: {
  titles: TitleCard[];
  onSwipe: (title: TitleCard, direction: SwipeDirection) => void;
  onEmpty: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [forceSwipe, setForceSwipe] = useState<SwipeDirection | null>(null);
  const visible = titles.slice(index, index + 3);

  function advance(direction: SwipeDirection) {
    onSwipe(titles[index], direction);
    const next = index + 1;
    setIndex(next);
    if (next >= titles.length) onEmpty();
  }

  if (!titles.length) return null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="relative h-[70vh] max-h-[560px] w-full">
        {visible
          .map((title, i) => (
            <div
              key={title.tmdb_id}
              className="absolute inset-0"
              style={{
                zIndex: visible.length - i,
                transform: `scale(${1 - i * 0.04}) translateY(${i * 12}px)`,
              }}
            >
              {i === 0 ? (
                <TopCard
                  title={title}
                  onSwiped={advance}
                  forceSwipe={forceSwipe}
                  onForceSwipeHandled={() => setForceSwipe(null)}
                />
              ) : (
                <SwipeCardContent title={title} />
              )}
            </div>
          ))
          .reverse()}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          aria-label="Pass"
          onClick={() => setForceSwipe("left")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-2xl text-danger shadow-lg active:scale-95"
        >
          ✕
        </button>
        <button
          aria-label="Like"
          onClick={() => setForceSwipe("right")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-2xl text-success shadow-lg active:scale-95"
        >
          ♥
        </button>
      </div>
      <p className="text-center text-xs text-muted">{Math.min(index + 1, titles.length)} / {titles.length}</p>
    </div>
  );
}
