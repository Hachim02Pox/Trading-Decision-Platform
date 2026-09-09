import assert from "node:assert/strict";
import test from "node:test";
import { describeLinkError, translateAuthError } from "../apps/frontend/src/lib/auth/errors";

test("translateAuthError: recognizes rate limiting regardless of exact wording", () => {
  assert.match(translateAuthError("email rate limit exceeded"), /anti-spam/i);
  assert.match(translateAuthError("Email rate limit exceeded"), /anti-spam/i);
});

test("translateAuthError: existing confirmed account points to sign-in / forgot-password", () => {
  assert.match(translateAuthError("User already registered"), /connectez-vous/i);
});

test("translateAuthError: weak/short password and mismatched reset password are both actionable", () => {
  assert.match(translateAuthError("Password should be at least 6 characters"), /8 caractères/i);
  assert.match(translateAuthError("New password should be different from the old password."), /différent de l'ancien/i);
});

test("translateAuthError: invalid/expired token or link is recognized generically", () => {
  assert.match(translateAuthError("Token has expired or is invalid"), /n'est plus valide/i);
  assert.match(translateAuthError("Email link is invalid or has expired"), /n'est plus valide/i);
});

test("translateAuthError: known exact messages are translated, unknown messages pass through", () => {
  assert.equal(translateAuthError("Invalid login credentials"), "Email ou mot de passe incorrect.");
  assert.equal(translateAuthError("Email not confirmed"), "Confirmez votre email avant de vous connecter (vérifiez votre boîte mail, y compris les spams).");
  assert.equal(translateAuthError("Some brand new Supabase message we've never seen"), "Some brand new Supabase message we've never seen");
});

test("describeLinkError: every documented Supabase link-failure code has a French message, unknown codes fall back generically", () => {
  for (const code of ["otp_expired", "access_denied", "reset_failed", "confirmation_failed", "invalid_request"]) {
    assert.notEqual(describeLinkError(code), "Ce lien n'est plus valide. Réessayez depuis le début.", `${code} should have a specific message`);
  }
  assert.equal(describeLinkError("some_unknown_future_code"), "Ce lien n'est plus valide. Réessayez depuis le début.");
});
