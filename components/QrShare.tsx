"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrShare({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#0b0d14", light: "#f3f2ef" } }).then(
      setDataUrl
    );
  }, [url]);

  async function handleShare() {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "join-code.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Let's pick something to watch tonight",
          text: `Scan this or open the link to join: ${url}`,
        });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Let's pick something to watch tonight", url });
        return;
      }
    } catch {
      // user cancelled or share unsupported — fall through to copy
    }
    await handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — link is still visible on screen to copy manually
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-3xl border border-border bg-surface p-4">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR code to join this session" width={240} height={240} />
        ) : (
          <div className="h-[240px] w-[240px] animate-pulse rounded-xl bg-surface-raised" />
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white"
        >
          Share with your partner
        </button>
        <button
          onClick={handleCopy}
          className="w-full rounded-full border border-border px-6 py-3.5 text-sm font-medium text-foreground"
        >
          {copied ? "Link copied!" : "Copy link instead"}
        </button>
      </div>
    </div>
  );
}
