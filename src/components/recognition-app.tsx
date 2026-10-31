"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, Handshake, Heart, Lightbulb, MessageSquare, Plus, RotateCcw, Search, Sparkles, Target, Users, X, type LucideIcon } from "lucide-react";
import { badges, CURRENT_USER_ID, loadRecognitions, MAX_MESSAGE_LENGTH, newestFirst, saveRecognitions, seedRecognitions, team, validateRecognition, type FormErrors, type Recognition, type RecognitionInput, type TeamMember } from "@/lib/recognition";

const badgeIcons: Record<string, LucideIcon> = { handshake: Handshake, sparkles: Sparkles, lightbulb: Lightbulb, target: Target };
const currentUser = team.find((member) => member.id === CURRENT_USER_ID)!;
const teammates = team.filter((member) => member.id !== CURRENT_USER_ID);
const emptyForm: RecognitionInput = { recipientId: "", badgeId: "", message: "" };

function Avatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  return <Image className="avatar" src={member.avatar} alt={member.displayName} width={size} height={size} />;
}

function relativeTime(date: string) {
  const hours = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 3_600_000));
  if (hours === 0) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecognitionApp() {
  const [records, setRecords] = useState<Recognition[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [form, setForm] = useState<RecognitionInput>(emptyForm);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const resetDialog = useRef<HTMLDialogElement>(null);
  const recipientSearch = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const badgeField = useRef<HTMLFieldSetElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const result = loadRecognitions(window.localStorage);
        setRecords(result.records);
        setStorageAvailable(result.available && saveRecognitions(window.localStorage, result.records));
      } catch {
        setRecords(seedRecognitions());
        setStorageAvailable(false);
      }
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  function commit(next: Recognition[]) {
    setRecords(newestFirst(next));
    try {
      if (!saveRecognitions(window.localStorage, next)) setStorageAvailable(false);
    } catch {
      setStorageAvailable(false);
    }
  }

  function updateField(field: keyof RecognitionInput, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSuccess("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || submitting.current) return;
    const nextErrors = validateRecognition(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.recipientId) recipientSearch.current?.focus();
      else if (nextErrors.badgeId) badgeField.current?.querySelector<HTMLButtonElement>("button")?.focus();
      else messageInput.current?.focus();
      return;
    }
    submitting.current = true;
    const recipient = team.find((member) => member.id === form.recipientId)!;
    commit([{ ...form, id: crypto.randomUUID(), senderId: CURRENT_USER_ID, message: form.message.trim(), createdAt: new Date().toISOString() }, ...records]);
    setForm(emptyForm);
    setSearch("");
    setSuccess(`Recognition sent to ${recipient.displayName}.`);
    setFilter("all");
    recipientSearch.current?.focus();
    queueMicrotask(() => { submitting.current = false; });
  }

  const results = teammates.filter((member) => `${member.displayName} ${member.role}`.toLowerCase().includes(search.toLowerCase().trim()));
  const selectedMember = teammates.find((member) => member.id === form.recipientId);
  const visibleRecords = records.filter((record) => filter === "all" || (filter === "received" ? record.recipientId === CURRENT_USER_ID : record.senderId === CURRENT_USER_ID));
  const celebratedCount = new Set(records.map((record) => record.recipientId)).size;

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="topbar"><div className="topbar-inner">
        <a className="brand" href="#main" aria-label="Goodwork home"><span className="brand-symbol"><Sparkles size={22} /></span>goodwork<span className="brand-dot">.</span></a>
        <nav aria-label="Main navigation"><a className="nav-link active" href="#feed"><Heart size={17} />Recognition</a></nav>
        <div className="identity"><span className="demo-label">Dummy data</span><Avatar member={currentUser} size={36} /><div><strong>Alex Morgan</strong><span>Demo user</span></div></div>
      </div></header>

      <main id="main" className="workspace">
        <section className="page-heading" aria-labelledby="page-title"><div><div className="eyebrow">OUR TEAM / RECOGNITION</div><h1 id="page-title">Good work deserves a thank you.</h1><p>A little appreciation. A big difference.</p></div><a className="button primary heading-action" href="#give"><Plus size={18} />Give recognition</a></section>
        <section className="summary" aria-label="Team recognition summary">
          <div className="summary-item"><span className="summary-icon green"><Heart size={20} /></span><strong>{loaded ? records.length : "-"}<span>Recognitions shared</span></strong></div>
          <div className="summary-item"><span className="summary-icon blue"><Users size={20} /></span><strong>{loaded ? celebratedCount : "-"}<span>Teammates celebrated</span></strong></div>
          <div className="summary-item"><span className="summary-icon coral"><ArrowUpRight size={20} /></span><strong>{loaded ? records.filter((record) => record.senderId === CURRENT_USER_ID).length : "-"}<span>Sent by you</span></strong></div>
          <div className="summary-note"><span className="live-dot" />Your team, at its best.</div>
        </section>
        {!storageAvailable && <p role="status" className="storage-warning">Browser storage is unavailable. Recognition will stay here until you reload.</p>}

        <div className="main-grid">
          <section id="feed" className="feed-section" aria-labelledby="feed-title">
            <div className="section-heading"><div><h2 id="feed-title">Team appreciation</h2><p>The good things happening around us.</p></div><span className="count-label">{loaded ? records.length : "-"} recognitions</span></div>
            <div className="feed-tabs" role="group" aria-label="Filter recognition">
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}><MessageSquare size={15} />All recognition</button>
              <button type="button" aria-pressed={filter === "received"} onClick={() => setFilter("received")}><ArrowDownLeft size={15} />Received</button>
              <button type="button" aria-pressed={filter === "sent"} onClick={() => setFilter("sent")}><ArrowUpRight size={15} />Sent</button>
            </div>
            <div className="feed-list" aria-busy={!loaded}>
              {!loaded ? <div className="empty-state" role="status">Loading recognition...</div> : visibleRecords.length === 0 ? <div className="empty-state"><Heart size={28} /><h3>No recognition here yet</h3><p>{filter === "received" ? "Your received recognition will appear here." : "The next thank you starts with you."}</p></div> : visibleRecords.map((record) => {
                const sender = team.find((member) => member.id === record.senderId)!;
                const recipient = team.find((member) => member.id === record.recipientId)!;
                const badge = badges.find((item) => item.id === record.badgeId)!;
                const Icon = badgeIcons[badge.icon];
                return <article className="recognition-item" key={record.id} data-testid="recognition-item">
                  <div className="recognition-top"><Avatar member={recipient} size={48} /><div className="recognition-names"><div><strong>{recipient.displayName}</strong><span className="recipient-role">{recipient.role}</span></div><p><span>{sender.id === CURRENT_USER_ID ? "You" : sender.displayName}</span> recognized {recipient.displayName.split(" ")[0]}</p></div><time title={new Date(record.createdAt).toLocaleString()} dateTime={record.createdAt}>{relativeTime(record.createdAt)}</time></div>
                  <div className={`badge-label ${badge.color}`}><Icon size={15} />{badge.label}</div>
                  <p className="recognition-message">{record.message}</p>
                  <div className="recognition-bottom"><span className={`mini-badge ${badge.color}`}><Icon size={13} /></span><span>A moment worth celebrating</span><Heart size={14} className="quiet-heart" /></div>
                </article>;
              })}
            </div>
            <div className="feed-footer"><CheckCircle2 size={14} />{loaded ? "You're all caught up" : "Getting things ready"}</div>
          </section>

          <aside id="give" className="composer" aria-labelledby="give-title">
            <div className="composer-heading"><span className="composer-icon"><Sparkles size={22} /></span><div><h2 id="give-title">Make someone&apos;s day</h2><p>Give a little recognition.</p></div></div>
            <form onSubmit={submit} noValidate>
              <fieldset className="recipient-field"><legend><span className="step-number">01</span>Who stood out?</legend>
                <label className="sr-only" htmlFor="teammate-search">Search teammates</label>
                <div className={`search-box ${errors.recipientId ? "invalid" : ""}`}><Search size={17} /><input ref={recipientSearch} id="teammate-search" placeholder="Search by name or role" value={search} onChange={(event) => setSearch(event.target.value)} aria-invalid={Boolean(errors.recipientId)} aria-describedby={errors.recipientId ? "recipient-error" : undefined} />{search && <button type="button" className="icon-button" title="Clear search" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
                <div className="recipient-options" role="group" aria-label="Choose a teammate">{results.length ? results.map((member) => <button type="button" key={member.id} className={`recipient-option ${form.recipientId === member.id ? "selected" : ""}`} aria-pressed={form.recipientId === member.id} onClick={() => updateField("recipientId", member.id)}><Avatar member={member} size={32} /><span><strong>{member.displayName}</strong><small>{member.role}</small></span>{form.recipientId === member.id ? <Check size={16} /> : <ChevronRight size={14} />}</button>) : <p className="no-results" role="status">No teammates found.</p>}</div>
                {selectedMember && <p className="selected-note"><CheckCircle2 size={13} />Selected: {selectedMember.displayName}</p>}
                {errors.recipientId && <p id="recipient-error" className="field-error" role="alert">{errors.recipientId}</p>}
              </fieldset>
              <fieldset ref={badgeField} aria-describedby={errors.badgeId ? "badge-error" : undefined}><legend><span className="step-number">02</span>What made a difference?</legend><div className="badge-grid" role="group" aria-label="Choose a badge">{badges.map((badge) => { const Icon = badgeIcons[badge.icon]; return <button type="button" key={badge.id} className={`badge-option ${badge.color} ${form.badgeId === badge.id ? "selected" : ""}`} aria-pressed={form.badgeId === badge.id} onClick={() => updateField("badgeId", badge.id)}><span className="badge-option-icon"><Icon size={22} /></span><strong>{badge.label}</strong><small>{badge.description}</small>{form.badgeId === badge.id && <Check className="badge-check" size={14} />}</button>; })}</div>{errors.badgeId && <p id="badge-error" className="field-error" role="alert">{errors.badgeId}</p>}</fieldset>
              <div className="message-field"><label htmlFor="message"><span className="step-number">03</span>Put it into words</label><textarea ref={messageInput} id="message" rows={4} maxLength={MAX_MESSAGE_LENGTH} placeholder="Thank you for..." value={form.message} onChange={(event) => updateField("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={`message-count${errors.message ? " message-error" : ""}`} /><div id="message-count" className="message-count">{form.message.length} / {MAX_MESSAGE_LENGTH}</div>{errors.message && <p id="message-error" className="field-error" role="alert">{errors.message}</p>}</div>
              <button type="submit" className="button primary submit-button" disabled={!loaded}><Sparkles size={17} />Send recognition<ArrowUpRight size={17} /></button>
              {success && <p className="success-message" role="status"><CheckCircle2 size={16} />{success}</p>}
            </form>
            <div className="composer-footer"><Heart size={13} />Small gestures. Lasting impact.</div>
          </aside>
        </div>
        <footer className="page-footer"><span>goodwork<span className="brand-dot">.</span><small>Fictional team. Genuine appreciation.</small></span><button className="reset-button" type="button" disabled={!loaded} onClick={() => resetDialog.current?.showModal()}><RotateCcw size={14} />Reset demo data</button></footer>
      </main>
      <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description"><span className="summary-icon coral"><RotateCcw size={22} /></span><h2 id="reset-title">Reset this demo?</h2><p id="reset-description">Your added recognition will be removed and the original sample feed restored.</p><div className="dialog-actions"><button type="button" className="button secondary" onClick={() => resetDialog.current?.close()}>Cancel</button><button type="button" className="button primary" onClick={() => { commit(seedRecognitions()); setForm(emptyForm); setSearch(""); setErrors({}); setSuccess("Demo data reset."); setFilter("all"); resetDialog.current?.close(); }}>Reset demo</button></div></dialog>
    </>
  );
}