const DIVISION_NAMES: Record<string, string> = {
  age: "MELLOW-Age",
  jlive: "JLIVE",
  conferences: "MELLOW Conferences",
  institutions: "The institutions directory",
  investigators: "The investigators & KOLs directory",
  membership: "Mellow Member signup",
};

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const name = DIVISION_NAMES[searchParams.from ?? ""] ?? "This section";

  return (
    <main className="py-32">
      <div className="wrap max-w-[560px] text-center">
        <span className="eyebrow justify-center">Coming soon</span>
        <h1 className="text-[32px] mt-4 mb-4 text-navy dark:text-white">{name} is on its way</h1>
        <p className="text-muted dark:text-white/60 text-[15px] mb-8">
          We&apos;re still building this part of the ecosystem. In the meantime,
          explore active trials or apply to get involved.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/trials" className="btn-secondary">
            View trials
          </a>
          <a href="/apply/individual" className="btn-primary">
            Apply
          </a>
        </div>
      </div>
    </main>
  );
}
