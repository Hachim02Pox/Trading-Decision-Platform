"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { summarizeJournal, type JournalEntry, type TradeDirection } from "@/lib/traderWorkspace";
import { createJournalEntry, deleteJournalEntry as deleteJournalEntryApi, fetchJournalEntries, updateJournalEntryNotes } from "@/lib/api/journalClient";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./Workspace.module.css";

// Decision is LONG/SHORT only at entry (user-explicit request, 2026-09).
// NO_TRADE remains a valid TradeDirection for entries logged before this
// change — it just isn't offered in the creation form anymore.
type NewTradeDirection = Exclude<TradeDirection, "NO_TRADE">;

interface JournalDraft {
  tradedAt: string;
  direction: NewTradeDirection;
  setup: string;
  thesis: string;
  invalidation: string;
  outcomeR: string;
  followedPlan: boolean;
}

function emptyDraft(): JournalDraft {
  return { tradedAt: new Date().toISOString().slice(0, 10), direction: "LONG", setup: "", thesis: "", invalidation: "", outcomeR: "", followedPlan: false };
}

export function JournalWorkspace() {
  const { t, language } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState<JournalDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Guest mode (no Supabase session, e.g. "Continuer sans compte" on /login):
  // the journal is per-holder server-side (requireHolder on every
  // /api/journal route), so a guest has nothing to load and nothing to save.
  // Checked once client-side so the UI can say so plainly instead of the
  // form silently failing on a 401 after the guest fills it in.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetchJournalEntries()
      .then((data) => setEntries(data))
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setHasSession(data.session !== null));
  }, []);

  useEffect(() => {
    if (hasSession) load();
    if (hasSession === false) setLoading(false);
  }, [hasSession, load]);

  const summary = useMemo(() => summarizeJournal(entries), [entries]);
  const locale = language === "FR" ? "fr-FR" : "en-US";
  const format = (value: number | null, suffix = "") => value === null ? "—" : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}${suffix}`;
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.tradedAt || !draft.setup.trim() || !draft.thesis.trim() || !draft.invalidation.trim()) return;
    const parsedOutcome = draft.outcomeR.trim() === "" ? null : Number(draft.outcomeR);
    if (parsedOutcome !== null && !Number.isFinite(parsedOutcome)) return;
    if (!draft.followedPlan && !window.confirm(t("journal.followedPlanConfirm"))) return;

    setSaving(true);
    setSaveError(null);
    createJournalEntry({
      tradedAt: draft.tradedAt,
      direction: draft.direction,
      setup: draft.setup.trim(),
      thesis: draft.thesis.trim(),
      invalidation: draft.invalidation.trim(),
      outcomeR: parsedOutcome,
      followedPlan: draft.followedPlan,
      notes: "",
    })
      .then((entry) => {
        setEntries((current) => [entry, ...current]);
        setDraft(emptyDraft());
      })
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setSaving(false));
  }

  function removeEntry(id: string) {
    if (!window.confirm(t("journal.deleteConfirm"))) return;
    const previous = entries;
    setEntries((current) => current.filter((item) => item.id !== id));
    deleteJournalEntryApi(id).catch((err: unknown) => {
      setEntries(previous);
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    });
  }

  // Review note — editable only after the trade already exists (post-trade
  // debrief), never required at creation.
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  function openNoteEditor(entry: JournalEntry) {
    setNoteEditId(entry.id);
    setNoteDraft(entry.notes);
    setNoteError(null);
  }

  function closeNoteEditor() {
    setNoteEditId(null);
    setNoteDraft("");
    setNoteError(null);
  }

  function saveNote(id: string) {
    setNoteSaving(true);
    setNoteError(null);
    updateJournalEntryNotes(id, noteDraft.trim())
      .then((updated) => {
        setEntries((current) => current.map((item) => (item.id === id ? updated : item)));
        closeNoteEditor();
      })
      .catch((err: unknown) => setNoteError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setNoteSaving(false));
  }

  function exportJournal() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gold-terminal-journal-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>{t("pageTitle.journal")}</h1><p className={styles.pageIntro}>{t("journal.intro")}</p></div>
        <button type="button" className={styles.button} onClick={exportJournal} disabled={entries.length === 0}>{t("journal.export")}</button>
      </header>
      {hasSession === false && (
        <div className={styles.errorBox}>
          <span className={styles.errorMessage}>{t("journal.guestNotice")}</span>
        </div>
      )}
      {loadError && (
        <div className={styles.errorBox}>
          <span className={styles.errorMessage}>{t("journal.loadFailed", { error: loadError })}</span>
          <button type="button" className={styles.retryButton} onClick={load}>{t("market.retry")}</button>
        </div>
      )}
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statLabel}>{t("journal.total")}</span><strong className={styles.statValue}>{summary.totalEntries}</strong></div>
        <div className={styles.stat}><span className={styles.statLabel}>{t("journal.winRate")}</span><strong className={styles.statValue}>{format(summary.winRatePercent, "%")}</strong></div>
        <div className={styles.stat}><span className={styles.statLabel}>{t("journal.totalR")}</span><strong className={styles.statValue}>{format(summary.totalR, "R")}</strong></div>
        <div className={styles.stat}><span className={styles.statLabel}>{t("journal.averageR")}</span><strong className={styles.statValue}>{format(summary.averageR, "R")}</strong></div>
        <div className={styles.stat}><span className={styles.statLabel}>{t("journal.adherence")}</span><strong className={styles.statValue}>{format(summary.planAdherencePercent, "%")}</strong></div>
      </div>
      <div className={styles.gridTwo}>
        <section className={styles.module}>
          <span className={styles.moduleTitle}>{t("journal.newEntry")}</span>
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.inlineFields}>
              <label className={styles.field}><span className={styles.label}>{t("journal.date")}</span><input required name="tradedAt" autoComplete="off" type="date" className={styles.input} value={draft.tradedAt} onChange={(event) => setDraft((current) => ({ ...current, tradedAt: event.target.value }))} /></label>
              <label className={styles.field}><span className={styles.label}>{t("journal.direction")}</span><select name="direction" autoComplete="off" className={styles.select} value={draft.direction} onChange={(event) => setDraft((current) => ({ ...current, direction: event.target.value as NewTradeDirection }))}><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select></label>
              <label className={styles.field}><span className={styles.label}>{t("journal.outcome")}</span><input name="outcomeR" autoComplete="off" type="number" step="any" className={styles.input} inputMode="decimal" placeholder="+1.50…" value={draft.outcomeR} onChange={(event) => setDraft((current) => ({ ...current, outcomeR: event.target.value }))} /></label>
            </div>
            <label className={styles.field}><span className={styles.label}>{t("journal.setup")}</span><input required name="setup" autoComplete="off" maxLength={120} className={styles.input} placeholder={t("journal.setupPlaceholder")} value={draft.setup} onChange={(event) => setDraft((current) => ({ ...current, setup: event.target.value }))} /></label>
            <label className={styles.field}><span className={styles.label}>{t("journal.thesis")}</span><textarea required name="thesis" autoComplete="off" maxLength={1000} className={styles.textarea} value={draft.thesis} onChange={(event) => setDraft((current) => ({ ...current, thesis: event.target.value }))} /></label>
            <label className={styles.field}><span className={styles.label}>{t("journal.invalidation")}</span><textarea required name="invalidation" autoComplete="off" maxLength={1000} className={styles.textarea} placeholder={t("journal.invalidationPlaceholder")} value={draft.invalidation} onChange={(event) => setDraft((current) => ({ ...current, invalidation: event.target.value }))} /></label>
            <label className={styles.checkRow}><input name="followedPlan" type="checkbox" checked={draft.followedPlan} onChange={(event) => setDraft((current) => ({ ...current, followedPlan: event.target.checked }))} /><span>{t("journal.followedPlan")}</span></label>
            {saveError && <p className={styles.errorMessage}>{saveError}</p>}
            <div className={styles.actions}><button type="submit" className={styles.primaryButton} disabled={saving || hasSession === false}>{saving ? t("journal.saving") : t("journal.save")}</button></div>
          </form>
        </section>
        <section className={styles.module}>
          <span className={styles.moduleTitle}>{t("journal.history")}</span>
          {loading ? <p className={styles.empty}>{t("journal.loading")}</p> : entries.length === 0 ? <p className={styles.empty}>{t("journal.empty")}</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t("journal.date")}</th><th>{t("journal.direction")}</th><th>{t("journal.setup")}</th><th className={styles.numeric}>R</th><th>{t("journal.plan")}</th><th>{t("journal.notesColumn")}</th><th /></tr></thead><tbody>{entries.map((entry) => (
            <Fragment key={entry.id}>
              <tr>
                <td>{formatDate(entry.tradedAt)}</td>
                <td>{entry.direction}</td>
                <td>{entry.setup}</td>
                <td className={`${styles.numeric} ${(entry.outcomeR ?? 0) > 0 ? styles.positive : (entry.outcomeR ?? 0) < 0 ? styles.negative : ""}`}>{entry.outcomeR === null ? "—" : `${entry.outcomeR > 0 ? "+" : ""}${entry.outcomeR.toFixed(2)}R`}</td>
                <td>{entry.followedPlan ? t("journal.yes") : t("journal.no")}</td>
                <td><button type="button" className={styles.button} onClick={() => (noteEditId === entry.id ? closeNoteEditor() : openNoteEditor(entry))}>{entry.notes.trim() ? t("journal.editNote") : t("journal.addNote")}</button></td>
                <td><button type="button" className={styles.dangerButton} onClick={() => removeEntry(entry.id)}>{t("journal.delete")}</button></td>
              </tr>
              {noteEditId === entry.id && (
                <tr>
                  <td colSpan={7}>
                    <label className={styles.field}>
                      <span className={styles.label}>{t("journal.notes")}</span>
                      <textarea autoComplete="off" maxLength={2000} className={styles.textarea} placeholder={t("journal.notePlaceholder")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                    </label>
                    {noteError && <p className={styles.errorMessage}>{noteError}</p>}
                    <div className={styles.actions}>
                      <button type="button" className={styles.primaryButton} disabled={noteSaving} onClick={() => saveNote(entry.id)}>{noteSaving ? t("journal.noteSaving") : t("journal.noteSave")}</button>
                      <button type="button" className={styles.button} onClick={closeNoteEditor}>{t("journal.noteCancel")}</button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}</tbody></table></div>}
        </section>
      </div>
      <p className={styles.notice}>{t("journal.dbNotice")}</p>
    </div>
  );
}
