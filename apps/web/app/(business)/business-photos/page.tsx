import BusinessPageFrame from "@/components/business/BusinessPageFrame";

export default function BusinessPhotosPage() {
  return (
    <BusinessPageFrame
      eyebrow="Photos"
      title="Manage business photos."
      subtitle="Add clear photos that help customers trust the place before they visit, book, or contact you."
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
            No photo gallery yet.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            Photos make business pages feel real, trusted, and easier to choose.
          </p>
        </div>
      </section>
    </BusinessPageFrame>
  );
}
