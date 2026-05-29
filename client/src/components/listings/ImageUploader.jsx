import { useCallback, useMemo, useRef, useState } from "react";
import { uploadListingImages } from "../../api/uploads";
import { getApiErrorMessage } from "../../api/client";

const MAX_FILES = 8;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function isAllowedType(file) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

export default function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [localFiles, setLocalFiles] = useState([]); // { id, file, previewUrl, status, progress, error }
  const [isDragging, setIsDragging] = useState(false);

  const images = Array.isArray(value) ? value : [];

  const remainingSlots = Math.max(0, MAX_FILES - images.length);

  const pickFiles = () => inputRef.current?.click();

  const validateFiles = useCallback(
    (files) => {
      const errors = [];
      const accepted = [];
      const list = Array.from(files || []);

      list.forEach((file) => {
        if (!isAllowedType(file)) {
          errors.push(`${file.name}: unsupported file type`);
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push(`${file.name}: too large (${formatBytes(file.size)}). Max 5MB`);
          return;
        }
        accepted.push(file);
      });

      if (accepted.length > remainingSlots) {
        errors.push(`You can upload at most ${remainingSlots} more image(s).`);
        accepted.splice(remainingSlots);
      }

      return { accepted, errors };
    },
    [remainingSlots]
  );

  const handleFiles = useCallback(
    async (files) => {
      const { accepted, errors } = validateFiles(files);
      if (errors.length) {
        setLocalFiles((prev) => [
          ...prev,
          ...errors.map((msg) => ({
            id: `err-${crypto.randomUUID?.() || Date.now()}`,
            status: "error",
            error: msg,
            progress: 0,
          })),
        ]);
      }
      if (!accepted.length) return;

      const batchId = crypto.randomUUID?.() || String(Date.now());

      const withPreviews = accepted.map((file) => ({
        id: `${batchId}-${file.name}-${file.size}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        progress: 0,
        error: "",
      }));

      setLocalFiles((prev) => [...withPreviews, ...prev]);

      try {
        const data = await uploadListingImages(accepted, {
          onProgress: ({ percent }) => {
            setLocalFiles((prev) =>
              prev.map((item) =>
                withPreviews.some((p) => p.id === item.id)
                  ? { ...item, progress: percent }
                  : item
              )
            );
          },
        });

        const uploaded = Array.isArray(data?.images) ? data.images : [];
        const urls = uploaded.map((img) => img.url).filter(Boolean);
        if (urls.length) onChange([...(images || []), ...urls]);

        setLocalFiles((prev) =>
          prev.map((item) =>
            withPreviews.some((p) => p.id === item.id)
              ? { ...item, status: "done", progress: 100 }
              : item
          )
        );
      } catch (err) {
        const msg = getApiErrorMessage(err);
        setLocalFiles((prev) =>
          prev.map((item) =>
            withPreviews.some((p) => p.id === item.id)
              ? { ...item, status: "error", error: msg }
              : item
          )
        );
      }
    },
    [images, onChange, validateFiles]
  );

  const onInputChange = (e) => {
    const files = e.target.files;
    e.target.value = "";
    handleFiles(files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (url) => {
    onChange(images.filter((u) => u !== url));
  };

  const cleanupLocal = useCallback((id) => {
    setLocalFiles((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const dropClasses = useMemo(() => {
    const base =
      "rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-muted transition";
    return `${base} ${isDragging ? "border-cyan-300/60 bg-white/[0.08]" : "hover:bg-white/[0.06]"}`;
  }, [isDragging]);

  return (
    <div className="grid gap-3">
      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        multiple
        onChange={onInputChange}
        ref={inputRef}
        type="file"
      />

      <div
        className={dropClasses}
        onClick={pickFiles}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col gap-1">
          <span className="text-white">Drag & drop images here</span>
          <span>or click to upload (up to {MAX_FILES}, max 5MB each, JPEG/PNG/WEBP)</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid gap-3">
          <p className="text-xs uppercase text-cyan-100">Uploaded images</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((url) => (
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30" key={url}>
                <img alt="Listing" className="h-28 w-full object-cover opacity-90" loading="lazy" src={url} />
                <button
                  className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    removeImage(url);
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {localFiles.length > 0 && (
        <div className="grid gap-2">
          {localFiles.slice(0, 6).map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3" key={item.id}>
              <div className="flex items-center gap-3">
                {item.previewUrl ? (
                  <img alt="" className="size-10 rounded-xl object-cover" src={item.previewUrl} />
                ) : (
                  <div className="size-10 rounded-xl bg-white/10" />
                )}
                <div>
                  <p className="text-sm text-white">
                    {item.file?.name || (item.status === "error" ? "Upload error" : "Upload")}
                  </p>
                  {item.status === "uploading" && (
                    <p className="text-xs text-muted">Uploading… {item.progress}%</p>
                  )}
                  {item.status === "done" && <p className="text-xs text-emerald-200">Uploaded</p>}
                  {item.status === "error" && (
                    <p className="text-xs text-red-100">{item.error || "Upload failed"}</p>
                  )}
                </div>
              </div>

              <button
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  cleanupLocal(item.id);
                }}
                type="button"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

