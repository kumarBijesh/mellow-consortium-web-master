"use client";

import { useState } from "react";
import type { InviteDelivery } from "@/lib/actions/mellow-members";

// Shown after creating a Mellow Member or re-sending their invite. When
// the email didn't go out, the account still exists; this hands the admin
// the invite link to send themselves.
export default function InviteDeliveryNotice({ delivery, email }: { delivery: InviteDelivery; email: string }) {
  const [copied, setCopied] = useState(false);

  if (delivery.emailSent) {
    return <p className="text-[13.5px] text-teal">Invite email sent to {email}.</p>;
  }

  return (
    <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-[13.5px]">
      <p className="font-semibold text-ink dark:text-white">The account was saved, but the invite email didn&apos;t send.</p>
      <p className="text-muted dark:text-white/60 mt-1">{delivery.emailError}</p>
      {delivery.inviteLink ? (
        <>
          <p className="text-muted dark:text-white/60 mt-3">
            Send them this one-time link yourself. It lets them set a password and sign in:
          </p>
          <div className="flex gap-2 mt-2">
            <input readOnly value={delivery.inviteLink} className="adm-input font-mono text-[12px]" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="adm-btn-ghost whitespace-nowrap"
              onClick={async () => {
                await navigator.clipboard.writeText(delivery.inviteLink!);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-muted dark:text-white/60 mt-3">Couldn&apos;t generate a manual link either. Use Resend invite on the Mellow Members list to retry.</p>
      )}
    </div>
  );
}
