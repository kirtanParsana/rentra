import { apiClient } from "./client";

export async function fetchDashboardAnalytics() {
  const { data } = await apiClient.get("/analytics/dashboard");
  return data;
}

