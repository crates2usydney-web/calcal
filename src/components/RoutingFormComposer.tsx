"use client";

import { useState } from "react";
import { createRoutingFormAction } from "@/lib/actions";

export function RoutingFormComposer({ events }: { events: { id: string; title: string }[] }) {
  const [questions, setQuestions] = useState<string[]>(["What would you like to discuss?", "Company"]);

  return (
    <form action={createRoutingFormAction} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="text-[15px] font-semibold">Create a routing form</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">Qualify invitees before they book, then send them straight to the right event type.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <label className="label">Title</label>
          <input name="title" required placeholder="Sales qualification" className="input" />
        </div>
        <div>
          <label className="label">Route to event type</label>
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
      <div className="mt-2 space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQuestions((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
              className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
            />
            <button type="button" onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg border border-line px-2.5 py-2 text-[12px] text-muted hover:border-red-200 hover:text-red-600">
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setQuestions((prev) => [...prev, "New question"])} className="mt-2 text-[12.5px] font-semibold text-brand">
        + Add question
      </button>

      <input type="hidden" name="questions" value={JSON.stringify(questions.map((label) => ({ label })))} />

      <div className="mt-5 flex justify-end border-t border-line pt-4">
        <button className="btn btn-primary" disabled={!questions.length}>Create routing form</button>
      </div>
    </form>
  );
}
