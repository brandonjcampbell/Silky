import React, { useEffect } from "react";
import "./Modal.css";

/** A plain dialog on Silky's tokens. Closes on Escape or backdrop click. */
const Modal = ({ title, onClose, children, footer, wide = false }) => {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className={"modal" + (wide ? " modal--wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <h3>{title}</h3>
          <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
