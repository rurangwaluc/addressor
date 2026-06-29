import { Suspense } from "react";
import BusinessLoginClient from "./BusinessLoginClient";

export default function BusinessLoginPage() {
  return (
    <Suspense fallback={null}>
      <BusinessLoginClient />
    </Suspense>
  );
}