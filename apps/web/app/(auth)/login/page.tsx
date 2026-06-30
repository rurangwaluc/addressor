import { Suspense } from "react";
import RedirectIfAuthenticated from "@/components/auth/RedirectIfAuthenticated";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <RedirectIfAuthenticated fallback="/welcome">
        <LoginClient />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}