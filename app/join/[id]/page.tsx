"use client";

import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { setCoupleId, setRole } from "@/lib/device";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const coupleId = searchParams.get("c");
    if (coupleId) setCoupleId(coupleId);
    setRole(params.id, "b");
    router.replace(`/session/${params.id}/preferences`);
  }, [params.id, router, searchParams]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      <p className="text-sm text-muted">Joining movie night...</p>
    </main>
  );
}
