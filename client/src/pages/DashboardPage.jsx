import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { useAuth } from "../providers/AuthProvider";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import MotionCard from "../components/motion/MotionCard";
import Reveal from "../components/motion/Reveal";
import { StaggerReveal } from "../components/motion/StaggerReveal";
import MagneticButton from "../components/motion/MagneticButton";
import { formatINR } from "../utils/format";

function GlassCard({ children, className = "" }) {
  return <MotionCard className={className}>{children}</MotionCard>;
}

function legacyFormatINR(amount) {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

void legacyFormatINR;

function MiniStat({ label, value, sub }) {
  return (
    <GlassCard>
      <p className="text-sm text-muted">{label}</p>
      <strong className="mt-3 block text-3xl">{value}</strong>
      {sub ? <p className="mt-2 text-xs text-muted">{sub}</p> : null}
    </GlassCard>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white shadow-glass backdrop-blur-xl">
      <p className="text-xs text-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey}>
          <span className="text-white/70">{p.name}:</span> <span className="font-semibold">{p.dataKey === "earnings" ? formatINR(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch, clearError } = useDashboardAnalytics();

  const metrics = data?.metrics;
  const earningsSeries = data?.charts?.earningsLast30Days || [];
  const bookingsByStatus = data?.charts?.bookingsByStatus || [];
  const recentBookings = data?.recentActivity?.recentBookings || [];
  const recentListings = data?.recentActivity?.recentListings || [];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32">
      <Reveal>
      <p className="mb-3 text-sm uppercase text-cyan-100">Welcome{user?.name ? `, ${user.name}` : ""}</p>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-black">Dashboard</h1>
          <p className="mt-3 text-muted">Live marketplace analytics powered by MongoDB aggregations.</p>
        </div>
        <MagneticButton className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10" onClick={refetch}>
          Refresh
        </MagneticButton>
      </div>
      </Reveal>

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

      <StaggerReveal className="mt-8 grid gap-4 md:grid-cols-4">
        <MiniStat label="Earnings" sub="All-time completed bookings" value={isLoading ? "—" : formatINR(metrics?.earnings)} />
        <MiniStat label="Total listings" value={isLoading ? "—" : String(metrics?.totalListings ?? 0)} />
        <MiniStat label="Active bookings" sub="Accepted + Active" value={isLoading ? "—" : String(metrics?.activeBookings ?? 0)} />
        <MiniStat label="Completed bookings" value={isLoading ? "—" : String(metrics?.completedBookings ?? 0)} />
      </StaggerReveal>

      <Reveal className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
        <GlassCard className="min-h-96">
          <p className="text-sm uppercase text-cyan-100">Earnings</p>
          <h2 className="mt-2 text-2xl font-black">Last 30 days</h2>
          <div className="mt-6 h-72">
            {isLoading ? (
              <div className="h-full w-full animate-pulse rounded-2xl bg-white/10" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(34,211,238,0.55)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="rgba(34,211,238,0)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} width={44} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area name="Earnings" dataKey="earnings" stroke="rgba(34,211,238,0.95)" fill="url(#earningsFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm uppercase text-cyan-100">Bookings</p>
          <h2 className="mt-2 text-2xl font-black">By status</h2>
          <div className="mt-6 h-72">
            {isLoading ? (
              <div className="h-full w-full animate-pulse rounded-2xl bg-white/10" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} width={34} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar name="Count" dataKey="count" fill="rgba(139,92,246,0.75)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </Reveal>

      <StaggerReveal className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm uppercase text-cyan-100">Recent activity</p>
          <h2 className="mt-2 text-2xl font-black">Bookings</h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div className="h-14 animate-pulse rounded-2xl bg-white/10" key={i} />)
            ) : recentBookings.length === 0 ? (
              <p className="text-muted">No booking activity yet.</p>
            ) : (
              recentBookings.map((b) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4" key={b._id}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.listing?.title || "Listing"}</p>
                    <p className="text-sm text-muted">
                      {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()} • {b.renter?.name || "Renter"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize">{b.status}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm uppercase text-cyan-100">Recent activity</p>
          <h2 className="mt-2 text-2xl font-black">Listings</h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div className="h-14 animate-pulse rounded-2xl bg-white/10" key={i} />)
            ) : recentListings.length === 0 ? (
              <p className="text-muted">No listings yet.</p>
            ) : (
              recentListings.map((l, idx) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4" key={`${l._id || l.title}-${idx}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.title}</p>
                    <p className="text-sm text-muted">
                      {l.category} • {formatINR(l.pricePerDay)}/day • {l.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">{l.availability ? "Live" : "Paused"}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </StaggerReveal>
    </main>
  );
}
