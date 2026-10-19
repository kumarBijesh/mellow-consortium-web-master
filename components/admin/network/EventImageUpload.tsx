"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Real upload to the `event-images` Storage bucket (see
// supabase/event-images-storage.sql) — an admin picks a file, it uploads
// directly from the browser, and the resulting public URL fills the
// hidden `cover_image_url` field the surrounding <form> submits. The
// manual "paste a URL" input stays available as a fallback for images
// already hosted elsewhere on *.supabase.co.
export default function EventImageUpload({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("event-images").upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setUrl(data.publicUrl);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <label className="adm-label">Cover image</label>

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-[120px] object-cover rounded-[10px] mb-2.5 bg-white/5" />
      )}

      <input type="hidden" name={name} value={url} />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="adm-btn-ghost !py-2 !text-[12.5px]">
          {uploading ? "Uploading…" : url ? "Replace photo" : "Upload photo"}
        </button>
        {url && (
          <button type="button" onClick={() => setUrl("")} className="text-[12px] font-semibold text-red-400 hover:text-red-300 transition">
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}

      <details className="mt-2.5">
        <summary className="text-[11.5px] text-muted dark:text-white/40 cursor-pointer">Or paste an image URL directly</summary>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://...supabase.co/..."
          className="adm-input mt-2"
        />
      </details>
    </div>
  );
}
