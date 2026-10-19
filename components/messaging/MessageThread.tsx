"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage, markThreadRead } from "@/lib/actions/connections";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export default function MessageThread({
  connectionId,
  currentUserId,
  messages: initialMessages,
}: {
  connectionId: string;
  currentUserId: string;
  messages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Opening a thread (or receiving a new message while it's open) marks
  // anything from the other participant as read.
  useEffect(() => {
    markThreadRead(connectionId);
  }, [connectionId, messages.length]);

  // Live delivery for the other participant's messages. Requires
  // `messages` to be added to the supabase_realtime publication
  // (messages-unread-and-realtime.sql) — if that hasn't run, this
  // subscription simply never fires and the thread still works exactly
  // as before (send + see replies next time you open it).
  //
  // postgres_changes enforces RLS using the realtime socket's current
  // auth token, which is only attached once the client's session has
  // resolved. Subscribing before that resolves doesn't error — it just
  // evaluates every row as unauthenticated, so nothing participant-scoped
  // ever matches and the thread silently never receives anything.
  // Explicitly awaiting the session first avoids that race.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`messages-${connectionId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${connectionId}` },
          (payload) => {
            const incoming = payload.new as Message;
            setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [connectionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(connectionId, trimmed);
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    if (result.message) {
      const sent = result.message;
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    }
  }

  return (
    <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
      <div className="space-y-3 max-h-[360px] overflow-y-auto mb-4">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-[12px] px-4 py-2.5 text-[13.5px] ${
                  mine ? "bg-blue text-white" : "bg-lightblue dark:bg-teal/[0.08] text-navy dark:text-white"
                }`}
              >
                <p>{m.body}</p>
                <p className={`text-[10.5px] mt-1 ${mine ? "text-white/70" : "text-muted dark:text-white/60"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-muted dark:text-white/60 text-[13.5px] text-center py-6">No messages yet.</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <input
          id="message"
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      {error && <p className="text-[12.5px] text-red-600 mt-2">{error}</p>}
    </div>
  );
}
