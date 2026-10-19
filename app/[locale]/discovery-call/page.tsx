import DiscoveryCallForm from "@/components/DiscoveryCallForm";

export const metadata = { title: "Book a Discovery Call" };

export default function DiscoveryCallPage({ searchParams }: { searchParams: { tier?: string } }) {
  return (
    <main className="py-24">
      <div className="wrap max-w-[640px]">
        <span className="eyebrow">Partner with MELLOW</span>
        <h1 className="text-[32px] mt-4 mb-2 text-navy dark:text-white">Book a Discovery Call</h1>
        <p className="text-muted dark:text-white/60 text-[15px] mb-2">
          Interested in learning more about the MELLOW Consortium? Connect with our team to explore collaboration
          opportunities, clinical research programs, and ways to get involved.
        </p>
        <p className="text-muted dark:text-white/60 text-[15px] mb-4">
          Complete the form below, and our team will get back to you to schedule a brief discovery call.
        </p>
        {searchParams.tier && (
          <p className="inline-block mb-6 text-[12.5px] font-semibold text-teal dark:text-meadow bg-lightblue/50 dark:bg-teal/[0.08] rounded-full px-3 py-1.5">
            Interested in: {searchParams.tier} tier
          </p>
        )}
        <DiscoveryCallForm sourceTier={searchParams.tier ?? null} />
      </div>
    </main>
  );
}
