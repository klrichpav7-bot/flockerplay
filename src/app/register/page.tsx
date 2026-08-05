import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <div className="section flex min-h-[80vh] items-center justify-center py-16">
      <RegisterForm />
    </div>
  );
}
