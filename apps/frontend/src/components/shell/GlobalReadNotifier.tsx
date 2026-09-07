"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGlobalRead } from "@/context/GlobalReadContext";
import styles from "./GlobalReadNotifier.module.css";

/** Route-independent status: Global Read is a terminal job, not a page job. */
export function GlobalReadNotifier() {
  const globalRead = useGlobalRead();
  const isRunning = globalRead.phase === "analyzing";
  const wasRunning = useRef(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (isRunning) wasRunning.current = true;
    if (wasRunning.current && !isRunning && globalRead.phase === "ready" && globalRead.status === "OK" && globalRead.interpretation) {
      wasRunning.current = false;
      setShowCompletion(true);
    }
  }, [globalRead.interpretation, globalRead.phase, globalRead.status, isRunning]);

  useEffect(() => {
    if (!showCompletion) return;
    const timeout = window.setTimeout(() => setShowCompletion(false), 12_000);
    return () => window.clearTimeout(timeout);
  }, [showCompletion]);

  if (!isRunning && !showCompletion) return null;

  return (
    <aside className={styles.notice} aria-live="polite" aria-atomic="true">
      {isRunning ? <><span className={styles.progressDot} aria-hidden="true" /><div className={styles.copy}><strong>Lecture Globale en cours</strong><span>Données, web scan et scénarios. Tu peux continuer à naviguer.</span></div><Link className={styles.action} href="/market?globalRead=1">Voir</Link></> : <><span className={styles.doneMark} aria-hidden="true">✓</span><div className={styles.copy}><strong>Lecture Globale terminée</strong><span>Le rapport a été mis à jour.</span></div><Link className={styles.action} href="/market?globalRead=1">Ouvrir</Link></>}
    </aside>
  );
}
