import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import { useSocket } from "../../providers/SocketProvider";
import MagneticButton from "../motion/MagneticButton";
import { modalPanel } from "../../motion/variants";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const { status } = useSocket();

  return (
    <div className="relative">
      <MagneticButton
        className="relative rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        onClick={() => setIsOpen((value) => !value)}
      >
        Alerts
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </MagneticButton>

      <AnimatePresence>
      {isOpen && (
        <motion.div className="absolute right-0 top-12 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-black/90 p-3 shadow-glass backdrop-blur-2xl" variants={modalPanel} initial="hidden" animate="visible" exit="exit">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Notifications</p>
              <p className="text-xs text-muted">{status === "connected" ? "Live" : "Syncing"}</p>
            </div>
            <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black" onClick={markAllRead} type="button">
              Read all
            </button>
          </div>

          <div className="grid max-h-96 gap-2 overflow-y-auto">
            {isLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            ) : notifications.length === 0 ? (
              <p className="rounded-2xl bg-white/[0.06] p-4 text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <motion.button
                  layout
                  className={`rounded-2xl border border-white/10 p-3 text-left transition hover:bg-white/[0.08] ${
                    notification.readAt ? "bg-white/[0.03]" : "bg-white/[0.08]"
                  }`}
                  key={notification._id}
                  onClick={() => !notification.readAt && markRead(notification._id)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-white">{notification.title}</p>
                  {notification.body && <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.body}</p>}
                  <p className="mt-2 text-[11px] text-white/40">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                  </p>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
