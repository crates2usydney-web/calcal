export function AppPreview() {
  const nav = [
    ["Event types", true],
    ["Availability", false],
    ["Meetings", false],
    ["Workflows", false],
    ["Integrations", false],
  ] as const;

  const events = [
    { bar: "#0069ff", title: "30 Minute Meeting", meta: "30 min · Zoom", on: true },
    { bar: "#7c3aed", title: "Intro call", meta: "15 min · Google Meet", on: true },
    { bar: "#0e9f6e", title: "Customer onboarding", meta: "45 min · Phone", on: false },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-10 -top-6 bottom-0 rounded-[40px] bg-gradient-to-b from-[#e9f2ff] to-transparent" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-float">
        <div className="flex h-10 items-center gap-2 border-b border-line bg-[#fbfcfe] px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex h-6 w-[46%] items-center justify-center rounded-md border border-line bg-white text-[10.5px] text-muted">
            calcal.app/dashboard
          </div>
        </div>

        <div className="grid grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-line bg-white p-4 sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[11px] font-semibold text-white">AI</span>
              <div>
                <p className="text-[12px] font-semibold leading-tight">Acme Inc</p>
                <p className="text-[10.5px] text-muted">Team plan</p>
              </div>
            </div>
            <div className="mt-4 rounded-md bg-brand py-1.5 text-center text-[11px] font-semibold text-white">+ Create</div>
            <div className="mt-4 space-y-0.5">
              {nav.map(([label, active]) => (
                <div
                  key={label}
                  className={
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] " +
                    (active ? "bg-brand-soft font-semibold text-brand" : "text-muted")
                  }
                >
                  <span className={"h-1.5 w-1.5 rounded-full " + (active ? "bg-brand" : "bg-line")} />
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-line pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted/70">Admin</p>
              <div className="mt-2 space-y-1.5 text-[11px] text-muted">
                <p>Team members</p>
                <p>Billing</p>
              </div>
            </div>
          </aside>

          <div className="bg-[#f8fafd] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold">Event types</p>
                <p className="text-[11px] text-muted">Share these links so people can book you.</p>
              </div>
              <span className="rounded-md bg-brand px-2.5 py-1.5 text-[10.5px] font-semibold text-white">New event type</span>
            </div>

            <div className="mt-4 space-y-2">
              {events.map((e) => (
                <div key={e.title} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: e.bar }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">{e.title}</p>
                    <p className="text-[10.5px] text-muted">{e.meta}</p>
                  </div>
                  <span className={"h-4 w-7 rounded-full p-0.5 " + (e.on ? "bg-brand" : "bg-[#cfd9e6]")}>
                    <span className={"block h-3 w-3 rounded-full bg-white " + (e.on ? "ml-auto" : "")} />
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-line bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-semibold">Next 7 days</p>
                <p className="text-[10.5px] text-brand">View calendar</p>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-medium text-muted">{d}</div>
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      "h-6 rounded text-center text-[9px] leading-6 " +
                      (i === 3 || i === 5 || i === 9 ? "bg-brand-soft font-semibold text-brand" : "bg-cloud text-muted/60")
                    }
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
