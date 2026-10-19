"use client";

import { useState } from "react";
import { resendMellowMemberInvite, type InviteDelivery } from "@/lib/actions/mellow-members";
import InviteDeliveryNotice from "@/components/admin/InviteDeliveryNotice";

export default function ResendMellowMemberInvite({ providerId, email }: { providerId: string; email: string }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<InviteDelivery | null>(null);

  if (delivery) return <InviteDeliveryNotice delivery={delivery} email={email} />;

  return (
    <div>
      <button
        type="button"
        disabled={sending}
        className="text-[12.5px] font-semibold text-teal hover:text-ink dark:hover:text-white transition disabled:opacity-50"
        onClick={async () => {
          setSending(true);
          setError(null);
          let result: Awaited<ReturnType<typeof resendMellowMemberInvite>> | undefined;
          try {
            result = await resendMellowMemberInvite(providerId);
          } catch (err) {
            console.error("[ResendMellowMemberInvite] resend threw:", err);
          }
          setSending(false);
          // undefined = middleware redirected the call to /admin/login.
          if (!result) setError("Your admin session has expired or changed. Sign in again, then retry.");
          else if (result.error) setError(result.error);
          else if (result.delivery) setDelivery(result.delivery);
        }}
      >
        {sending ? "Sending…" : "Resend invite"}
      </button>
      {error && <p className="text-[12px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
