import BusinessPageFrame from "@/components/business/BusinessPageFrame";

export default function BusinessSubscribersPage() {
  return (
    <BusinessPageFrame
      eyebrow="Subscribers"
      title="People following your business."
      subtitle="See customers who subscribed to updates, offers, news, and important business changes."
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
            No subscribers yet.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            When people follow this business, they will appear here so the owner can understand demand.
          </p>
        </div>
      </section>
    </BusinessPageFrame>
  );
}
