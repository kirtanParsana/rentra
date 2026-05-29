import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBooking as createBookingApi,
  fetchListingAvailability,
  fetchMyBookings,
  fetchOwnerBookings,
  updateBookingStatus as updateBookingStatusApi,
} from "../api/bookings";
import { getApiErrorMessage } from "../api/client";
import { EVENTS } from "../realtime/events";
import { useSocketEvent } from "./useSocketEvent";
import { useSocket } from "../providers/SocketProvider";

function normalizeBooking(raw) {
  if (!raw) return null;
  return {
    _id: raw._id,
    listing: raw.listing,
    renter: raw.renter,
    owner: raw.owner,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function useBookings({ mode = "me" } = {}) {
  const { isConnected } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = mode === "owner" ? await fetchOwnerBookings() : await fetchMyBookings();
      const next = (data?.bookings || []).map(normalizeBooking).filter(Boolean);
      setBookings(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isConnected) load();
  }, [isConnected, load]);

  useSocketEvent(EVENTS.BOOKING_CREATED, ({ booking }) => {
    const b = normalizeBooking(booking);
    if (!b) return;
    setBookings((prev) => (prev.some((item) => item._id === b._id) ? prev : [b, ...prev]));
  });

  useSocketEvent(EVENTS.BOOKING_UPDATED, ({ booking }) => {
    const b = normalizeBooking(booking);
    if (!b) return;
    setBookings((prev) => prev.map((item) => (item._id === b._id ? b : item)));
  });

  const createBooking = useCallback(async (payload) => {
    setError("");
    try {
      const data = await createBookingApi(payload);
      const b = normalizeBooking(data?.booking);
      if (b) setBookings((prev) => [b, ...prev]);
      return b;
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    setError("");
    setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b))); // optimistic
    try {
      const data = await updateBookingStatusApi(id, status);
      const updated = normalizeBooking(data?.booking);
      if (updated) setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      return updated;
    } catch (err) {
      await load(); // safest revert without overengineering
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, [load]);

  const value = useMemo(
    () => ({
      bookings,
      isLoading,
      error,
      refetch: load,
      createBooking,
      updateStatus,
      clearError: () => setError(""),
    }),
    [bookings, createBooking, error, isLoading, load, updateStatus]
  );

  return value;
}

export function useListingAvailability(listingId) {
  const [blocked, setBlocked] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(listingId));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!listingId) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchListingAvailability(listingId);
      setBlocked(Array.isArray(data?.blocked) ? data.blocked : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { blocked, isLoading, error, refetch: load };
}
