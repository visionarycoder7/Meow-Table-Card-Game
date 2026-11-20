import { useEffect, useId, useRef, useState } from 'react';
import type { Card } from '@meow-table/protocol';
import { actionDetails, CardFace, cardName } from '../features/match/CardFace';

const rulesPdf = 'https://service.mattel.com/instruction_sheets/HVW18-Eng.pdf';
const examples: { card: Card; reference: string }[] = [
  { card: { id: 0, rank: 5, suit: 'NIP' }, reference: 'Number cards. The reference gives 0 and 7 extra effects.' },
  { card: { id: 1, action: 'hiss', suit: 'PAW' }, reference: 'Skip' },
  { card: { id: 2, action: 'tail-spin', suit: 'FISH' }, reference: 'Reverse' },
  { card: { id: 3, action: 'double-treat', suit: 'BELL' }, reference: 'Draw Two. The reference also allows stacking.' },
  { card: { id: 4, action: 'curious-cat', suit: null }, reference: 'Wild cards also change color. The reference has no standalone color-change card.' },
  { card: { id: 5, action: 'catnap', suit: null }, reference: 'Closest effect is Draw Four. That reference card is colored rather than wild.' },
  { card: { id: 6, action: 'pounce', suit: null }, reference: 'Meow Table original. No direct counterpart.' },
];

export function GameToolbar() {
  const guide = useRef<HTMLDialogElement>(null);
  const guideTitle = useId();
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [error, setError] = useState('');
  const fullscreenAvailable = Boolean(document.fullscreenEnabled);

  async function toggleFullscreen() {
    setError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError('This browser window couldn’t switch to fullscreen.');
    }
  }

  useEffect(() => {
    function onChange() {
      setFullscreen(Boolean(document.fullscreenElement));
      setError('');
    }
    function onKey(event: KeyboardEvent) {
      if (!fullscreenAvailable || event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const exit = event.key === 'Escape' && document.fullscreenElement;
      if (event.key !== 'F11' && !exit) return;
      event.preventDefault();
      if (exit) event.stopPropagation();
      void toggleFullscreen();
    }
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [fullscreenAvailable]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
      <nav className="flex flex-wrap justify-end gap-2" aria-label="Game tools">
        <a className="ui-button game-tool" href={rulesPdf} target="_blank" rel="noopener noreferrer">
          Read rules <span className="sr-only">(PDF, opens in a new tab)</span>
        </a>
        <button type="button" className="ui-button game-tool" aria-haspopup="dialog" onClick={() => guide.current?.showModal()}>
          Card guide
        </button>
        <button type="button" className="ui-button game-tool" aria-keyshortcuts={fullscreen ? 'F11 Escape' : 'F11'} disabled={!fullscreenAvailable}
          title={fullscreenAvailable ? fullscreen ? 'Press Escape to exit fullscreen' : 'Press F11 to enter fullscreen'
            : 'App fullscreen is unavailable in this browser window'}
          onClick={() => void toggleFullscreen()}>
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'} <kbd aria-hidden="true">{fullscreen ? 'Esc' : 'F11'}</kbd>
        </button>
      </nav>
      {error && <p className="mt-2 text-right text-sm text-red-200" role="status">{error}</p>}
      <dialog ref={guide} className="card-guide-dialog" aria-labelledby={guideTitle}>
        <header className="flex items-start justify-between gap-3 border-b border-ink/15 p-4 sm:p-5">
          <div>
            <h2 id={guideTitle} className="text-xl font-semibold">Card guide</h2>
            <p className="mt-1 text-sm text-muted">Use Meow Table rules in this game. The reference column shows the closest published counterpart.</p>
          </div>
          <button type="button" className="ui-button shrink-0" autoFocus onClick={() => guide.current?.close()}>Close</button>
        </header>
        <div className="card-guide-scroll px-4 pb-4 sm:px-5" tabIndex={0} aria-label="Card comparison">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-3 pr-3 font-semibold">Meow Table</th>
                <th scope="col" className="py-3 font-semibold">UNO Show ’Em No Mercy reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {examples.map(({ card, reference }) => {
                const action = 'action' in card ? actionDetails[card.action] : undefined;
                return (
                  <tr key={card.id}>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="guide-card shrink-0"><CardFace card={card} /></div>
                        <div className="min-w-0 flex-1 basis-24">
                          <p className="font-semibold">{action?.name ?? cardName(card)}</p>
                          <p className="text-muted">{action?.rule ?? 'Match a suit or number. All ranks are ordinary cards.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 align-middle">{reference}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <a className="mt-3 inline-block text-accent underline underline-offset-4" href={rulesPdf}
            target="_blank" rel="noopener noreferrer">Official reference PDF <span className="sr-only">(opens in a new tab)</span></a>
        </div>
      </dialog>
    </div>
  );
}
