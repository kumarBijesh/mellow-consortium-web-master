import { getAdminStats, PRICING } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const stats = await getAdminStats();

  const rows = [
    { label: "Provider licences", count: stats.providers, unitPrice: PRICING.provider },
    { label: "Hospital SaaS", count: stats.hospitals, unitPrice: PRICING.hospital },
    { label: "Patient accounts", count: stats.patients, unitPrice: PRICING.patient },
  ].map((r) => ({ ...r, mrr: r.count * r.unitPrice }));

  const total = rows.reduce((sum, r) => sum + r.mrr, 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">Revenue &amp; billing</h1>
          <p className="text-[13.5px] text-muted dark:text-white/40 mt-1">Projected recurring revenue based on active accounts.</p>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full bg-gold/15 text-[#8a6d1f] dark:text-gold whitespace-nowrap">
          Payment system not connected
        </span>
      </div>

      <div className="adm-card p-5 mb-8 bg-gold/10 dark:bg-gold/[0.06] border-gold/25">
        <p className="text-[14px] text-ink dark:text-white">
          <b>No payment integration active.</b> The figures below are <b>projections only</b>, based on current account
          counts × a placeholder pricing model. Connect Stripe or another payment provider to track real revenue.
        </p>
        <a href="/coming-soon?from=payments" className="adm-btn-primary inline-flex mt-4">
          Connect payment provider
        </a>
      </div>

      <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/35 mb-3">Projected monthly recurring revenue</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projected MRR" value={`$${total.toLocaleString()}`} accent="text-teal" />
        <StatCard label="Provider accounts" value={stats.providers} />
        <StatCard label="Patient accounts" value={stats.patients} />
        <StatCard label="Hospital accounts" value={stats.hospitals} />
      </div>

      <div className="adm-card overflow-hidden overflow-x-auto mb-8">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
              <th className="px-5 py-3.5 font-semibold">Revenue stream</th>
              <th className="px-5 py-3.5 font-semibold">Count</th>
              <th className="px-5 py-3.5 font-semibold">Unit price</th>
              <th className="px-5 py-3.5 font-semibold">Projected MRR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line dark:border-white/[0.06] last:border-0">
                <td className="px-5 py-3.5 text-ink dark:text-white font-medium">{r.label}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{r.count}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">${r.unitPrice}/mo</td>
                <td className="px-5 py-3.5 text-ink dark:text-white font-semibold">${r.mrr.toLocaleString()}</td>
              </tr>
            ))}
            <tr>
              <td className="px-5 py-3.5 text-ink dark:text-white font-bold" colSpan={3}>
                Total projected MRR
              </td>
              <td className="px-5 py-3.5 text-teal font-bold">${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/35 mb-3">Revenue breakdown</p>
      <div className="h-3 rounded-full overflow-hidden flex bg-line dark:bg-white/10">
        {rows.map((r, i) => (
          <span
            key={r.label}
            className={i === 0 ? "bg-blue h-full" : i === 1 ? "bg-teal h-full" : "bg-gold h-full"}
            style={{ width: total > 0 ? `${(r.mrr / total) * 100}%` : 0 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-5 mt-3">
        {rows.map((r, i) => (
          <span key={r.label} className="flex items-center gap-2 text-[12.5px] text-muted dark:text-white/50">
            <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-blue" : i === 1 ? "bg-teal" : "bg-gold"}`} />
            {r.label}: ${r.mrr.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-ink dark:text-white" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="adm-card p-5">
      <p className="text-[12px] text-muted dark:text-white/40 mb-2">{label}</p>
      <p className={`text-[22px] font-display font-bold ${accent}`}>{value}</p>
    </div>
  );
}
