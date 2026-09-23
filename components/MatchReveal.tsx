"use client";

import { motion } from "framer-motion";
import type { OttOffer, TitleCard } from "@/lib/types";

export function MatchReveal({ title, offers }: { title: TitleCard; offers: OttOffer[] }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">It&apos;s a match</span>
        <h1 className="text-3xl font-black text-foreground">You&apos;re both in.</h1>
      </motion.div>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
      >
        {title.poster_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={title.poster_path} alt={title.title} className="h-72 w-full object-cover" />
        )}
        <div className="flex flex-col gap-2 px-6 py-5 text-left">
          <h2 className="text-2xl font-bold text-foreground">{title.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {title.year && <span>{title.year}</span>}
            {title.rating != null && (
              <span className="flex items-center gap-1 text-gold">
                <span aria-hidden>★</span> {title.rating.toFixed(1)}
              </span>
            )}
            {title.runtime && <span>{title.runtime} min</span>}
          </div>
          <p className="text-sm leading-relaxed text-muted">{title.synopsis}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Watch it now on</h3>
        {offers.length ? (
          <div className="flex flex-col gap-2">
            {offers.map((o) => (
              <a
                key={o.service}
                href={o.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-border bg-surface-raised px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-accent"
              >
                {o.service}
                <span className="text-muted">→</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No Indian streaming availability found for this title right now — check back later.
          </p>
        )}
      </motion.div>
    </div>
  );
}
