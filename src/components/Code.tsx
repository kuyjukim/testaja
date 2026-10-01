export function Code({ children }: { children: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-xl border p-3.5 text-[13px] leading-relaxed"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', fontFamily: 'var(--font-mono)' }}
    >
      <code>{children}</code>
    </pre>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'oklch(62% 0.15 230)',
  POST: 'oklch(60% 0.16 150)',
  PATCH: 'oklch(68% 0.15 75)',
  DELETE: 'oklch(62% 0.18 20)',
};

export function Endpoint({
  method,
  path,
  auth,
  children,
}: {
  method: keyof typeof METHOD_COLORS | string;
  path: string;
  auth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className="text-[11px] font-bold tracking-wider"
          style={{ color: METHOD_COLORS[method] ?? 'var(--muted)' }}
        >
          {method}
        </span>
        <code className="text-[13px]" style={{ fontFamily: 'var(--font-mono)' }}>
          {path}
        </code>
        {auth && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            키 필요
          </span>
        )}
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        {children}
      </p>
    </li>
  );
}
