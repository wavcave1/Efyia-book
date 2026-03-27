import React from "react";
import { createPortal } from "react-dom";

export default function PopupModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={styles.closeBtn}
          aria-label="Close popup"
        >
          ×
        </button>

        <iframe
          src="/promos/wav-cave-midweek-flyer.html"
          title="Wav Cave Midweek Flyer"
          style={styles.iframe}
        />
      </div>
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.78)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2147483647,
    padding: "20px",
  },
  modal: {
    position: "relative",
    width: "min(1000px, 95vw)",
    height: "min(900px, 90vh)",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 80px rgba(0,0,0,0.45)",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
    background: "#fff",
  },
  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    zIndex: 2,
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "none",
    background: "rgba(0,0,0,0.8)",
    color: "#fff",
    fontSize: "24px",
    lineHeight: 1,
    cursor: "pointer",
  },
};
