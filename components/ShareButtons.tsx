"use client";

// Real share intents for a specific event — not decorative. Each opens the
// platform's own share dialog pre-filled with this event's URL/title, or
// (for email) a mailto: with a pre-filled subject/body.
export default function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9z" />
      ),
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <path d="M18.9 3H21l-6.6 7.5L22 21h-6.5l-5-6.6L4.6 21H2.5l7-8L1.7 3H8.4l4.5 6zm-1.1 16h1.2L7.3 5H6z" />,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <path d="M14 8.5h2.5V5H14c-2.2 0-4 1.8-4 4v2H8v3.5h2V21h3.5v-6.5h2.4l.6-3.5h-3V9c0-.28.22-.5.5-.5z" />,
    },
    {
      label: "Share by email",
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Thought you'd want to see this: ${title}\n${url}`)}`,
      icon: <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2 7.1 5.3a1 1 0 0 0 1.2 0L20 7H4.4zM21 8.4l-6.9 5.2a3 3 0 0 1-3.6 0L4 8.4V17h17z" />,
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.label === "Share by email" ? undefined : "_blank"}
          rel={l.label === "Share by email" ? undefined : "noopener noreferrer"}
          aria-label={l.label}
          onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 rounded-full grid place-items-center bg-white/[0.06] text-muted hover:bg-gold/20 hover:text-gold transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            {l.icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
