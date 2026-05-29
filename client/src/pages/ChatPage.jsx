import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useChat } from "../hooks/useChat";
import { useSocket } from "../providers/SocketProvider";
import MotionCard from "../components/motion/MotionCard";
import Reveal from "../components/motion/Reveal";
import { StaggerReveal } from "../components/motion/StaggerReveal";
import MagneticButton from "../components/motion/MagneticButton";

function GlassCard({ children, className = "" }) {
  return <MotionCard className={className}>{children}</MotionCard>;
}

function participantName(conversation, currentUserId) {
  const other = conversation?.participants?.find((p) => String(p._id || p) !== String(currentUserId));
  return other?.name || other?.email || "Conversation";
}

export default function ChatPage() {
  const { user } = useAuth();
  const { status } = useSocket();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState("");
  const {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    isLoading,
    error,
    openConversation,
    sendMessage,
    markSeen,
    startTyping,
    stopTyping,
  } = useChat();

  const userId = user?.id || user?._id;
  const recipientId = params.get("recipientId");

  useEffect(() => {
    if (recipientId) openConversation(recipientId).catch(() => {});
  }, [openConversation, recipientId]);

  useEffect(() => {
    if (activeConversation?._id) markSeen(activeConversation._id);
  }, [activeConversation?._id, markSeen, messages.length]);

  const activeRecipientId = useMemo(() => {
    const other = activeConversation?.participants?.find((p) => String(p._id || p) !== String(userId));
    return other?._id || other;
  }, [activeConversation, userId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!activeRecipientId || !draft.trim()) return;
    const body = draft;
    setDraft("");
    stopTyping();
    await sendMessage({ body, recipientId: activeRecipientId }).catch(() => setDraft(body));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm uppercase text-cyan-100">{status === "connected" ? "Realtime connected" : "Realtime reconnecting"}</p>
          <h1 className="text-5xl font-black">Chat</h1>
          <p className="mt-3 text-muted">One-to-one conversations with persistent messages, typing, seen, and reconnect recovery.</p>
        </div>
      </Reveal>

      {error && <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}

      <Reveal className="mt-8 grid gap-4 lg:grid-cols-[.8fr_1.4fr]">
        <GlassCard className="min-h-[520px]">
          <p className="text-sm uppercase text-cyan-100">Conversations</p>
          <StaggerReveal className="mt-5 grid gap-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div className="h-16 animate-pulse rounded-2xl bg-white/10" key={i} />)
            ) : conversations.length === 0 ? (
              <p className="rounded-2xl bg-black/30 p-4 text-sm text-muted">No conversations yet. Use Message owner from a listing.</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  className={`rounded-2xl border border-white/10 p-4 text-left transition hover:bg-white/[0.08] ${
                    activeConversation?._id === conversation._id ? "bg-white/[0.1]" : "bg-black/30"
                  }`}
                  key={conversation._id}
                  onClick={() => openConversation(null, conversation)}
                  type="button"
                >
                  <p className="font-semibold text-white">{participantName(conversation, userId)}</p>
                  <p className="mt-1 truncate text-sm text-muted">{conversation.lastMessage?.body || "Start the conversation"}</p>
                </button>
              ))
            )}
          </StaggerReveal>
        </GlassCard>

        <GlassCard className="flex min-h-[520px] flex-col">
          {activeConversation ? (
            <>
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm uppercase text-cyan-100">Active chat</p>
                <h2 className="mt-1 text-2xl font-black">{participantName(activeConversation, userId)}</h2>
              </div>

              <div className="flex-1 overflow-y-auto py-5">
                <div className="grid gap-3">
                  {messages.map((message) => {
                    const mine = String(message.sender?._id || message.sender) === String(userId);
                    return (
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-white text-black" : "bg-black/40 text-white"}`} key={message._id || message.clientMessageId}>
                        <p className="text-sm">{message.body}</p>
                        <p className={`mt-2 text-[11px] ${mine ? "text-black/50" : "text-white/40"}`}>
                          {message.status === "sending" ? "Sending" : message.status === "failed" ? "Failed" : new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {mine && message.status === "seen" ? " · Seen" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {typingUsers[activeConversation._id] && <p className="mb-2 text-sm text-cyan-100">Typing...</p>}

              <form className="flex gap-3 border-t border-white/10 pt-4" onSubmit={submit}>
                <input
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-white outline-none transition focus:border-cyan-300"
                  onBlur={stopTyping}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    startTyping();
                  }}
                  placeholder="Write a message"
                  value={draft}
                />
                <MagneticButton className="rounded-full bg-white px-6 py-3 font-bold text-black disabled:opacity-50" disabled={!draft.trim()} type="submit">
                  Send
                </MagneticButton>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-center">
              <div>
                <p className="text-sm uppercase text-cyan-100">No chat selected</p>
                <h2 className="mt-2 text-2xl font-black">Choose a conversation</h2>
                <p className="mt-3 text-muted">Messages sync over Socket.IO and recover from the API after reconnect.</p>
              </div>
            </div>
          )}
        </GlassCard>
      </Reveal>
    </main>
  );
}
