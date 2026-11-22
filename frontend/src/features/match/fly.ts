import { sfx } from './sfx';

export type RectLike = { left: number; top: number; width: number; height: number };

export function fly(
  html: string,
  a: RectLike | DOMRect | null,
  b: RectLike | DOMRect | null,
  ms: number,
  delay = 0,
  done?: () => void,
  snd?: 'play' | 'draw'
) {
  if (typeof document === 'undefined' || !a || !b) {
    done?.();
    return;
  }
  if (snd) {
    if (delay > 0) setTimeout(() => sfx[`${snd}Go`](), delay);
    else sfx[`${snd}Go`]();
  }
  const e = document.createElement('div');
  e.className = 'fly';
  e.innerHTML = html;
  e.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;opacity:0`;
  document.body.appendChild(e);
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const s = b.width / a.width;
  const r = Math.random() * 50 - 25;
  const an = e.animate(
    [
      { opacity: 1, transform: 'translate(0,0) scale(1) rotate(0deg)' },
      { opacity: 1, transform: `translate(${dx * 0.55}px,${dy * 0.55 - 50}px) scale(${(1 + s) / 2 + 0.2}) rotate(${r}deg)`, offset: 0.55 },
      { opacity: 1, transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(0deg)` },
    ],
    { duration: ms, delay, easing: 'cubic-bezier(.25,.7,.35,1)', fill: 'both' }
  );
  an.onfinish = () => {
    e.remove();
    if (snd) sfx[`${snd}End`]();
    done?.();
  };
}
