"use client";

import { useState } from "react";
import { createRoutingFormAction } from "@/lib/actions";

type Q = { label: string; type: "text" | "select"; options: string };
type Branch = { question: number; value: string; eventId: string };

export function RoutingFormComposer({ events }: { events: { id: string; title: string }[] }) {
  const [questions, setQuestions] = useState<Q[]>([
    { label: "What would you like to discuss?", type: "select", options: "New project, Support, Partnership" },
    { label: "Company", type: "text", options: "" },
  ]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const parsedQuestions = questions.map((q) => ({
    label: q.label,
    type: q.type,
    options: q.type === "select" ? q.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
  }));
  const parsedBranches = branches
    .filter((b) => b.value.trim() && b.eventId)
    .map((b) => ({ question: "q" + b.question, value: b.value.trim(), event_type_id: b.eventId }));

  function update(i: number, patch: Partial<Q>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  return (
    <form action={createRoutingFormAction} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="text-[15px] font-semibold">Create a routing form</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">Ask questions, then route invitees to a different event type based on their answers.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_240px]">
        <div>
          <label className="label">Title</label>
          <input name="title" required placeholder="Sales qualification" className="input" />
        </div>
        <div>
          <label className="label">Default event type</label>
          <select name="event_type_id" className="input" required>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="label">Description</label>
        <input name="description" placeholder="Shown above the questions" className="input" />
      </div>

      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Questions</p>
      <div className="mt-2 space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input value={q.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Question" className="min-w-[200px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand" />
              <select value={q.type} onChange={(e) => update(i, { type: e.target.value as Q["type"] })} className="rounded-lg border border-line px-3 py-2 text-[13px]">
                <option value="text">Free text</option>
                <option value="select">Multiple choice</option>
              </select>
              <button type="button" onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg border border-line px-2.5 py-2 text-[12px] text-muted hover:border-red-200 hover:text-red-600">Remove</button>
            </div>
            {q.type === "select" && (
              <input value={q.options} onChange={(e) => update(i, { options: e.target.value })} placeholder="Options, comma separated" className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none focus:border-brand" />
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setQuestions((prev) => [...prev, { label: "New question", type: "text", options: "" }])} className="mt-2 text-[12.5px] font-semibold text-brand">+ Add question</button>

      <div className="mt-6 rounded-xl border border-line bg-cloud/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold">Branch rules</p>
            <p className="text-[12px] text-muted">If an answer matches, send the invitee to a different event type.</p>
          </div>
          <button type="button" onClick={() => setBranches((prev) => [...prev, { question: 0, value: "", eventId: events[0]?.id ?? "" }])} className="btn btn-outline">+ Add rule</button>
        </div>
        {branches.length === 0 && <p className="mt-3 text-[12px] text-muted">No rules yet — everyone goes to the default event type.</p>}
        <div className="mt-3 space-y-2">
          {branches.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select value={b.question} onChange={(e) => setBranches((prev) => prev.map((x, idx) => (idx === i ? { ...x, question: Number(e.target.value) } : x)))} className="rounded-lg border border-line px-2.5 py-2 text-[12.5px]">
                {questions.map((q, qi) => <option key={qi} value={qi}>{q.label || "Question " + (qi + 1)}</option>)}
              </select>
              <span className="text-[12px] text-muted">equals</span>
              <input value={b.value} onChange={(e) => setBranches((prev) => prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} placeholder="answer value" className="w-[150px] rounded-lg border border-line px-2.5 py-2 text-[12.5px] outline-none focus:border-brand" />
              <span className="text-[12px] text-muted">→</span>
              <select value={b.eventId} onChange={(e) => setBranches((prev) => prev.map((x, idx) => (idx === i ? { ...x, eventId: e.target.value } : x)))} className="rounded-lg border border-line px-2.5 py-2 text-[12.5px]">
                {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <button type="button" onClick={() => setBranches((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg border border-line px-2.5 py-2 text-[12px] text-muted hover:border-red-200 hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <input type="hidden" name="questions" value={JSON.stringify(parsedQuestions)} />
      <input type="hidden" name="branch_rules" value={JSON.stringify(parsedBranches)} />

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[12px] text-muted">{parsedBranches.length} branch rule{parsedBranches.length === 1 ? "" : "s"}</p>
        <button className="btn btn-primary" disabled={!questions.length || !events.length}>Create routing form</button>
      </div>
    </form>
  );
}
