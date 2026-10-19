import { notFound } from "next/navigation";
import { PERSONAS, personaByType } from "@/lib/personas";
import ApplicationForm from "@/components/ApplicationForm";
import InvestigatorRegistrationForm from "@/components/InvestigatorRegistrationForm";

// "clinical_investigator" isn't a generic Persona anymore — it's kept as
// a static param so /apply/clinical_investigator keeps working as an
// entry point, but it renders the dedicated Investigator Registration
// form (see supabase/investigator-registrations.sql) instead of the
// generic ApplicationForm + applications-table pipeline every other
// persona uses.
const INVESTIGATOR_TYPE = "clinical_investigator";

export function generateStaticParams() {
  return [...PERSONAS.map((p) => ({ type: p.type })), { type: INVESTIGATOR_TYPE }];
}

export default function ApplyPage({ params }: { params: { type: string } }) {
  if (params.type === INVESTIGATOR_TYPE) {
    return (
      <main className="py-24">
        <div className="wrap max-w-[720px]">
          <span className="eyebrow">Investigator Registration</span>
          <h1 className="text-[32px] mt-4 mb-2 text-navy dark:text-white">Register as an Investigator</h1>
          <p className="text-muted dark:text-white/60 text-[15px] mb-10">
            Join the MELLOW Consortium&apos;s global investigator network. Submit your profile below — our team
            reviews every registration before it goes live.
          </p>
          <InvestigatorRegistrationForm />
        </div>
      </main>
    );
  }

  const persona = personaByType(params.type);
  if (!persona) notFound();

  return (
    <main className="py-24">
      <div className="wrap max-w-[640px]">
        <span className="eyebrow">Application</span>
        <h1 className="text-[32px] mt-4 mb-2 text-navy dark:text-white">{persona.label}</h1>
        <p className="text-muted dark:text-white/60 text-[15px] mb-10">{persona.description}</p>
        <ApplicationForm personaType={persona.type} />
      </div>
    </main>
  );
}
