import Link from "next/link";

export function Logo({ light = false, size = 28 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 select-none">
      <span
        className="relative inline-flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: light ? "#fff" : "#0069ff" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            width: size * 0.45,
            height: size * 0.45,
            border: "3px solid " + (light ? "#0069ff" : "#fff"),
            borderRadius: "9999px",
          }}
        />
      </span>
      <span
        className={"font-semibold tracking-tight " + (light ? "text-white" : "text-navy")}
        style={{ fontSize: size * 0.86 }}
      >
        calcal
      </span>
    </Link>
  );
}
