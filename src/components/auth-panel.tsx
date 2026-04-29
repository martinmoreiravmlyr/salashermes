import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

export function AuthPanel() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Iniciá sesión para reservar</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          La identidad de reserva ahora sale de tu sesión y no de campos enviados en el formulario.
        </p>
      </div>
      <LoginForm />
      <RegisterForm />
    </div>
  );
}
