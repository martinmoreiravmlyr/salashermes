"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError("");

        startTransition(async () => {
          const result = await signIn("credentials", {
            email: formData.get("email")?.toString() ?? "",
            password: formData.get("password")?.toString() ?? "",
            redirect: false,
          });

          if (result?.error) {
            setError("Email o contraseña inválidos.");
            return;
          }

          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">Entrar</p>
      <input
        name="email"
        type="email"
        placeholder="ana@empresa.com"
        required
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
      />
      <input
        name="password"
        type="password"
        placeholder="••••••••"
        required
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#5e6ad2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7170ff] disabled:opacity-60"
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
