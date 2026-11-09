export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Notice({ kind = "success", children }: { kind?: "success" | "error" | "info"; children: React.ReactNode }) {
  const style =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : kind === "info"
      ? "border-line bg-cloud text-ink/80"
      : "border-green-200 bg-green-50 text-green-800";
  return <div className={"mt-4 rounded-lg border px-3.5 py-2.5 text-[13px] " + style}>{children}</div>;
}
