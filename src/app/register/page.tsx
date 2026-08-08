import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleRegister } from "@/components/forms/google-register";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <div className="section flex min-h-[80vh] items-center justify-center py-16">
      <Suspense>
        <GoogleRegister />
      </Suspense>
    </div>
  );
}
