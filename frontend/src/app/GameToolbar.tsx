import { useEffect, useId, useRef, useState } from 'react';
import type { Card } from '@meow-table/protocol';
import { actionDetails, CardFace, cardName } from '../features/match/CardFace';

const rulesPdf = 'https://service.mattel.com/instruction_sheets/HVW18-Eng.pdf';
const licensePage = 'https://github.com/visionarycoder7/Meow-Table-Card-Game/blob/main/LICENSE';
const examples: { card: Card; counterpart: string; note?: string }[] = [
  { card: { id: 0, rank: 5, suit: 'NIP' }, counterpart: 'Number cards', note: 'The reference gives 0 and 7 extra effects.' },
  { card: { id: 1, action: 'hiss', suit: 'PAW' }, counterpart: 'Skip' },
  { card: { id: 2, action: 'tail-spin', suit: 'FISH' }, counterpart: 'Reverse' },
  { card: { id: 3, action: 'double-treat', suit: 'BELL' }, counterpart: 'Draw Two', note: 'The reference also allows stacking.' },
  { card: { id: 4, action: 'curious-cat', suit: null }, counterpart: 'Wild cards', note: 'The reference has no standalone color-change card.' },
  { card: { id: 5, action: 'catnap', suit: null }, counterpart: 'Draw Four', note: 'The closest reference card has a fixed color.' },
  { card: { id: 6, action: 'pounce', suit: null }, counterpart: 'No direct counterpart', note: 'Pounce is a Meow Table original.' },
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
      <nav className="flex items-center justify-end gap-1.5 sm:gap-2" aria-label="Game tools">
        <a className="ui-button whitespace-nowrap px-2.5 sm:px-3.5" href={rulesPdf} target="_blank" rel="noopener noreferrer">
          Read rules <span className="sr-only">(PDF, opens in a new tab)</span>
        </a>
        <button type="button" className="ui-button whitespace-nowrap px-2.5 sm:px-3.5"
          aria-haspopup="dialog" onClick={() => guide.current?.showModal()}>
          Card guide
        </button>
        <button type="button"
          className={fullscreen ? 'ui-button ui-button-exit min-w-11 px-0 sm:px-3.5' : 'ui-button min-w-11 px-0 sm:px-3.5'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-keyshortcuts={fullscreen ? 'F11 Escape' : 'F11'} disabled={!fullscreenAvailable}
          title={fullscreenAvailable ? fullscreen ? 'Press Escape to exit fullscreen' : 'Press F11 to enter fullscreen'
            : 'App fullscreen is unavailable in this browser window'}
          onClick={() => void toggleFullscreen()}>
          <svg className="fullscreen-tool-icon size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={fullscreen ? 'M4 9h5V4m11 5h-5V4M4 15h5v5m11-5h-5v5' : 'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5'} />
          </svg>
          <span className="fullscreen-tool-label">{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
          <kbd className="fullscreen-tool-label" aria-hidden="true">{fullscreen ? 'Esc' : 'F11'}</kbd>
        </button>
      </nav>
      {error && <p className="mt-2 text-right text-sm text-red-200" role="status">{error}</p>}
      <dialog ref={guide} className="card-guide-dialog" aria-labelledby={guideTitle}>
        <header className="flex items-start justify-between gap-3 border-b border-ink/15 p-4 sm:p-5">
          <div>
            <h2 id={guideTitle} className="text-xl font-semibold">Card guide</h2>
            <p className="mt-1 text-sm text-muted">Compare Meow Table cards with their closest published counterparts.</p>
          </div>
          <button type="button" className="ui-button ui-button-exit shrink-0" autoFocus onClick={() => guide.current?.close()}>Close</button>
        </header>
        <div className="card-guide-scroll mx-2 my-2 px-2 pb-3 sm:mx-3 sm:px-3" role="region"
          tabIndex={0} aria-label="Card comparison">
          <table className="block w-full text-left text-sm sm:table sm:table-fixed" role="table">
            <thead className="sr-only sm:not-sr-only sm:table-header-group" role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader" className="guide-column-heading w-[54%] pr-4">Meow Table card</th>
                <th scope="col" role="columnheader" className="guide-column-heading pl-4">UNO Show ’Em No Mercy reference</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-ink/15 sm:table-row-group" role="rowgroup">
              {examples.map(({ card, counterpart, note }) => {
                const action = 'action' in card ? actionDetails[card.action] : undefined;
                return (
                  <tr className="block py-4 sm:table-row" role="row" key={card.id}>
                    <td className="block sm:table-cell sm:border-r sm:border-ink/10 sm:py-4 sm:pr-4 sm:align-top" role="cell">
                      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                        <div className="guide-card"><CardFace card={card} /></div>
                        <div>
                          <p className="font-semibold">{action?.name ?? cardName(card)}</p>
                          <p className="mt-1 text-muted">{action?.rule ?? 'Match a suit or number. All ranks are ordinary cards.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="mt-2 block pl-[4.25rem] sm:table-cell sm:py-4 sm:pl-4 sm:align-top" role="cell">
                      <p className="mb-1 text-xs text-muted sm:hidden" aria-hidden="true">Published reference</p>
                      <p className="font-semibold">{counterpart}</p>
                      {note && <p className="mt-1 text-muted">{note}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-ink/15 px-4 py-3 sm:px-5">
          <a className="ui-button text-accent" href={rulesPdf} target="_blank" rel="noopener noreferrer">
            Rules PDF <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a className="ui-button" href={licensePage} target="_blank" rel="noopener noreferrer">
            License <span className="sr-only">(opens GitHub in a new tab)</span>
          </a>
        </footer>
      </dialog>
    </div>
  );
}
