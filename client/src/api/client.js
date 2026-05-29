import axios from "axios";
import { readAuthFromStorage } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readAuthFromStorage()?.token;
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  return String(message);
}

