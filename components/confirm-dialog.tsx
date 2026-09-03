type ConfirmDialogProps = {
  title: string;
  description?: string;
  onConfirm: () => void;
};

export function ConfirmDialog({ title, description, onConfirm }: ConfirmDialogProps) {
  return (
    <div role="dialog" aria-modal="true">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      <button type="button" onClick={onConfirm}>
        Confirmar
      </button>
    </div>
  );
}
