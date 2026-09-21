"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";

type MessageModalProps = {
  message: string;
  type: "error" | "success";
  title?: string;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
};

export default function MessageModal({ message, type, title, onClose, onAction, actionLabel }: MessageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (message && !dialog.open) dialog.showModal();
    if (!message && dialog.open) dialog.close();
  }, [message]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className={`modal-card message-modal ${type}`}
      role={type === "error" ? "alertdialog" : "dialog"}
      aria-labelledby="message-modal-title"
      aria-describedby="message-modal-description"
      onClose={onClose}
    >
      <button className="modal-close" type="button" aria-label="Cerrar mensaje" onClick={close}>
        <X aria-hidden="true" />
      </button>
      <div className="message-modal-icon" aria-hidden="true">
        {type === "error" ? <CircleAlert /> : <CircleCheck />}
      </div>
      <h2 id="message-modal-title">{title || (type === "error" ? "Atención" : "Operación exitosa")}</h2>
      <p id="message-modal-description">{message}</p>
      <div className="modal-actions">
        {onAction && actionLabel && (
          <button className="secondary-button compact" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button className="primary-button compact" type="button" autoFocus onClick={close}>
          Entendido
        </button>
      </div>
    </dialog>
  );
}
