import { type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onClose: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

function Modal({
  open,
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onClose,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-actions">
          {secondaryActionLabel && onSecondaryAction ? (
            <button type="button" className="button button-secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          ) : null}
          {primaryActionLabel && onPrimaryAction ? (
            <button type="button" className="button button-primary" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Modal;
