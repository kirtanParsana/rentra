import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ListingForm from "../components/listings/ListingForm";
import { useAuth } from "../providers/AuthProvider";
import { useListings } from "../hooks/useListings";
import { useListingAvailability, useBookings } from "../hooks/useBookings";
import MotionCard from "../components/motion/MotionCard";
import MagneticButton from "../components/motion/MagneticButton";
import { StaggerItem, StaggerReveal } from "../components/motion/StaggerReveal";
import Reveal from "../components/motion/Reveal";
import { modalOverlay, modalPanel } from "../motion/variants";
import { formatINR } from "../utils/format";

function GlassCard({ children, className = "" }) {
  return <MotionCard className={className}>{children}</MotionCard>;
}

function Modal({ title, children, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center px-4" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} role="presentation" />
      <motion.div className="relative w-full max-w-2xl" variants={modalPanel}>
      <GlassCard>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-cyan-100">Listings</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
          </div>
          <button className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function formatDateInput(date) {
  const d = new Date(date);
  // yyyy-mm-dd
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rangesToBlockedSet(blocked) {
  const set = new Set();
  blocked.forEach((b) => {
    const s = new Date(b.startDate);
    const e = new Date(b.endDate);
    for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
      set.add(formatDateInput(d));
    }
  });
  // keep only around visible window in UI layer if needed later
  return set;
}

function BookingModal({ listing, onClose, onBooked }) {
  const { blocked, isLoading, error } = useListingAvailability(listing?._id);
  const { createBooking } = useBookings({ mode: "me" });
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const blockedSet = useMemo(() => rangesToBlockedSet(blocked, today), [blocked, today]);

  const canSubmit = startDate && endDate && startDate < endDate && !blockedSet.has(startDate);

  const submit = async () => {
    setLocalError("");
    if (!canSubmit) {
      setLocalError("Please select a valid date range.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createBooking({ listingId: listing._id, startDate, endDate });
      onBooked?.();
      onClose();
    } catch (e) {
      setLocalError(e.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center px-4" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} role="presentation" />
      <motion.div className="relative w-full max-w-2xl" variants={modalPanel}>
      <GlassCard>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-cyan-100">Booking request</p>
            <h2 className="mt-1 text-2xl font-black">Quick book</h2>
            <p className="mt-2 text-sm text-muted">{listing.title}</p>
          </div>
          <button className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {(localError || error) && (
          <p className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {localError || error}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-muted">
            Start date
            <input
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              value={startDate}
            />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            End date
            <input
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              value={endDate}
            />
          </label>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase text-cyan-100">Availability preview</p>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const key = formatDateInput(d);
              const blockedDay = blockedSet.has(key);
              return (
                <div
                  className={`grid aspect-square place-items-center rounded-xl text-xs ${
                    isLoading ? "bg-white/[0.06] text-white/40" : blockedDay ? "bg-red-400/20 text-red-100" : "bg-emerald-400/15 text-emerald-100"
                  }`}
                  key={key}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted">Green = available, Red = blocked. Conflicts are enforced server-side.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10" onClick={onClose} type="button">
            Cancel
          </button>
          <MagneticButton className="rounded-full bg-white px-6 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSubmit || isSubmitting} onClick={submit}>
            {isSubmitting ? "Requesting..." : "Request booking"}
          </MagneticButton>
        </div>
      </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function ListingCard({ listing, canManage, onEdit, onDelete, onQuickBook, onMessageOwner, canBook }) {
  const cover = listing.images?.[0];
  const badge = listing.availability ? "Live" : "Paused";

  return (
    <GlassCard className="group min-h-72">
      <div className="relative h-36 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {cover ? (
          <img alt={listing.title} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03]" loading="lazy" src={cover} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cyan-400/25 via-violet-500/15 to-black" />
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{listing.category}</p>
          <h3 className="text-xl font-bold">{listing.title}</h3>
          <p className="mt-1 text-sm text-muted">{listing.location}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">{badge}</span>
      </div>

      <p className="mt-5 text-2xl font-black">{formatINR(listing.pricePerDay)}/day</p>

      <div className="mt-5 grid gap-2">
        <MagneticButton
          className="w-full rounded-full border border-white/10 bg-white/10 py-3 font-semibold transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canBook}
          onClick={onQuickBook}
        >
          Quick book
        </MagneticButton>

        {canBook && (
          <MagneticButton
            className="w-full rounded-full border border-white/10 bg-white/[0.06] py-3 font-semibold text-white transition hover:bg-white/10"
            onClick={onMessageOwner}
          >
            Message owner
          </MagneticButton>
        )}

        {canManage && (
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-full border border-white/10 bg-white/[0.06] py-3 text-sm font-semibold text-white transition hover:bg-white/10" onClick={onEdit} type="button">
              Edit
            </button>
            <button className="rounded-full border border-red-400/20 bg-red-400/10 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/15" onClick={onDelete} type="button">
              Delete
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function ListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listings, isLoading, error, refetch, createListing, editListing, removeListing, clearError } = useListings();
  const [bookingListing, setBookingListing] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const userId = user?.id || user?._id;

  const mine = useMemo(() => {
    if (!userId) return new Set();
    return new Set(listings.filter((l) => String(l.owner?._id || l.owner) === String(userId)).map((l) => l._id));
  }, [listings, userId]);

  const openCreate = () => {
    clearError();
    setEditing(null);
    setIsCreateOpen(true);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditing(null);
    setIsSaving(false);
  };

  const handleCreate = async (payload) => {
    setIsSaving(true);
    try {
      await createListing(payload);
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!editing?._id) return;
    setIsSaving(true);
    try {
      await editListing(editing._id, payload);
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (listing) => {
    if (!listing?._id) return;
    clearError();
    const ok = window.confirm(`Delete "${listing.title}"? This can't be undone.`);
    if (!ok) return;
    await removeListing(listing._id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-32">
      <Reveal>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-black">Listings</h1>
          <p className="mt-3 text-muted">Marketplace listings synced from the backend API.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10" onClick={refetch} type="button">
            Refresh
          </button>
          <button className="rounded-full bg-white px-6 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60" disabled={!user} onClick={openCreate} type="button">
            Create listing
          </button>
        </div>
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

      <div className="mt-8">
        {isLoading ? (
          <StaggerReveal className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StaggerItem key={i}><GlassCard className="min-h-72 animate-pulse">
                <div className="h-36 rounded-2xl bg-white/10" />
                <div className="mt-5 h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
                <div className="mt-6 h-10 rounded-full bg-white/10" />
              </GlassCard></StaggerItem>
            ))}
          </StaggerReveal>
        ) : listings.length === 0 ? (
          <GlassCard className="text-center">
            <p className="text-sm uppercase text-cyan-100">No listings yet</p>
            <h2 className="mt-2 text-2xl font-black">Create the first listing</h2>
            <p className="mt-3 text-muted">Once created, it will appear here immediately.</p>
          </GlassCard>
        ) : (
          <StaggerReveal className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => {
              const canManage = userId && mine.has(listing._id);
              const canBook = Boolean(userId) && !canManage;
              return (
                <StaggerItem key={listing._id}>
                <ListingCard
                  canManage={canManage}
                  canBook={canBook}
                  listing={listing}
                  onDelete={() => handleDelete(listing)}
                  onEdit={() => {
                    clearError();
                    setEditing(listing);
                    setIsCreateOpen(true);
                  }}
                  onQuickBook={() => {
                    clearError();
                    setBookingListing(listing);
                  }}
                  onMessageOwner={() => {
                    const ownerId = listing.owner?._id || listing.owner;
                    if (ownerId) navigate(`/chat?recipientId=${ownerId}`);
                  }}
                />
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        )}
      </div>

      <AnimatePresence>
      {isCreateOpen && (
        <Modal onClose={closeModal} title={editing ? "Edit listing" : "Create listing"}>
          <ListingForm
            error={error}
            initialValues={editing || undefined}
            isSubmitting={isSaving}
            onCancel={closeModal}
            onSubmit={editing ? handleEdit : handleCreate}
            submitLabel={editing ? "Update listing" : "Create listing"}
          />
        </Modal>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {bookingListing && (
        <BookingModal
          listing={bookingListing}
          onBooked={() => {}}
          onClose={() => setBookingListing(null)}
        />
      )}
      </AnimatePresence>
    </div>
  );
}
