import { handleHue } from '@/lib/format';

export function Avatar({ handle, size = 40 }: { handle: string; size?: number }) {
  const hue = handleHue(handle);
  return (
    <div
      aria-hidden
      className="shrink-0 rounded-full grid place-items-center font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, oklch(70% 0.17 ${hue}), oklch(55% 0.19 ${(hue + 40) % 360}))`,
      }}
    >
      {handle.slice(0, 1).toUpperCase()}
    </div>
  );
}
