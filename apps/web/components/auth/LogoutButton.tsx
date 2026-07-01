"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { revokeCurrentSession } from "@/lib/authSession";

type LogoutButtonProps = {
  label?: string;
  className?: string;
};

export default function LogoutButton({
  label = "Logout",
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    await revokeCurrentSession();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => void handleLogout()}
      className={`rounded-full border px-4 py-2.5 text-sm font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{
        background: "var(--surface-strong)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {loggingOut ? "Logging out..." : label}
    </button>
  );
}
