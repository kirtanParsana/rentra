import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createListing as createListingApi,
  deleteListing as deleteListingApi,
  fetchListings,
  updateListing as updateListingApi,
} from "../api/listings";
import { getApiErrorMessage } from "../api/client";

function normalizeListing(raw) {
  if (!raw) return null;
  return {
    _id: raw._id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    category: raw.category ?? "",
    pricePerDay: raw.pricePerDay ?? 0,
    images: Array.isArray(raw.images) ? raw.images : [],
    location: raw.location ?? "",
    availability: Boolean(raw.availability),
    owner: raw.owner,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function useListings() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const pendingRef = useRef(new Map()); // id -> previous snapshot

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchListings();
      const next = (data?.listings || []).map(normalizeListing).filter(Boolean);
      setListings(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createListing = useCallback(async (payload) => {
    setError("");
    const optimisticId = `optimistic-${crypto.randomUUID?.() || String(Date.now())}`;
    const optimistic = {
      _id: optimisticId,
      ...payload,
      images: Array.isArray(payload.images) ? payload.images : [],
      availability: payload.availability ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: payload.owner,
    };

    setListings((prev) => [optimistic, ...prev]);
    pendingRef.current.set(optimisticId, null);

    try {
      const data = await createListingApi(payload);
      const created = normalizeListing(data?.listing);
      if (!created) throw new Error("Invalid server response");

      setListings((prev) => prev.map((l) => (l._id === optimisticId ? created : l)));
      pendingRef.current.delete(optimisticId);
      return created;
    } catch (err) {
      setListings((prev) => prev.filter((l) => l._id !== optimisticId));
      pendingRef.current.delete(optimisticId);
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const editListing = useCallback(async (id, patch) => {
    setError("");
    setListings((prev) => {
      const current = prev.find((l) => l._id === id);
      pendingRef.current.set(id, current);
      return prev.map((l) => (l._id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l));
    });

    try {
      const data = await updateListingApi(id, patch);
      const updated = normalizeListing(data?.listing);
      if (!updated) throw new Error("Invalid server response");

      setListings((prev) => prev.map((l) => (l._id === id ? updated : l)));
      pendingRef.current.delete(id);
      return updated;
    } catch (err) {
      const prevSnapshot = pendingRef.current.get(id);
      pendingRef.current.delete(id);
      if (prevSnapshot) {
        setListings((prev) => prev.map((l) => (l._id === id ? prevSnapshot : l)));
      }
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const removeListing = useCallback(async (id) => {
    setError("");
    let snapshot = null;
    setListings((prev) => {
      snapshot = prev.find((l) => l._id === id) || null;
      pendingRef.current.set(id, snapshot);
      return prev.filter((l) => l._id !== id);
    });

    try {
      await deleteListingApi(id);
      pendingRef.current.delete(id);
      return true;
    } catch (err) {
      const prevSnapshot = pendingRef.current.get(id);
      pendingRef.current.delete(id);
      if (prevSnapshot) {
        setListings((prev) => [prevSnapshot, ...prev]);
      }
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const value = useMemo(
    () => ({
      listings,
      isLoading,
      error,
      refetch: load,
      createListing,
      editListing,
      removeListing,
      clearError: () => setError(""),
    }),
    [createListing, editListing, error, isLoading, listings, load, removeListing]
  );

  return value;
}

