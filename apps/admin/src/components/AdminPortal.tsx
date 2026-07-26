import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";
import {
  getCurrentSession,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  toAdminIdentity,
  verifyCurrentAdmin,
  type AdminIdentity,
} from "../lib/auth";
import { getAdminSupabaseClient } from "../lib/supabase";
import { AccessPage } from "./AccessPage";
import { AdminDashboard } from "./AdminDashboard";
import styles from "./AdminPortal.module.css";

type PortalState =
  | { kind: "checking" }
  | { kind: "configuration-error"; message: string }
  | { kind: "signed-out" }
  | { kind: "verifying"; identity: AdminIdentity }
  | { kind: "denied"; identity: AdminIdentity }
  | { kind: "ready"; identity: AdminIdentity }
  | { kind: "error"; message: string };

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function AdminPortal() {
  const [portal, setPortal] = useState<PortalState>({ kind: "checking" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState<"password" | "google" | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let verification = 0;

    const evaluateSession = async (session: Session | null) => {
      const currentVerification = ++verification;

      if (!session) {
        if (active) setPortal({ kind: "signed-out" });
        return;
      }

      const identity = toAdminIdentity(session.user);
      if (active) setPortal({ kind: "verifying", identity });

      try {
        const isAdmin = await verifyCurrentAdmin();
        if (!active || currentVerification !== verification) return;
        setPortal(
          isAdmin ? { kind: "ready", identity } : { kind: "denied", identity },
        );
      } catch (error) {
        if (!active || currentVerification !== verification) return;
        setPortal({
          kind: "error",
          message: `Admin access could not be verified. ${messageFrom(error)}`,
        });
      }
    };

    let unsubscribe = () => {};

    try {
      const client = getAdminSupabaseClient();
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        void evaluateSession(session);
      });
      unsubscribe = () => data.subscription.unsubscribe();

      void getCurrentSession()
        .then(evaluateSession)
        .catch((error) => {
          if (active) {
            setPortal({ kind: "error", message: messageFrom(error) });
          }
        });
    } catch (error) {
      queueMicrotask(() => {
        if (!active) return;
        setPortal({
          kind: "configuration-error",
          message: messageFrom(error),
        });
      });
    }

    return () => {
      active = false;
      verification += 1;
      unsubscribe();
    };
  }, []);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("password");
    setFormError(null);

    try {
      await signInWithPassword(email, password);
    } catch (error) {
      setFormError(messageFrom(error));
    } finally {
      setSubmitting(null);
    }
  };

  const submitGoogle = async () => {
    setSubmitting("google");
    setFormError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(messageFrom(error));
      setSubmitting(null);
    }
  };

  const exitSession = async () => {
    try {
      await signOut();
    } catch (error) {
      setPortal({ kind: "error", message: messageFrom(error) });
    }
  };

  if (portal.kind === "ready") {
    return (
      <AdminDashboard identity={portal.identity} onSignOut={exitSession} />
    );
  }

  if (portal.kind === "denied") {
    return (
      <AccessPage
        eyebrow="Access restricted"
        title="This account is not an admin."
      >
        <p>
          <strong>{portal.identity.email}</strong> is signed in, but it does not
          have a database-managed Moodie admin membership.
        </p>
        <button
          className={styles.primaryButton}
          onClick={exitSession}
          type="button"
        >
          Sign in with another account
        </button>
      </AccessPage>
    );
  }

  if (portal.kind === "configuration-error" || portal.kind === "error") {
    return (
      <AccessPage eyebrow="Setup required" title="Admin access is unavailable.">
        <p>{portal.message}</p>
        {portal.kind === "error" && (
          <button
            className={styles.secondaryButton}
            onClick={exitSession}
            type="button"
          >
            Clear session
          </button>
        )}
      </AccessPage>
    );
  }

  if (portal.kind === "checking" || portal.kind === "verifying") {
    return (
      <AccessPage eyebrow="Secure workspace" title="Verifying secure access…">
        <div aria-label="Loading" className={styles.loadingLine} role="status" />
      </AccessPage>
    );
  }

  return (
    <AccessPage eyebrow="Moodie operations" title="Welcome back.">
      <p>Sign in with an existing Moodie account to continue.</p>
      <form className={styles.form} onSubmit={submitPassword}>
        <label>
          Work email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@moodie.com"
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {formError && (
          <p aria-live="polite" className={styles.formError}>
            {formError}
          </p>
        )}
        <button
          className={styles.primaryButton}
          disabled={submitting !== null}
          type="submit"
        >
          {submitting === "password" ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <button
        className={styles.secondaryButton}
        disabled={submitting !== null}
        onClick={submitGoogle}
        type="button"
      >
        {submitting === "google" ? "Opening Google…" : "Continue with Google"}
      </button>
      <p className={styles.securityNote}>
        Authentication identifies you. Admin access is verified separately
        against Moodie’s protected database membership.
      </p>
    </AccessPage>
  );
}
