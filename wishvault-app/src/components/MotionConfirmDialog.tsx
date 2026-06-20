import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { Button } from "@/components/ui/button";

type MotionConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
};

export function MotionConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep editing",
  onConfirm,
  onClose,
  children
}: MotionConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-moss/35 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="motion-confirm-title"
            aria-describedby="motion-confirm-description"
            className="relative grid w-full max-w-lg gap-5 rounded-lg border border-vine/25 bg-paper p-5 text-moss shadow-plate"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-moss/65 transition-colors hover:bg-glasshouse hover:text-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
            <div className="grid gap-2 pr-10">
              <h2 id="motion-confirm-title" className="font-display text-2xl font-medium leading-tight">
                {title}
              </h2>
              <p id="motion-confirm-description" className="text-sm leading-6 text-moss/72">
                {description}
              </p>
            </div>
            {children ? <div className="rounded-lg border border-moss/15 bg-glasshouse p-4">{children}</div> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="quiet" onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button type="button" variant="vine" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
