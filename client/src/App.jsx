import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./providers/AuthProvider.jsx";
import { SocketProvider } from "./providers/SocketProvider.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import NotificationCenter from "./components/realtime/NotificationCenter.jsx";
import SmoothScrollProvider from "./components/motion/SmoothScrollProvider.jsx";
import PageTransition from "./components/motion/PageTransition.jsx";
import MagneticButton from "./components/motion/MagneticButton.jsx";
import MotionCard from "./components/motion/MotionCard.jsx";
import Reveal from "./components/motion/Reveal.jsx";
import { StaggerItem, StaggerReveal } from "./components/motion/StaggerReveal.jsx";
import ParallaxLayer from "./components/motion/ParallaxLayer.jsx";
import { modalPanel } from "./motion/variants.js";
import { formatINR } from "./utils/format.js";

const HeroOrbScene = lazy(() => import("./components/three/HeroOrbScene.jsx"));
const ListingsPage = lazy(() => import("./pages/ListingsPage.jsx"));
const BookingsPage = lazy(() => import("./pages/BookingsPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));

const listings = [
  { name: "Skyline Studio", type: "Apartment", price: 7200, status: "Live", glow: "from-cyan-400" },
  { name: "Tesla Model 3", type: "Vehicle", price: 9800, status: "Trending", glow: "from-blue-500" },
  { name: "Cinema Camera Kit", type: "Gear", price: 3500, status: "Booked", glow: "from-violet-500" },
  { name: "Founder Workspace", type: "Office", price: 5400, status: "New", glow: "from-emerald-400" },
];

const stats = [
  ["18.4k", "live listings"],
  ["92ms", "booking sync"],
  ["4.9/5", "host trust"],
  ["37", "active cities"],
];

function Shell({ children }) {
  return (
    <div className="min-h-screen overflow-hidden bg-ink text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,.24),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(139,92,246,.18),transparent_26%),linear-gradient(180deg,#05060A,#080B12_45%,#05060A)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:72px_72px]" />
      <Navbar />
      {children}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-glass backdrop-blur-2xl">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white text-sm font-black text-black">R</span>
          <span className="text-lg font-semibold tracking-tight">Rentra</span>
        </NavLink>
        <div className="hidden items-center gap-1 md:flex">
          {["Home", "Listings", "Bookings", "Dashboard", "Chat"].map((item) => (
            <NavLink
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${isActive ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`
              }
            >
              {item}
            </NavLink>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <MagneticButton className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black" onClick={logout}>
              Logout
            </MagneticButton>
          </div>
        ) : (
          <MagneticButton as={NavLink} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black" to="/login">
            Sign in
          </MagneticButton>
        )}
      </nav>
    </header>
  );
}

function Home() {
  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32">
        <section className="grid min-h-[calc(100vh-8rem)] items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal>
            <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cyan-100 backdrop-blur-xl">
              Real-time rental marketplace for modern cities
            </p>
            <h1 className="max-w-4xl text-6xl font-black leading-[.88] tracking-tight sm:text-7xl lg:text-8xl">
              The future of renting is live.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
              Discover, book, list, and manage rentals with cinematic speed, realtime availability, and a marketplace experience built for trust.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <MagneticButton as={NavLink} className="rounded-full bg-white px-6 py-3 font-semibold text-black shadow-glow" to="/listings">
                Explore rentals
              </MagneticButton>
              <MagneticButton as={NavLink} className="rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 font-semibold text-white backdrop-blur-xl" to="/register">
                List your item
              </MagneticButton>
            </div>
            <StaggerReveal className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <StaggerItem key={label}>
                  <GlassCard>
                    <strong className="block text-2xl">{value}</strong>
                    <span className="text-xs uppercase text-muted">{label}</span>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </Reveal>
          <HeroScene />
        </section>
        <Section title="Featured listings" subtitle="High-converting rental cards with depth, status, and instant actions.">
          <ListingGrid />
        </Section>
        <Section title="Live marketplace pulse" subtitle="Socket.IO-ready activity feed for bookings, chat, and notifications.">
          <LiveFeed />
        </Section>
      </main>
    </Shell>
  );
}

function HeroScene() {
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const desktop = window.matchMedia?.("(min-width: 1024px)")?.matches;
    if (reduced || !desktop) return undefined;
    const start = () => setShow3D(true);
    const id = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 450);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  return (
    <ParallaxLayer className="relative min-h-[540px]" distance={42}>
      <div className="absolute inset-8 rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-glass backdrop-blur-2xl" />
      <div className="pointer-events-none absolute right-16 top-6 hidden h-52 w-52 opacity-80 lg:block">
        {show3D && (
          <Suspense fallback={<div className="h-full rounded-full bg-cyan-300/10" />}>
            <HeroOrbScene />
          </Suspense>
        )}
      </div>
      <div className="absolute left-8 top-10 h-52 w-72 rotate-[-10deg] rounded-[2rem] bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 p-[1px] shadow-glow">
        <div className="h-full rounded-[2rem] bg-black/70 p-5 backdrop-blur-xl">
          <span className="text-sm text-cyan-100">Now available</span>
          <h3 className="mt-16 text-3xl font-black">Luxury loft</h3>
          <p className="text-muted">{formatINR(7200)} per day</p>
        </div>
      </div>
      <div className="absolute right-4 top-28 h-44 w-56 rotate-6 rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-glass backdrop-blur-xl">
        <div className="mb-8 h-16 rounded-2xl bg-gradient-to-r from-white/30 to-white/5" />
        <h3 className="text-2xl font-bold">Model 3</h3>
        <p className="text-sm text-muted">Booked in 2 taps</p>
      </div>
      <div className="absolute bottom-14 left-20 right-10 rounded-[2rem] border border-white/10 bg-black/50 p-5 shadow-glass backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Realtime booking state</p>
            <h3 className="text-2xl font-bold">Accepted to Active</h3>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-200">Synced</span>
        </div>
      </div>
    </ParallaxLayer>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <Reveal as="section" className="py-20">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight md:text-6xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </Reveal>
  );
}

function GlassCard({ children, className = "" }) {
  return <MotionCard className={className}>{children}</MotionCard>;
}

function ListingGrid() {
  return (
    <StaggerReveal className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {listings.map((item) => (
        <StaggerItem key={item.name}>
        <GlassCard className="group min-h-72">
          <div className={`h-36 rounded-2xl bg-gradient-to-br ${item.glow} via-white/10 to-black transition duration-500 group-hover:scale-[1.02]`} />
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{item.type}</p>
              <h3 className="text-xl font-bold">{item.name}</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">{item.status}</span>
          </div>
          <p className="mt-5 text-2xl font-black">{formatINR(item.price)}/day</p>
          <MagneticButton className="mt-5 w-full rounded-full border border-white/10 bg-white/10 py-3 font-semibold transition hover:bg-white hover:text-black">
            Quick book
          </MagneticButton>
        </GlassCard>
        </StaggerItem>
      ))}
    </StaggerReveal>
  );
}

function LiveFeed() {
  const feed = ["Camera kit booked in Pune", "New villa listed in Goa", "Host accepted workspace request", "Chat message from verified owner"];
  return (
    <GlassCard>
      <div className="grid gap-3">
        {feed.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
            <span>{item}</span>
            <span className="text-sm text-cyan-100">{index + 1}m ago</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      await (isRegister ? register(payload) : login(payload));
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <main className="grid min-h-screen items-center gap-8 px-4 pt-28 lg:grid-cols-2 lg:px-12">
        <div className="hidden lg:block">
          <h1 className="text-7xl font-black leading-none">{isRegister ? "Join the live rental economy." : "Welcome back to Rentra."}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted">A glass-first auth flow with validation states, floating activity cards, and session transitions.</p>
        </div>
        <motion.div variants={modalPanel} initial="hidden" animate="visible">
        <GlassCard className="mx-auto w-full max-w-md">
          <p className="text-sm uppercase text-cyan-100">{isRegister ? "Create account" : "Secure login"}</p>
          <h2 className="mt-2 text-3xl font-black">{isRegister ? "Start renting smarter" : "Access your dashboard"}</h2>
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            {isRegister && <Input label="Full name" name="name" onChange={updateField} placeholder="Kirtan Shah" required value={form.name} />}
            <Input label="Email" name="email" onChange={updateField} placeholder="you@rentra.app" required type="email" value={form.email} />
            <Input label="Password" minLength="6" name="password" onChange={updateField} placeholder="Password" required type="password" value={form.password} />
            {isRegister && (
              <div className="grid grid-cols-3 gap-2">
                {["Renter", "Owner", "Both"].map((role) => <button className="rounded-xl border border-white/10 bg-white/[0.06] py-3 text-sm" key={role} type="button">{role}</button>)}
              </div>
            )}
            {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
            <MagneticButton className="mt-2 rounded-full bg-white py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Securing session..." : isRegister ? "Create account" : "Sign in"}
            </MagneticButton>
          </form>
        </GlassCard>
        </motion.div>
      </main>
    </Shell>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm text-muted">
      {label}
      <input className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]" {...props} />
    </label>
  );
}

function Dashboard() {
  return (
    <Shell>
      <Suspense fallback={sessionFallback}>
        <DashboardPage />
      </Suspense>
    </Shell>
  );
}

function Listings() {
  return (
    <Shell>
      <Suspense fallback={sessionFallback}>
        <ListingsPage />
      </Suspense>
    </Shell>
  );
}

function Bookings() {
  return (
    <Shell>
      <Suspense fallback={sessionFallback}>
        <BookingsPage />
      </Suspense>
    </Shell>
  );
}

function Chat() {
  return (
    <Shell>
      <Suspense fallback={sessionFallback}>
        <ChatPage />
      </Suspense>
    </Shell>
  );
}

const sessionFallback = (
  <Shell>
    <main className="grid min-h-screen place-items-center px-4">
      <GlassCard className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 size-12 animate-pulse rounded-2xl bg-white" />
        <p className="text-sm uppercase text-cyan-100">Validating session</p>
        <h1 className="mt-2 text-2xl font-black">Preparing Rentra</h1>
      </GlassCard>
    </main>
  </Shell>
);

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><AuthPage mode="login" /></PageTransition>} />
        <Route path="/register" element={<PageTransition><AuthPage mode="register" /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><ProtectedRoute fallback={sessionFallback}><Dashboard /></ProtectedRoute></PageTransition>} />
        <Route path="/listings" element={<PageTransition><ProtectedRoute fallback={sessionFallback}><Listings /></ProtectedRoute></PageTransition>} />
        <Route path="/bookings" element={<PageTransition><ProtectedRoute fallback={sessionFallback}><Bookings /></ProtectedRoute></PageTransition>} />
        <Route path="/chat" element={<PageTransition><ProtectedRoute fallback={sessionFallback}><Chat /></ProtectedRoute></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SmoothScrollProvider>
          <AppRoutes />
        </SmoothScrollProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
