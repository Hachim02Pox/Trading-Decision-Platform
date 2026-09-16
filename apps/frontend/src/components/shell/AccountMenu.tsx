"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./AccountMenu.module.css";

// Overnight session 2026-09-16: replaces the standalone "Paramètres" nav tab.
// Hachim asked for an account icon far from the tabs, opening a dropdown with
// identity + the same 2 settings (language, KPI directional coloring) inline.
// Decision taken solo (Hachim asleep, per OVERNIGHT_TASKLIST_2026-09-16.md):
// email-only identity (no first/last name — the signup form at /login never
// collects those fields and Supabase Auth doesn't store them by default;
// adding that would mean a schema + signup-form change, out of scope tonight
// and explicitly flagged as secondary/optional in the request).
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { directionalColoring, setDirectionalColoring, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account.menuLabel")}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 19.5c1.6-3.4 4.4-5.2 7.5-5.2s5.9 1.8 7.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.identity}>
            <span className={styles.email}>{email ?? t("account.emailUnknown")}</span>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t("settings.languageLabel")}</span>
            <div className={styles.segmented} role="group" aria-label={t("settings.languageLabel")}>
              <button
                type="button"
                className={`${styles.segment} ${language === "EN" ? styles.segmentActive : ""}`}
                aria-pressed={language === "EN"}
                onClick={() => setLanguage("EN")}
              >
                {t("settings.languageEnglish")}
              </button>
              <button
                type="button"
                className={`${styles.segment} ${language === "FR" ? styles.segmentActive : ""}`}
                aria-pressed={language === "FR"}
                onClick={() => setLanguage("FR")}
              >
                {t("settings.languageFrench")}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t("settings.directionalColoringLabel")}</span>
            <div className={styles.segmented} role="group" aria-label={t("settings.directionalColoringLabel")}>
              <button
                type="button"
                className={`${styles.segment} ${!directionalColoring ? styles.segmentActive : ""}`}
                aria-pressed={!directionalColoring}
                onClick={() => setDirectionalColoring(false)}
              >
                {t("settings.off")}
              </button>
              <button
                type="button"
                className={`${styles.segment} ${directionalColoring ? styles.segmentActive : ""}`}
                aria-pressed={directionalColoring}
                onClick={() => setDirectionalColoring(true)}
              >
                {t("settings.on")}
              </button>
            </div>
          </div>

          <button type="button" className={styles.signOut} onClick={handleSignOut}>
            {t("account.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
