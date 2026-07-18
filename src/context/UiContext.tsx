"use client";
/* ============================================================
   UiContext — toast global y modal de confirmación
============================================================ */
import { createContext, useCallback, useContext, useRef, useState } from "react";
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

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast */}
      <div className={`${toastStyles.toast} ${toastState.show ? toastStyles.show : ""}`} role="status">
        <span className={toastStyles.dot} style={{ background: DOT_COLOR[toastState.type] }} />
        <span>{toastState.message}</span>
      </div>

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
