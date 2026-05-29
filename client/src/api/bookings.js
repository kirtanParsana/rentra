import { apiClient } from "./client";

export async function createBooking(payload) {
  const { data } = await apiClient.post("/bookings", payload);
  return data;
}

export async function fetchMyBookings() {
  const { data } = await apiClient.get("/bookings/me");
  return data;
}

export async function fetchOwnerBookings() {
  const { data } = await apiClient.get("/bookings/owner");
  return data;
}

export async function updateBookingStatus(id, status) {
  const { data } = await apiClient.patch(`/bookings/${id}/status`, { status });
  return data;
}

export async function fetchListingAvailability(listingId) {
  const { data } = await apiClient.get(`/bookings/listing/${listingId}`);
  return data;
}

