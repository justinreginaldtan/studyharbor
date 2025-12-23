import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  color?: string;
  lowPower?: boolean;
};

export function Toast({ message, visible, onDismiss, duration = 3000, color, lowPower }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
          initial={lowPower ? false : { opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={lowPower ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
          transition={lowPower ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 ${
            lowPower
              ? "bg-slate-900"
              : "bg-[rgba(15,23,42,0.95)] shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          }`}>
            {color && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <p className="text-sm text-slate-100/90">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
