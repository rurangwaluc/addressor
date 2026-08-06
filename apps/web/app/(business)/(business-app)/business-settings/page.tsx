import BusinessPageFrame from "@/components/business/BusinessPageFrame";

export default function BusinessSettingsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Settings"
      title="Business settings."
      subtitle="Control business preferences, owner tools, visibility, and account setup from one place."
    >
      <section
        className="rounded-[2rem] border p-5 sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="rounded-[1.5rem] border p-6 text-center"
          style={{
            background: "var(--surface-strong)",
            borderColor: "var(--border)",
          }}
        >
          <h2 className="text-2xl font-black tracking-[-0.04em]">
            Settings are ready for setup.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            This area will hold business visibility, notifications, owner access, and customer action settings.
          </p>
        </div>
      </section>
    </BusinessPageFrame>
  );
}
