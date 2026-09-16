"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/errors";
import { GyroscopeMark } from "@/components/brand/GyroscopeMark";
import styles from "../login/page.module.css";

type Feedback = { kind: "error" | "success"; text: string } | null;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setFeedback({ kind: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    setBusy(true);
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setPassword("");
    setConfirmPassword("");

    if (error) {
      setFeedback({ kind: "error", text: translateAuthError(error.message) });
      return;
    }
    setDone(true);
    setFeedback({ kind: "success", text: "Mot de passe mis à jour. Redirection…" });
    setTimeout(() => {
      window.location.href = "/market";
    }, 1500);
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.brand}>
          <GyroscopeMark size={56} />
          <span className={styles.wordmark}>HT Terminal</span>
          <h1 className={styles.title}>
            Nouveau <span>mot de passe</span>
          </h1>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">
                Nouveau mot de passe
              </label>
              <div className={styles.passwordRow}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={styles.input}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={done}
                />
                <button
                  type="button"
                  className={styles.toggleVisibility}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className={styles.input}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={done}
              />
            </div>

            {feedback && (
              <div className={`${styles.message} ${feedback.kind === "error" ? styles.messageError : styles.messageSuccess}`} role="status">
                {feedback.text}
              </div>
            )}

            <button type="submit" className={styles.submit} disabled={busy || done}>
              {busy ? "…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
