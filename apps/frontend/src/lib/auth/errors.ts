/**
 * Maps a raw Supabase AuthError.message to a French, actionable string.
 * Supabase's messages are stable English strings, not error codes, so this
 * matches on (a substring of) the exact text. Canonical catalog:
 * https://supabase.com/docs/guides/auth/debugging/error-codes
 *
 * Shared by /login and /reset-password — see docs/AUTH_SUPABASE.md.
 */
export function translateAuthError(message: string): string {
  if (/rate limit/i.test(message)) {
    return "Trop de tentatives d'envoi d'email en peu de temps (limite anti-spam de Supabase). Réessayez dans quelques minutes.";
  }
  if (/already registered/i.test(message)) {
    return "Un compte confirmé existe déjà avec cet email. Connectez-vous, ou utilisez « Mot de passe oublié » si besoin.";
  }
  if (/password/i.test(message) && /(least|character|weak|strong|different)/i.test(message)) {
    // Covers "Password should be at least 6 characters", "Password should
    // contain at least one character of ...", "New password should be
    // different from the old password.", and similar strength-rule variants
    // Supabase's message text can vary by project config.
    if (/different from the old/i.test(message)) {
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    }
    return "Le mot de passe ne respecte pas les exigences minimales (8 caractères minimum).";
  }
  if (/invalid.*email|unable to validate email/i.test(message)) {
    return "Adresse email invalide.";
  }
  if (/expired|invalid.*(token|link|otp)/i.test(message)) {
    return "Ce lien n'est plus valide (expiré ou déjà utilisé). Redemandez-en un nouveau.";
  }
  const known: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "Email not confirmed": "Confirmez votre email avant de vous connecter (vérifiez votre boîte mail, y compris les spams).",
    "User not found": "Aucun compte ne correspond à cette adresse.",
    "For security purposes, you can only request this after 60 seconds.": "Pour des raisons de sécurité, patientez 60 secondes avant de redemander un email.",
    "Signup requires a valid password": "Un mot de passe est requis pour créer un compte.",
    "Auth session missing!": "Votre session a expiré ou ce lien n'est plus valide. Recommencez depuis le début.",
  };
  return known[message] ?? message;
}

/** Maps the `error`/`error_code` query param Supabase attaches when redirecting back an invalid/expired auth link (see middleware.ts) to a French, actionable string. */
export function describeLinkError(code: string): string {
  const known: Record<string, string> = {
    otp_expired: "Ce lien a expiré. Redemandez un email de confirmation ou de réinitialisation.",
    access_denied: "Ce lien n'est plus valide (déjà utilisé ou expiré). Redemandez-en un nouveau.",
    reset_failed: "Le lien de réinitialisation a expiré ou est invalide. Demandez-en un nouveau.",
    confirmation_failed: "Le lien de confirmation a expiré ou est invalide. Réessayez de vous inscrire, ou reconnectez-vous si votre compte est déjà confirmé.",
    invalid_request: "Ce lien est incomplet ou mal formé. Redemandez-en un nouveau.",
    link_invalid: "Ce lien n'est plus valide. Réessayez depuis le début.",
  };
  return known[code] ?? "Ce lien n'est plus valide. Réessayez depuis le début.";
}
