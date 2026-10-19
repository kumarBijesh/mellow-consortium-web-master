import ComingSoon from "@/components/admin/ComingSoon";

export default function AuditLogPage() {
  return (
    <ComingSoon
      eyebrow="Audit Log"
      title="No action logging yet"
      description="Admin and hospital actions (creating a hospital, inviting a provider, updating an application) aren't recorded anywhere yet. This tab has nothing real to show until that exists."
      note={'Planned shape once built: entries like "[Admin] created hospital MusB Research", timestamped and attributable to the account that took the action.'}
    />
  );
}
