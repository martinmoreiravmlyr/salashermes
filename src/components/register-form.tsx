"use client";

import { useActionState } from "react";
import { INITIAL_REGISTER_ACTION_STATE, registerUserAction } from "@/app/actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUserAction, INITIAL_REGISTER_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4">
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
      {state.status !== "idle" && state.message ? (
        <p className={`text-sm ${state.status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
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
