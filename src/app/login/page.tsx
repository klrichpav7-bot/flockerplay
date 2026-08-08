import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleLogin } from "@/components/forms/google-login";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <div className="section flex min-h-[80vh] items-center justify-center py-16">
      <Suspense>
        <GoogleLogin />
      </Suspense>
    </div>
  );
}
