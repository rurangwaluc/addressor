import RequireAccess from "@/components/auth/RequireAccess";

export default function BusinessDashboardPage() {
  return (
    <RequireAccess mode="business">
      <main
        className="min-h-screen px-5 py-8"
        style={{
          background: "var(--background)",
          color: "var(--text)",
        }}
      >
        <section className="mx-auto w-full max-w-6xl">
          <div
            className="rounded-[2rem] border p-6 shadow-2xl"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              Business dashboard
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] md:text-5xl">
              Manage your Addressor presence.
            </h1>

            <p
              className="mt-4 max-w-2xl text-sm leading-7 md:text-base"
              style={{ color: "var(--muted)" }}
            >
              This area is only for approved business owners and team members.
              Next we will connect profile, branches, media, availability, and
              visibility tools here.
            </p>
          </div>
        </section>
      </main>
    </RequireAccess>
  );
}