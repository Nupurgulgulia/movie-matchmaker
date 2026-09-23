import type { TitleCard } from "@/lib/types";

export function SwipeCardContent({ title }: { title: TitleCard }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-2xl">
      <div className="relative h-[62%] w-full bg-surface-raised">
        {title.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={title.poster_path}
            alt={title.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">No poster</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {title.media_type === "tv" ? "Series" : "Movie"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-6 pt-3">
        <h3 className="text-xl font-bold leading-tight text-foreground">{title.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {title.year && <span>{title.year}</span>}
          {title.rating != null && (
            <span className="flex items-center gap-1 text-gold">
              <span aria-hidden>★</span> {title.rating.toFixed(1)}
            </span>
          )}
          {title.runtime && <span>{title.runtime} min</span>}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">
          {title.synopsis || "No synopsis available."}
        </p>
      </div>
    </div>
  );
}
