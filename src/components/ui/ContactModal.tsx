import React, { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./ContactModal.css";

const CONTACT_EMAIL = "chipwebgames@gmail.com";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ open, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="contact-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="contact-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="contact-modal-header">
          <h2 id="contact-modal-title" className="contact-modal-title">
            {t("contactModal.title")}
          </h2>
          <button
            type="button"
            className="contact-modal-close"
            onClick={onClose}
            aria-label={t("contactModal.close")}
          >
            ×
          </button>
        </div>
        <div className="contact-modal-body">
          <section className="contact-modal-section">
            <h3 className="contact-modal-section-title">
              {t("contactModal.section1Title")}
            </h3>
            <p className="contact-modal-section-content">
              {t("contactModal.section1Content")}
            </p>
          </section>
          <section className="contact-modal-section">
            <h3 className="contact-modal-section-title">
              {t("contactModal.section2Title")}
            </h3>
            <p className="contact-modal-section-content">
              {t("contactModal.section2Content")}
            </p>
          </section>
          <section className="contact-modal-section">
            <h3 className="contact-modal-section-title">
              {t("contactModal.section3Title")}
            </h3>
            <p className="contact-modal-section-content">
              {t("contactModal.section3Content")}
            </p>
          </section>
          <section className="contact-modal-section">
            <h3 className="contact-modal-section-title">
              {t("contactModal.section4Title")}
            </h3>
            <p className="contact-modal-section-content">
              {t("contactModal.section4Content")}
            </p>
          </section>
          <div className="contact-modal-email-block">
            <p className="contact-modal-email-instruction">
              {t("contactModal.emailInstruction")}
            </p>
            <p className="contact-modal-email-item">
              <span className="contact-modal-email-label">
                {t("contactModal.emailLabel")}{" "}
              </span>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="contact-modal-email-link"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
