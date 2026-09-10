"use client";

import { useState, type FormEvent } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { describeLinkError, translateAuthError } from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/safeRedirect";
import { GyroscopeMark } from "@/components/brand/GyroscopeMark";
import styles from "./page.module.css";

type Mode = "signin" | "signup" | "forgot";
type Feedback = { kind: "error" | "success"; text: string } | null;

function LoginForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(linkError ? { kind: "error", text: describeLinkError(linkError) } : null);

  // Security best practice: never carry a typed password across a mode
  // switch — clearing it here means a stale value can't linger in the DOM
  // (or in React state) once the user leaves the sign-in/sign-up context.
  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setShowPassword(false);
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setBusy(false);
      if (error) {
        setFeedback({ kind: "error", text: translateAuthError(error.message) });
        return;
      }
      setFeedback({ kind: "success", text: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé." });
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setBusy(false);
      setPassword("");
      if (error) {
        setFeedback({ kind: "error", text: translateAuthError(error.message) });
        return;
      }
      // Supabase deliberately never reveals here whether this email was
      // brand new or already had an (unconfirmed) account — signUp() just
      // silently resends the confirmation email in the latter case (and
      // stays silent again if that resend hits the rate limit). An
      // unconditional "check your inbox" would be a lie in both of those
      // silent cases, so the copy has to stay honest about the uncertainty.
      setFeedback({
        kind: "success",
        text: "Si cette adresse est valide, un email de confirmation vient d'être envoyé (ou renvoyé). Vérifiez vos spams. Rien après quelques minutes ? La limite anti-spam de Supabase a peut-être été atteinte — réessayez plus tard.",
      });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setFeedback({ kind: "error", text: translateAuthError(error.message) });
      return;
    }
    window.location.href = getSafeNextPath(searchParams.get("next"));
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.brand}>
          <GyroscopeMark size={56} />
          <span className={styles.wordmark}>Zenith Terminal</span>
          <h1 className={styles.title}>
            Accès <span>Holder</span>
          </h1>
          <div className={styles.statusLine}>
            <span className={styles.statusDot} aria-hidden="true" />
            SYSTÈME PRÊT — EN ATTENTE D&apos;IDENTIFIANTS
          </div>
        </div>

        <div className={styles.card}>
          {mode !== "forgot" && (
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                className={`${styles.tab} ${mode === "signin" ? styles.tabActive : ""}`}
                onClick={() => switchMode("signin")}
              >
                Connexion
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={`${styles.tab} ${mode === "signup" ? styles.tabActive : ""}`}
                onClick={() => switchMode("signup")}
              >
                Créer un compte
              </button>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} key={mode} autoComplete={mode === "forgot" ? "off" : "on"}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {mode !== "forgot" && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Mot de passe
                </label>
                <div className={styles.passwordRow}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    className={styles.input}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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
            )}

            {mode === "signin" && (
              <button type="button" className={styles.forgotLink} onClick={() => switchMode("forgot")}>
                Mot de passe oublié ?
              </button>
            )}

            {feedback && (
              <div className={`${styles.message} ${feedback.kind === "error" ? styles.messageError : styles.messageSuccess}`} role="status">
                {feedback.text}
              </div>
            )}

            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? "…" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Se connecter"}
            </button>

            {mode === "forgot" && (
              <button type="button" className={styles.forgotLink} onClick={() => switchMode("signin")}>
                Retour à la connexion
              </button>
            )}
          </form>
        </div>

        <p className={styles.footnote}>Authentification sécurisée par Supabase — vos identifiants ne transitent jamais par nos serveurs en clair.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
