"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateProviderProfile } from "@/lib/actions/connections";

type Provider = {
  name: string;
  specialty: string | null;
  credentials: string | null;
  bio: string | null;
  city: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function EditProfileForm({ provider }: { provider: Provider }) {
  const router = useRouter();
  const [name, setName] = useState(provider.name);
  const [specialty, setSpecialty] = useState(provider.specialty ?? "");
  const [credentials, setCredentials] = useState(provider.credentials ?? "");
  const [bio, setBio] = useState(provider.bio ?? "");
  const [city, setCity] = useState(provider.city ?? "");
  const [stateProvince, setStateProvince] = useState(provider.state_province ?? "");
  const [latitude, setLatitude] = useState(provider.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(provider.longitude?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Check your browser's location permission.");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("specialty", specialty);
    formData.set("credentials", credentials);
    formData.set("bio", bio);
    formData.set("city", city);
    formData.set("state_province", stateProvince);
    formData.set("latitude", latitude);
    formData.set("longitude", longitude);

    const result = await updateProviderProfile(formData);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-[480px]">
      <div>
        <label htmlFor="name" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div>
        <label htmlFor="specialty" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Specialty
        </label>
        <input
          id="specialty"
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div>
        <label htmlFor="credentials" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Credentials
        </label>
        <input
          id="credentials"
          type="text"
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          placeholder="e.g. MD, PhD, Board Certified Endocrinologist"
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            City
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            State
          </label>
          <input
            id="state"
            type="text"
            value={stateProvince}
            onChange={(e) => setStateProvince(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            Latitude
          </label>
          <input
            id="latitude"
            type="text"
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            Longitude
          </label>
          <input
            id="longitude"
            type="text"
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <button type="button" onClick={useMyLocation} disabled={locating} className="btn-secondary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
        {locating ? "Locating…" : "Use my location"}
      </button>

      {error && (
        <p role="alert" className="text-[13.5px] text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-[13.5px] text-teal">Profile updated.</p>}

      <div>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-40">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
