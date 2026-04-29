"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signOut({ redirect: false });
          router.refresh();
        })
      }
      className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
      disabled={isPending}
    >
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
