import BusinessPageFrame from "@/components/business/BusinessPageFrame";

export default function BusinessBookingsPage() {
  return (
    <BusinessPageFrame
      eyebrow="Bookings"
      title="Manage customer requests."
      subtitle="See new booking requests, follow up faster, and keep customer interest from disappearing."
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
            No booking requests yet.
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6"
            style={{ color: "var(--muted)" }}
          >
            When customers ask to book, reserve, visit, or request a service, those requests will appear here.
          </p>
        </div>
      </section>
    </BusinessPageFrame>
  );
}
