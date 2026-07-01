"use client";

import { useState } from "react";
import { logout } from "@/lib/authSession";

type LogoutButtonProps = {
  label?: string;
  className?: string;
};

export default function LogoutButton({
  label = "Logout",
  className = "",
}: LogoutButtonProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => {
        setLoggingOut(true);
        void logout();
      }}
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
