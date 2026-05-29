import { apiClient } from "./client";

export async function fetchListings({ availability } = {}) {
  const params = {};
  if (typeof availability === "boolean") params.availability = availability;
  const { data } = await apiClient.get("/listings", { params });
  return data;
}

export async function fetchListingById(id) {
  const { data } = await apiClient.get(`/listings/${id}`);
  return data;
}

export async function createListing(payload) {
  const { data } = await apiClient.post("/listings", payload);
  return data;
}

export async function updateListing(id, payload) {
  const { data } = await apiClient.put(`/listings/${id}`, payload);
  return data;
}

export async function deleteListing(id) {
  const { data } = await apiClient.delete(`/listings/${id}`);
  return data;
}

