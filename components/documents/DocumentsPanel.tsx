"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Document = {
  id: string;
  file_path: string;
  file_name: string;
  category: string;
  uploaded_by: string | null;
  created_at: string;
};

type ConnectionOption = { id: string; label: string };

const CATEGORIES = ["Lab reports", "Imaging", "Prescriptions", "Insurance", "Other"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — enough for scanned lab reports/imaging PDFs
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function DocumentsPanel({
  patientId,
  viewerId,
  documents,
  title = "My documents",
  connectionId,
  connectionOptions,
}: {
  patientId: string;
  viewerId: string;
  documents: Document[];
  title?: string;
  // Fixed connection — the provider side already knows exactly which
  // relationship this is, so no picker is shown at all.
  connectionId?: string;
  // Patient side: their own active connections to choose from. Shown as
  // a required picker only when there's more than one; auto-selected
  // silently when there's exactly one; omitted entirely (document stays
  // private, connection_id null) when there are none.
  connectionOptions?: ConnectionOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(
    connectionId ?? (connectionOptions?.length === 1 ? connectionOptions[0].id : "")
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const needsConnectionPicker = !connectionId && (connectionOptions?.length ?? 0) > 1;
  const effectiveConnectionId = connectionId ?? selectedConnectionId ?? null;

  function resetForm() {
    setDocName("");
    setCategory(CATEGORIES[0]);
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, or PNG files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 10MB.");
      return;
    }
    if (needsConnectionPicker && !selectedConnectionId) {
      setError("Choose which provider to share this with.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `${patientId}/${effectiveConnectionId ?? "unassigned"}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      patient_id: patientId,
      uploaded_by: viewerId,
      file_path: path,
      file_name: docName.trim() || file.name,
      category,
      connection_id: effectiveConnectionId,
    });

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      // best-effort cleanup so a failed metadata insert doesn't leave an
      // orphaned file with nothing pointing at it
      await supabase.storage.from("documents").remove([path]);
      return;
    }

    resetForm();
    setFormOpen(false);
    router.refresh();
  }

  async function handleDownload(doc: Document) {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (signError || !data) {
      setError("Could not generate a download link.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(doc: Document) {
    setBusyId(doc.id);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (!deleteError) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    setBusyId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-lightblue dark:bg-teal/[0.08]">
        <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">{title}</h2>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="btn-primary !px-4 !py-2 text-[13px]"
        >
          {formOpen ? "Close" : "Upload document"}
        </button>
      </div>

      <div className="p-6">
        {formOpen && (
          <div className="rounded-[14px] border border-dashed border-line dark:border-white/15 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Document name</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Blood test results May 2026"
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {needsConnectionPicker && (
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Share with</label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Choose a provider…</option>
                  {connectionOptions!.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-muted dark:text-white/50 mt-1.5">
                  Only this provider will be able to see this document, not any other provider you&apos;re connected to.
                </p>
              </div>
            )}

            <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
              File (PDF, JPG, PNG, max 10MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-[13.5px] text-muted dark:text-white/60 mb-4 file:mr-3 file:py-2 file:px-3 file:rounded-[8px] file:border file:border-line dark:file:border-white/15 file:bg-white dark:file:bg-white/[0.04] file:text-[13px] file:font-semibold file:text-navy dark:file:text-white"
            />

            {error && <p className="text-[12.5px] text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                className="btn-secondary !px-4 !py-2.5 text-[13.5px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-[14px] border border-line dark:border-white/10 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-navy dark:text-white">{doc.file_name}</p>
                <p className="text-[12px] text-muted dark:text-white/60 mt-0.5">
                  {doc.category} · {new Date(doc.created_at).toLocaleDateString()} ·{" "}
                  {doc.uploaded_by === viewerId ? "Uploaded by you" : doc.uploaded_by === patientId ? "Uploaded by patient" : "Uploaded by provider"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDownload(doc)} className="btn-chip">
                  View
                </button>
                <button type="button" disabled={busyId === doc.id} onClick={() => handleDelete(doc)} className="btn-chip-danger disabled:opacity-40">
                  {busyId === doc.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && !formOpen && (
            <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
              <p className="text-muted dark:text-white/60 text-[14.5px]">
                No documents uploaded yet. Click &quot;Upload document&quot; to add your first file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
