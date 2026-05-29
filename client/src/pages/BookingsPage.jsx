import { useMemo, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useBookings } from "../hooks/useBookings";
import MotionCard from "../components/motion/MotionCard";
import Reveal from "../components/motion/Reveal";
import { StaggerReveal } from "../components/motion/StaggerReveal";
import MagneticButton from "../components/motion/MagneticButton";

function GlassCard({ children, className = "" }) {
  return <MotionCard className={className}>{children}</MotionCard>;
}

function StatusPill({ status }) {
  const map = {
    pending: "bg-white/10 text-white",
    accepted: "bg-cyan-400/15 text-cyan-100",
    rejected: "bg-red-400/15 text-red-100",
    active: "bg-emerald-400/15 text-emerald-100",
    completed: "bg-white/10 text-white/80",
    cancelled: "bg-white/10 text-white/60",
  };
  const cls = map[status] || "bg-white/10 text-white";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${cls}`}>{status}</span>;
}

function fmt(date) {
  try {
    return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function BookingCard({ booking, role, onUpdateStatus, isUpdating }) {
  const listing = booking.listing;
  const cover = listing?.images?.[0];
  const title = listing?.title || "Listing";

  const actions = useMemo(() => {
    const s = booking.status;
    if (role === "owner") {
      if (s === "pending") return ["accepted", "rejected"];
      if (s === "accepted") return ["active", "cancelled"];
      if (s === "active") return ["completed", "cancelled"];
      return [];
    }
    // renter
    if (s === "pending" || s === "accepted" || s === "active") return ["cancelled"];
    return [];
  }, [booking.status, role]);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex gap-4">
        <div className="h-20 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {cover ? <img alt={title} className="h-full w-full object-cover opacity-90" loading="lazy" src={cover} /> : <div className="h-full w-full bg-gradient-to-br from-cyan-400/25 via-violet-500/15 to-black" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">
                {fmt(booking.startDate)} → {fmt(booking.endDate)}
              </p>
            </div>
            <StatusPill status={booking.status} />
          </div>

          {actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((s) => (
                <button
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdating}
                  key={s}
                  onClick={() => onUpdateStatus(booking._id, s)}
                  type="button"
                >
                  {isUpdating ? "Updating..." : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("me"); // me | owner
  const { bookings, isLoading, error, refetch, updateStatus, clearError } = useBookings({ mode: tab === "owner" ? "owner" : "me" });
  const [updatingId, setUpdatingId] = useState("");

  const handleUpdate = async (id, status) => {
    clearError();
    setUpdatingId(id);
    try {
      await updateStatus(id, status);
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-32">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-black">Bookings</h1>
          <p className="mt-3 text-muted">Real-time booking requests & status transitions from the backend API.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MagneticButton className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10" onClick={refetch}>
            Refresh
          </MagneticButton>
        </div>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: "me", label: "My bookings" },
          { id: "owner", label: "Owner inbox" },
        ].map((t) => (
          <button
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-black" : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/10"
            }`}
            key={t.id}
            onClick={() => {
              clearError();
              setTab(t.id);
            }}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6">
          <GlassCard className="border-red-400/20 bg-red-400/10">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <p className="text-sm text-red-100">{error}</p>
              <button className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" onClick={clearError} type="button">
                Dismiss
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      <Reveal className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <GlassCard className="min-h-[420px]">
          <p className="text-sm uppercase text-cyan-100">Availability</p>
          <h2 className="mt-2 text-2xl font-black">Calendar view</h2>
          <p className="mt-3 text-muted">Select a listing to visualize blocked dates (wired next from listing cards).</p>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                className={`grid aspect-square place-items-center rounded-xl ${
                  i % 6 === 0 ? "bg-red-400/20 text-red-100" : "bg-white/[0.06]"
                }`}
                key={i}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard>
            <p className="text-sm uppercase text-cyan-100">Session</p>
            <h2 className="mt-2 text-2xl font-black">{user?.name ? `Hi, ${user.name}` : "Your bookings"}</h2>
            <p className="mt-3 text-muted">Statuses: pending → accepted/rejected → active → completed, with cancellations supported.</p>
          </GlassCard>

          {isLoading ? (
            <StaggerReveal className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <GlassCard className="animate-pulse" key={i}>
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
                  <div className="mt-6 h-10 rounded-full bg-white/10" />
                </GlassCard>
              ))}
            </StaggerReveal>
          ) : bookings.length === 0 ? (
            <GlassCard className="text-center">
              <p className="text-sm uppercase text-cyan-100">No bookings yet</p>
              <h2 className="mt-2 text-2xl font-black">Create a booking from Listings</h2>
              <p className="mt-3 text-muted">Use “Quick book” to request dates. Conflicts are prevented server-side.</p>
            </GlassCard>
          ) : (
            <StaggerReveal className="grid gap-3">
              {bookings.map((b) => (
                <BookingCard
                  booking={b}
                  isUpdating={updatingId === b._id}
                  key={b._id}
                  onUpdateStatus={handleUpdate}
                  role={tab === "owner" ? "owner" : "renter"}
                />
              ))}
            </StaggerReveal>
          )}
        </div>
      </Reveal>
    </div>
  );
}
