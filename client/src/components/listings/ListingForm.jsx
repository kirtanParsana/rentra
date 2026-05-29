import { useEffect, useMemo, useState } from "react";
import ImageUploader from "./ImageUploader";
import MagneticButton from "../motion/MagneticButton";

export default function ListingForm({
  initialValues,
  onCancel,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
  error = "",
}) {
  const defaults = useMemo(
    () => ({
      title: "",
      description: "",
      category: "",
      images: [],
      location: "",
      availability: true,
      ...initialValues,
      pricePerDay:
        initialValues?.pricePerDay != null ? String(initialValues.pricePerDay) : "",
    }),
    [initialValues]
  );

  const [form, setForm] = useState(defaults);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    setForm(defaults);
    setFieldError("");
  }, [defaults]);

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFieldError("");
  };

  const validate = () => {
    const title = String(form.title || "").trim();
    const description = String(form.description || "").trim();
    const category = String(form.category || "").trim();
    const location = String(form.location || "").trim();
    const price = Number(form.pricePerDay);

    if (!title || !description || !category || !location || Number.isNaN(price)) {
      return "Title, description, category, location and a valid price are required.";
    }
    if (price < 0) return "Price per day must be >= 0.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFieldError(err);
      return;
    }

    const payload = {
      title: String(form.title).trim(),
      description: String(form.description).trim(),
      category: String(form.category).trim(),
      location: String(form.location).trim(),
      pricePerDay: Number(form.pricePerDay),
      images: Array.isArray(form.images) ? form.images : [],
      availability: Boolean(form.availability),
    };

    await onSubmit(payload);
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {(fieldError || error) && (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {fieldError || error}
        </p>
      )}

      <label className="grid gap-2 text-sm text-muted">
        Title
        <input
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
          name="title"
          onChange={setField}
          required
          value={form.title}
        />
      </label>

      <label className="grid gap-2 text-sm text-muted">
        Description
        <textarea
          className="min-h-28 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
          name="description"
          onChange={setField}
          required
          value={form.description}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted">
          Category
          <input
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
            name="category"
            onChange={setField}
            placeholder="Apartment / Vehicle / Gear"
            required
            value={form.category}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Price per day
          <input
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
            inputMode="decimal"
            name="pricePerDay"
            onChange={setField}
            required
            type="number"
            value={form.pricePerDay}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-muted">
        Location
        <input
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_4px_rgba(34,211,238,.12)]"
          name="location"
          onChange={setField}
          placeholder="City, State"
          required
          value={form.location}
        />
      </label>

      <label className="grid gap-2 text-sm text-muted">
        Images
        <ImageUploader
          onChange={(next) => {
            setForm((prev) => ({ ...prev, images: next }));
            setFieldError("");
          }}
          value={form.images}
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-muted">
        Available
        <input checked={form.availability} name="availability" onChange={setField} type="checkbox" />
      </label>

      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <button
          className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <MagneticButton
          className="magnetic rounded-full bg-white px-6 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </MagneticButton>
      </div>
    </form>
  );
}
