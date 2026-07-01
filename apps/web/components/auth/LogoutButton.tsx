"use client";

import { logout } from "@/lib/authSession";

type LogoutButtonProps = {
  label?: string;
  className?: string;
};

export default function LogoutButton({
  label = "Logout",
  className = "",
}: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={logout}
      className={`rounded-full border px-4 py-2.5 text-sm font-black transition hover:scale-[1.01] ${className}`}
      style={{
        background: "var(--surface-strong)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {label}
    </button>
  );
}
