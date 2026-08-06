import BusinessPageFrame from "@/components/business/BusinessPageFrame";

export default function BusinessReviewsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Reviews"
      title="Manage reviews and comments."
      subtitle="Track customer feedback, reply professionally, and understand what people say about your business."
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
            No reviews yet.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            Customer reviews and review comments will appear here once the public business page is active.
          </p>
        </div>
      </section>
    </BusinessPageFrame>
  );
}
