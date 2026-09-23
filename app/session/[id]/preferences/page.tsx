"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PreferencesForm } from "@/components/PreferencesForm";
import { getRole } from "@/lib/device";
import type { Partner, Preferences } from "@/lib/types";

export default function PreferencesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRoleState] = useState<Partner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleState(getRole(params.id));
  }, [params.id]);

  async function handleSubmit(preferences: Preferences) {
    if (!role) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${params.id}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner: role, preferences }),
      });
      if (!res.ok) throw new Error("Something went wrong saving your preferences.");
      const data = await res.json();
      if (data.ready) {
        router.push(`/session/${params.id}/swipe`);
      } else {
        router.push(`/session/${params.id}/waiting`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (role === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted">
          This link looks invalid. Start a new movie night from the home screen.
        </p>
        <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">
          Go home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
          {role === "a" ? "You're starting movie night" : "You're joining movie night"}
        </span>
        <h1 className="text-2xl font-bold text-foreground">What are you in the mood for?</h1>
        <p className="text-sm text-muted">Your partner won&apos;t see your answers.</p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <PreferencesForm onSubmit={handleSubmit} submitting={submitting} />
    </main>
  );
}
