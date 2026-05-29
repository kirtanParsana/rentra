import { apiClient } from "./client";

export async function uploadListingImages(files, { onProgress } = {}) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const { data } = await apiClient.post("/uploads/listing-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || 0;
      const percent = total ? Math.round((evt.loaded * 100) / total) : 0;
      onProgress({ loaded: evt.loaded, total, percent });
    },
  });

  return data;
}

