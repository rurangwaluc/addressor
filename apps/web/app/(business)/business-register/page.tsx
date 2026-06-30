 "use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import AsyncButton from "@/components/AsyncButton";
import InputField from "@/components/InputField";

export default function BusinessRegisterPage() {
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      title="Register your business"
      subtitle="Create your Addressor business account, then add your business profile, branches, photos, menus, offers, and booking rules."
    >
      <div className="space-y-4">
        <div
          className="rounded-2xl border px-4 py-3 text-sm leading-6"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Business registration will create a verified owner account first, then
          connect it to a business profile and first branch.
        </div>

        <InputField
          label="Owner full name"
          value=""
          onChange={() => {}}
          placeholder="Business owner name"
        />

        <InputField
          label="Business email"
          type="email"
          value=""
          onChange={() => {}}
          placeholder="owner@business.com"
        />

        <InputField
          label="Business phone"
          value=""
          onChange={() => {}}
          placeholder="2507XXXXXXXX"
        />

        <InputField
          label="Password"
          type="password"
          value=""
          onChange={() => {}}
          placeholder="Create a secure password"
        />

        <AsyncButton
          type="button"
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 600);
          }}
        >
          Continue to business setup
        </AsyncButton>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          Already manage a business?{" "}
          <Link
            href="/login?intent=business"
            className="font-bold"
            style={{ color: "var(--accent)" }}
          >
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}