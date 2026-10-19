import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, TextAreaField } from "@/components/admin/AdminFields";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

export default async function NetworkSettingsPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const supabase = createClient();
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("key", "longevity_market")
    .maybeSingle();

  async function updateMarketStat(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const numericValue = Number(formData.get("numeric_value"));
    const source = String(formData.get("source") ?? "").trim();
    if (!Number.isFinite(numericValue) || !source) {
      redirect(`/${locale}/admin/network/settings?error=${encodeURIComponent("A numeric value and a source are both required.")}`);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("platform_settings")
      .update({
        numeric_value: numericValue,
        unit: strOrNull(formData.get("unit")),
        source,
        updated_at: new Date().toISOString(),
      })
      .eq("key", "longevity_market");

    if (error) {
      console.error("[admin/network/settings] update failed:", error);
      redirect(`/${locale}/admin/network/settings?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/settings");
    revalidatePath("/");
    redirect(`/${locale}/admin/network/settings?saved=1`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-2">Market stat</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-6">
        The "Longevity Market" figure on the public stats bar isn't derived from platform data. It's an external
        market-size estimate. Unlike every other stat, it can't be a live COUNT query, so it's stored here as a
        single admin-edited value with a mandatory source citation instead of a hardcoded constant.
      </p>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}
      {searchParams.saved && (
        <div className="text-[13px] text-teal mb-5 rounded-xl border border-teal/20 bg-teal/5 p-3">Saved.</div>
      )}

      <form action={updateMarketStat} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="numeric_value" label="Value" type="number" step="0.1" required defaultValue={setting?.numeric_value != null ? String(setting.numeric_value) : ""} />
          <TextField name="unit" label="Unit (e.g. B, T)" defaultValue={setting?.unit ?? ""} />
        </div>
        <TextAreaField
          name="source"
          label="Source (report name, publisher, year)"
          required
          rows={3}
          defaultValue={setting?.source ?? ""}
        />
        <button type="submit" className="adm-btn-primary w-full">
          Save
        </button>
      </form>
    </div>
  );
}
