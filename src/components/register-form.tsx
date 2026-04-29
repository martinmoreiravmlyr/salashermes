"use client";

import { useState, useTransition } from "react";

export function RegisterForm() {
  const [feedback, setFeedback] = useState<{ status: "idle" | "success" | "error"; message: string }>({
    status: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setFeedback({ status: "idle", message: "" });

        startTransition(async () => {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: formData.get('name')?.toString() ?? '',
              email: formData.get('email')?.toString() ?? '',
              password: formData.get('password')?.toString() ?? '',
            }),
          });

          const data = (await response.json()) as { ok: boolean; message?: string; error?: string };
          if (!response.ok || !data.ok) {
            setFeedback({ status: 'error', message: data.error ?? 'No fue posible crear la cuenta.' });
            return;
          }

          form.reset();
          setFeedback({ status: 'success', message: data.message ?? 'Cuenta creada. Ahora podés iniciar sesión.' });
        });
      }}
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">Crear cuenta</p>
      <input
        name="name"
        type="text"
        placeholder="Ana"
        required
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
      />
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
        placeholder="Mínimo 8 caracteres"
        required
        minLength={8}
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
      />
      {feedback.status !== "idle" && feedback.message ? (
        <p className={`text-sm ${feedback.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {feedback.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)] disabled:opacity-60"
      >
        {isPending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
