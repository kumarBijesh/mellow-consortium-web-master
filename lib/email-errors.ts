type EmailError = { message?: string; status?: number } | null | undefined;

// A transient failure on our email service's side (rate limit hit, SMTP
// misconfigured/down) — as opposed to something about the specific
// request (bad address, already registered, etc.). Shared so any flow
// that deliberately gives a generic response regardless of outcome (see
// the forgot-password page) can still distinguish "this is a service
// problem worth mentioning" from "stay quiet as designed."
export function isTransientEmailServiceError(error: EmailError): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  // Request-specific errors first: "A user with this email address has
  // already been registered" comes back as a 422 and contains "mail"
  // inside "email", which the bare substring check below used to
  // misreport as a mail delivery outage.
  if (isAlreadyRegisteredError(error)) return false;
  return (
    message.includes("rate limit") ||
    message.includes("smtp") ||
    /\bmail\b|error sending/.test(message) ||
    error?.status === 429 ||
    error?.status === 500 ||
    error?.status === 503
  );
}

// Turns a raw Supabase Auth email-send error (invite, password reset)
// into a clear, actionable message — never surface the provider's raw
// string ("email rate limit exceeded", SMTP codes, etc.) straight to an
// end user. The caller still gets to retry by just resubmitting the same
// form; there's no separate "retry" UI needed beyond a clear message
// telling them it's safe to.
export function describeEmailSendError(error: EmailError): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (isAlreadyRegisteredError(error)) {
    return "This email already has a login on the platform (patient, admin, hospital, or provider). Use a different email address.";
  }

  if (message.includes("not authorized")) {
    // Supabase's built-in email sender only delivers to the project's own
    // team members until custom SMTP is configured.
    return "Our email service isn't set up to send to this address yet (custom SMTP not configured in Supabase Auth).";
  }

  if (isTransientEmailServiceError(error)) {
    return message.includes("rate limit")
      ? "We couldn't send the email right now. Our email service has temporarily hit its sending limit. Please try again in a few minutes."
      : "We couldn't send the email right now due to a mail delivery issue on our end. Please try again shortly, or contact support if this keeps happening.";
  }


  return "Could not send the invitation email. Please try again. If this keeps happening, contact support.";
}

export function isAlreadyRegisteredError(error: EmailError): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("already been registered") || message.includes("already registered");
}
