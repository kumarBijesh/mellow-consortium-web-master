export default function ComingSoon({
  eyebrow,
  title,
  description,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <div>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-8">{eyebrow}</h1>

      <div className="adm-card p-10 text-center max-w-[560px] mx-auto">
        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-gold mb-3">
          Coming soon
        </span>
        <h2 className="text-[19px] font-display font-bold text-ink dark:text-white mb-2.5">{title}</h2>
        <p className="text-[14px] text-muted dark:text-white/45 leading-relaxed">{description}</p>
        {note && <p className="text-[12.5px] text-muted dark:text-white/30 mt-5 pt-5 border-t border-line dark:border-white/[0.08]">{note}</p>}
      </div>
    </div>
  );
}
