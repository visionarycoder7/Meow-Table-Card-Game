import { useEffect, useRef, useState } from 'react';
import type { EmoteId } from '@meow-table/protocol';
import { emoteImageMap } from './TableSeat';
import { sfx } from './sfx';

export const emoteList: { id: EmoteId; label: string; desc: string }[] = [
  { id: 'side-eye', label: 'Side Eye', desc: 'Judging silently' },
  { id: 'shocked', label: 'Shocked', desc: 'Sunset disbelief' },
  { id: 'shook', label: 'Panic', desc: 'Shaking in terror' },
  { id: 'yapping', label: 'Yapping', desc: 'Stop arguing!' },
  { id: 'dancing', label: 'Dancing', desc: 'Grooving kitten' },
  { id: 'smug', label: 'Smug', desc: 'Winning smile' },
];

type Props = {
  onEmote: (emote: EmoteId) => void;
};

export function EmotePicker({ onEmote }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block z-40">
      <button
        type="button"
        className="emote-trigger-btn"
        onClick={() => {
          sfx.tick(0.2, 2200);
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label="Open reactions and emotes"
        title="Send an emote reaction to the table!"
      >
        <span className="text-base" role="img" aria-hidden="true">😸</span>
        <span>Emotes</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose an emote"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-2xl border border-amber-400/40 bg-[#0e1a14]/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 sm:w-80"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Reaction Emotes
            </span>
            <button
              type="button"
              className="text-xs text-muted hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close emote picker"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {emoteList.map((item) => (
              <button
                key={item.id}
                type="button"
                className="group flex flex-col items-center justify-center p-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-amber-400 hover:bg-amber-400/10 hover:scale-105 active:scale-95 transition-all text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                onClick={() => {
                  sfx.tick(0.3, 2400);
                  onEmote(item.id);
                  setOpen(false);
                }}
                title={item.desc}
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-black/40 flex items-center justify-center mb-1 shadow-inner">
                  <img
                    src={emoteImageMap[item.id]}
                    alt={item.label}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                    loading="eager"
                  />
                </div>
                <span className="text-[11px] font-semibold text-neutral-200 group-hover:text-amber-300 truncate w-full">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
