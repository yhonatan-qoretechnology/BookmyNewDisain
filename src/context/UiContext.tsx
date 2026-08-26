"use client";
/* ============================================================
   UiContext — toast global y modal de confirmación
============================================================ */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SPRING, EASE_OUT } from "@/components/animations";
import Modal, { ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import toastStyles from "@/components/ui/Toast.module.css";
import { useI18n } from "@/i18n";

type ToastType = "default" | "success" | "error";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
}

interface UiContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => void;
}

const UiContext = createContext<UiContextValue>({
  toast: () => {},
  confirm: () => {},
});

const DOT_COLOR: Record<ToastType, string> = {
  default: "var(--teal-400)",
  success: "var(--green)",
  error: "var(--red)",
};

export function UiProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [toastState, setToastState] = useState<{ message: string; type: ToastType; show: boolean }>({
    message: "", type: "default", show: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((message: string, type: ToastType = "default") => {
    setToastState({ message, type, show: true });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setToastState((s) => ({ ...s, show: false }));
    }, 2800);
  }, []);

  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const closeConfirm = () => setConfirmState(null);
  const reduce = useReducedMotion();

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast — entra con muelle y sale desvaneciéndose. Antes vivía
          siempre en el DOM alternando una clase, así que al ocultarse
          cortaba en seco. */}
      <AnimatePresence>
        {toastState.show && (
          <motion.div
            className={toastStyles.toast}
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={reduce ? EASE_OUT : SPRING}
          >
            <span className={toastStyles.dot} style={{ background: DOT_COLOR[toastState.type] }} />
            <span>{toastState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <Modal open={!!confirmState} onClose={closeConfirm}>
        {confirmState && (
          <>
            <ModalTitle>{confirmState.title}</ModalTitle>
            <ModalText>{confirmState.message}</ModalText>
            <ModalActions>
              <Button variant="ghost" block onClick={closeConfirm}>{t("common.cancel")}</Button>
              <Button variant="danger" block onClick={() => { confirmState.onConfirm?.(); closeConfirm(); }}>
                {confirmState.confirmLabel || t("common.delete")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>
    </UiContext.Provider>
  );
}

export const useUi = () => useContext(UiContext);
