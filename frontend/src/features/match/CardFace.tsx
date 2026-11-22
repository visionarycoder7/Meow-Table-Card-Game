import { useId } from 'react';
import type { ActionName, Card, Suit } from '@meow-table/protocol';

export const suitNames: Record<Suit, string> = {
  PAW: 'Paws',
  BELL: 'Bells',
  NIP: 'Catnip',
  FISH: 'Fish',
};

export const SUIT_COLORS: Record<Suit, string> = {
  PAW: '#D72600',   // UNO Red
  BELL: '#F5B400',  // UNO Yellow
  NIP: '#2FA64F',   // UNO Green
  FISH: '#0B6FD1',  // UNO Blue
};

export const actionDetails: Record<ActionName, { name: string; faceLabel: string; corner: string; rule: string }> = {
  hiss: { name: 'Hiss (Skip)', faceLabel: 'Skip', corner: '⊘', rule: 'Skip the next seat.' },
  skip: { name: 'Skip', faceLabel: 'Skip', corner: '⊘', rule: 'Skip the next seat.' },
  'tail-spin': { name: 'Tail Spin (Reverse)', faceLabel: 'Reverse', corner: '⇄', rule: 'Reverse direction. At two seats, take another turn.' },
  rev: { name: 'Reverse', faceLabel: 'Reverse', corner: '⇄', rule: 'Reverse direction. At two seats, take another turn.' },
  'double-treat': { name: 'Double Treat (+2)', faceLabel: 'Draw two', corner: '+2', rule: 'The next seat draws two cards and skips its turn.' },
  d2: { name: 'Draw 2 (+2)', faceLabel: '+2', corner: '+2', rule: 'Adds +2 to the draw penalty stack.' },
  discard: { name: 'Discard All', faceLabel: 'Discard All', corner: '✕', rule: 'Discard all other cards of this color from your hand.' },
  d4: { name: 'Draw 4 (+4)', faceLabel: '+4', corner: '+4', rule: 'Adds +4 to the draw penalty stack.' },
  skipall: { name: 'Skip Everyone', faceLabel: 'Skip All', corner: '⊘⊘', rule: 'Everyone else is skipped. You take another turn immediately!' },
  'curious-cat': { name: 'Curious Cat (Wild)', faceLabel: 'Wild', corner: 'W', rule: 'Choose the next active suit.' },
  catnap: { name: 'Catnap (Wild +4)', faceLabel: 'Draw four', corner: '+4', rule: 'Choose a suit. The next seat draws four cards and skips its turn.' },
  pounce: { name: 'Pounce', faceLabel: 'Pounce', corner: '⚡', rule: 'Pick an opponent. They can draw two cards or give you one at random if they hold at least two.' },
  wrd4: { name: 'Wild Reverse Draw 4', faceLabel: '⇄+4', corner: '⇄+4', rule: 'Reverses turn direction and adds +4 to the draw penalty stack.' },
  wd6: { name: 'Wild Draw 6', faceLabel: '+6', corner: '+6', rule: 'Adds +6 to the draw penalty stack. Choose next color.' },
  wd10: { name: 'Wild Draw 10', faceLabel: '+10', corner: '+10', rule: 'Adds +10 to the draw penalty stack! Choose next color.' },
  roul: { name: 'Wild Color Roulette', faceLabel: 'Roulette', corner: '?', rule: 'Next player picks a color and draws cards until that color appears!' },
};

export function cardHtml(card: Card, extra = ''): string {
  const isWild = !card.suit;
  const suitColor = card.suit ? SUIT_COLORS[card.suit] : '#111111';
  const face = 'rank' in card ? String(card.rank) : actionDetails[card.action].corner;
  const isSm = face.length > 2;
  const sub = 'rank' in card
    ? card.rank === 7 ? '<em class="ic">⇄</em>' : card.rank === 0 ? '<em class="ic">↻</em>' : ''
    : '';
  return `<div class="card ${isWild ? 'w' : ''} ${isSm ? 'sm' : ''} ${extra}" style="--c:${suitColor}">
    <span class="k">${face}</span>
    <b>${face}</b>
    <span class="k r">${face}</span>
    ${sub}
  </div>`;
}

export function cardName(card: Card) {
  const suit = card.suit ? suitNames[card.suit] : '';
  if ('rank' in card) {
    if (card.rank === 7) return `${suit} 7 (Swap)`;
    if (card.rank === 0) return `${suit} 0 (Pass)`;
    return `${suit} ${card.rank}`;
  }
  return suit ? `${suit} ${actionDetails[card.action].name}` : actionDetails[card.action].name;
}

function SuitMiniIcon({ suit }: { suit: Suit }) {
  switch (suit) {
    case 'PAW':
      return (
        <g fill="currentColor">
          <ellipse cx="6" cy="7.5" rx="3.5" ry="2.5" />
          <circle cx="2.5" cy="4" r="1.1" />
          <circle cx="4.8" cy="2.5" r="1.1" />
          <circle cx="7.2" cy="2.5" r="1.1" />
          <circle cx="9.5" cy="4" r="1.1" />
        </g>
      );
    case 'BELL':
      return (
        <path d="M6 1.8a3 3 0 0 0-3 3v2.8l-1.5 2h9l-1.5-2V4.8a3 3 0 0 0-3-3Zm-1 9a1.2 1.2 0 0 0 2 0" fill="currentColor" />
      );
    case 'NIP':
      return (
        <path d="M2.5 9.5c5 .5 8.5-3 8-8-5.5-.5-8.5 3-8 8Zm0 0l5-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      );
    case 'FISH':
      return (
        <path d="M1.5 6c2-3 5-3.5 7.5-.5l2.5-2.5v6L9 6.5C6.5 9.5 3.5 9 1.5 6Z" fill="currentColor" />
      );
  }
}

function CardCorner({
  corner,
  suit,
  subType,
}: {
  corner: string;
  suit: Suit | null;
  subType: 'swap' | 'pass' | 'd2' | 'd4' | 'suit' | 'wild' | 'pounce';
}) {
  const isSkip = corner === '⊘';
  const isReverse = corner === '⇄';
  const isPounce = corner === '⚡';

  return (
    <g>
      {isSkip ? (
        <g transform="translate(0, -3)">
          <circle cx="0" cy="0" r="5.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
          <line x1="-3.8" y1="-3.8" x2="3.8" y2="3.8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ) : isReverse ? (
        <g transform="translate(0, -3)" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 -2.5 C4 -6 -2 -6 -4.5 -4.5" />
          <polygon points="-6.5,-6.5 -3.5,-3.5 -5,-2" fill="#FFFFFF" strokeWidth="0.5" />
          <path d="M-4 2.5 C-4 6 2 6 4.5 4.5" />
          <polygon points="6.5,6.5 3.5,3.5 5,2" fill="#FFFFFF" strokeWidth="0.5" />
        </g>
      ) : isPounce ? (
        <path d="M1 -7 L-4 -1 L0 0 L-2 7 L4 1 L0 0 Z" fill="#FFD23F" stroke="#000000" strokeWidth="0.8" />
      ) : (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill="#FFFFFF"
          fontStyle="italic"
          fontWeight="900"
          fontSize={corner.length > 1 ? '12.5' : '15'}
          fontFamily="'Arial Black', Impact, 'Segoe UI Black', sans-serif"
          stroke="#000000"
          strokeWidth="0.8"
          paintOrder="stroke fill"
        >
          {corner}
        </text>
      )}

      {/* Sub-icon indicator exactly matching UNO Show 'Em No Mercy */}
      {subType === 'swap' && (
        <g stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M-4.5 4.5 h8 m-2 -2 l2 2 -2 2" />
          <path d="M4.5 8.5 h-8 m2 -2 l-2 2 2 2" />
        </g>
      )}

      {subType === 'pass' && (
        <g stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <path d="M-3 5 A3.5 3.5 0 1 1 -3 8 M-4.5 5 L-3 5 L-3 6.5" />
        </g>
      )}

      {subType === 'd2' && (
        <g transform="translate(0, 7)">
          <rect x="-4.5" y="-3.5" width="5.5" height="7.5" rx="1" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" transform="rotate(-10)" />
          <rect x="-1" y="-3.5" width="5.5" height="7.5" rx="1" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" transform="rotate(10)" />
        </g>
      )}

      {subType === 'd4' && (
        <g transform="translate(0, 7)">
          <rect x="-6" y="-3.5" width="4.5" height="7" rx="0.8" fill="#D72600" stroke="#FFFFFF" strokeWidth="0.5" transform="rotate(-18)" />
          <rect x="-3" y="-4" width="4.5" height="7" rx="0.8" fill="#0B6FD1" stroke="#FFFFFF" strokeWidth="0.5" transform="rotate(-6)" />
          <rect x="0" y="-4" width="4.5" height="7" rx="0.8" fill="#F5B400" stroke="#FFFFFF" strokeWidth="0.5" transform="rotate(6)" />
          <rect x="2.5" y="-3.5" width="4.5" height="7" rx="0.8" fill="#2FA64F" stroke="#FFFFFF" strokeWidth="0.5" transform="rotate(18)" />
        </g>
      )}

      {subType === 'suit' && suit && (
        <g transform="translate(-6, 2) scale(1)" color="#FFFFFF">
          <SuitMiniIcon suit={suit} />
        </g>
      )}

      {subType === 'wild' && (
        <g transform="translate(0, 6)">
          <polygon points="0,-4 3.5,0 0,4 -3.5,0" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
          <polygon points="0,-3.5 -3,0 0,0" fill="#D72600" />
          <polygon points="0,-3.5 3,0 0,0" fill="#0B6FD1" />
          <polygon points="0,3.5 3,0 0,0" fill="#F5B400" />
          <polygon points="0,3.5 -3,0 0,0" fill="#2FA64F" />
        </g>
      )}
    </g>
  );
}

export function CardFace({ card }: { card: Card }) {
  const clipId = useId();
  const shadowId = useId();
  const action = 'action' in card ? actionDetails[card.action] : null;
  const isWild = !card.suit;
  const suitColor = card.suit ? SUIT_COLORS[card.suit] : '#111111';
  const corner = 'rank' in card ? String(card.rank) : (action?.corner ?? '');
  const subType: 'swap' | 'pass' | 'd2' | 'd4' | 'suit' | 'wild' | 'pounce' =
    'rank' in card
      ? card.rank === 7
        ? 'swap'
        : card.rank === 0
          ? 'pass'
          : 'suit'
      : isWild
        ? card.action === 'catnap' || card.action === 'wrd4'
          ? 'd4'
          : card.action === 'pounce'
            ? 'pounce'
            : 'wild'
        : card.action === 'double-treat' || card.action === 'd2'
          ? 'd2'
          : card.action === 'd4'
            ? 'd4'
            : 'suit';

  const bottomLabel = action ? action.faceLabel.toUpperCase() : card.suit ? suitNames[card.suit].toUpperCase() : '';

  return (
    <span
      className="card-face"
      data-suit={card.suit ?? 'wild'}
      data-action={action ? '' : undefined}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 140"
        className="card-face-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.32" />
          </filter>
          {isWild && (
            <clipPath id={clipId}>
              <ellipse cx="50" cy="70" rx="36" ry="52" transform="rotate(-24 50 70)" />
            </clipPath>
          )}
        </defs>

        {/* Outer Card: Signature black border & sleek rounded corners of UNO No Mercy */}
        <rect x="1" y="1" width="98" height="138" rx="8" fill="#111111" stroke="#000000" strokeWidth="2" />
        <rect
          x="3.5"
          y="3.5"
          width="93"
          height="133"
          rx="6"
          fill={suitColor}
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Central Slanted Oval (The hallmark of UNO cards) */}
        {!isWild ? (
          <>
            <ellipse
              cx="50"
              cy="70"
              rx="36"
              ry="52"
              transform="rotate(-24 50 70)"
              fill="#FFFFFF"
              filter={`url(#${shadowId})`}
            />
            <ellipse
              cx="50"
              cy="70"
              rx="35"
              ry="51"
              transform="rotate(-24 50 70)"
              fill="none"
              stroke="#F0EDE6"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <g clipPath={`url(#${clipId})`} filter={`url(#${shadowId})`}>
            <g transform="rotate(-24 50 70)">
              <rect x="0" y="0" width="50" height="70" fill="#D72600" />
              <rect x="50" y="0" width="50" height="70" fill="#0B6FD1" />
              <rect x="50" y="70" width="50" height="70" fill="#F5B400" />
              <rect x="0" y="70" width="50" height="70" fill="#2FA64F" />
              <line x1="50" y1="0" x2="50" y2="140" stroke="#111111" strokeWidth="2.5" />
              <line x1="0" y1="70" x2="100" y2="70" stroke="#111111" strokeWidth="2.5" />
            </g>
            <ellipse
              cx="50"
              cy="70"
              rx="36"
              ry="52"
              transform="rotate(-24 50 70)"
              fill="none"
              stroke="#111111"
              strokeWidth="3.5"
            />
          </g>
        )}

        {/* Center Artwork / Symbol */}
        {'rank' in card && (
          <g>
            {card.rank === 7 ? (
              <>
                <text
                  x="50"
                  y="81"
                  textAnchor="middle"
                  fill={suitColor}
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="44"
                  fontFamily="'Arial Black', Impact, 'Segoe UI Black', sans-serif"
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                  paintOrder="stroke fill"
                  filter={`url(#${shadowId})`}
                >
                  7
                </text>
                <g
                  transform="translate(50, 93) scale(1.3)"
                  stroke={suitColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                >
                  <path d="M-9 -2.5 h17 m-3.5 -3.5 l3.5 3.5 -3.5 3.5" />
                  <path d="M9 3.5 h-17 m3.5 -3.5 l-3.5 3.5 3.5 3.5" />
                </g>
              </>
            ) : card.rank === 0 ? (
              <>
                <text
                  x="50"
                  y="85"
                  textAnchor="middle"
                  fill={suitColor}
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="44"
                  fontFamily="'Arial Black', Impact, 'Segoe UI Black', sans-serif"
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                  paintOrder="stroke fill"
                  filter={`url(#${shadowId})`}
                >
                  0
                </text>
                <g
                  transform="translate(50, 71) scale(1.5)"
                  stroke={suitColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                >
                  <path d="M-10 -7 A12 12 0 1 1 -10 7 M-13 -7 L-10 -7 L-10 -4" />
                </g>
              </>
            ) : (
              <text
                x="50"
                y="86"
                textAnchor="middle"
                fill={suitColor}
                fontStyle="italic"
                fontWeight="900"
                fontSize="48"
                fontFamily="'Arial Black', Impact, 'Segoe UI Black', sans-serif"
                stroke="#000000"
                strokeWidth="1.2"
                strokeOpacity="0.35"
                paintOrder="stroke fill"
                filter={`url(#${shadowId})`}
              >
                {card.rank}
              </text>
            )}
          </g>
        )}

        {'action' in card && (
          <g>
            {(card.action === 'hiss' || card.action === 'skip') && (
              <g transform="translate(50, 70) rotate(-24)">
                <circle
                  cx="0"
                  cy="0"
                  r="22"
                  fill="none"
                  stroke={suitColor}
                  strokeWidth="6.5"
                  filter={`url(#${shadowId})`}
                />
                <line
                  x1="-15.5"
                  y1="-15.5"
                  x2="15.5"
                  y2="15.5"
                  stroke={suitColor}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
              </g>
            )}

            {(card.action === 'tail-spin' || card.action === 'rev') && (
              <g
                transform="translate(50, 70) rotate(-24)"
                fill={suitColor}
                stroke={suitColor}
                filter={`url(#${shadowId})`}
              >
                <path d="M15 -7 C15 -19 -4 -19 -14 -9" fill="none" strokeWidth="6.5" strokeLinecap="round" />
                <polygon points="-18,-14 -8,-4 -19,-3" strokeWidth="1" />
                <path d="M-15 7 C-15 19 4 19 14 9" fill="none" strokeWidth="6.5" strokeLinecap="round" />
                <polygon points="18,14 8,4 19,3" strokeWidth="1" />
              </g>
            )}

            {(card.action === 'double-treat' || card.action === 'd2') && (
              <g transform="translate(50, 68)">
                <rect
                  x="-24"
                  y="-28"
                  width="24"
                  height="36"
                  rx="4"
                  transform="rotate(-15)"
                  fill={suitColor}
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  filter={`url(#${shadowId})`}
                />
                <rect
                  x="-2"
                  y="-24"
                  width="24"
                  height="36"
                  rx="4"
                  transform="rotate(14)"
                  fill={suitColor}
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  filter={`url(#${shadowId})`}
                />
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill={suitColor}
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="34"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  filter={`url(#${shadowId})`}
                >
                  +2
                </text>
              </g>
            )}

            {card.action === 'discard' && (
              <g transform="translate(50, 70)">
                <line x1="-20" y1="-20" x2="20" y2="20" stroke={suitColor} strokeWidth="8" strokeLinecap="round" filter={`url(#${shadowId})`} />
                <line x1="20" y1="-20" x2="-20" y2="20" stroke={suitColor} strokeWidth="8" strokeLinecap="round" filter={`url(#${shadowId})`} />
              </g>
            )}

            {card.action === 'skipall' && (
              <g transform="translate(50, 70) rotate(-24)">
                <g transform="translate(-13, 0)">
                  <circle cx="0" cy="0" r="14" fill="none" stroke={suitColor} strokeWidth="4.5" filter={`url(#${shadowId})`} />
                  <line x1="-9" y1="-9" x2="9" y2="9" stroke={suitColor} strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g transform="translate(13, 0)">
                  <circle cx="0" cy="0" r="14" fill="none" stroke={suitColor} strokeWidth="4.5" filter={`url(#${shadowId})`} />
                  <line x1="-9" y1="-9" x2="9" y2="9" stroke={suitColor} strokeWidth="4.5" strokeLinecap="round" />
                </g>
              </g>
            )}

            {card.action === 'curious-cat' && (
              <g transform="translate(50, 70)">
                <path d="M-10 -14 L-15 -25 L-4 -20 L4 -20 L15 -25 L10 -14 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                <text
                  x="0"
                  y="8"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="24"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="3.2"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  WILD
                </text>
              </g>
            )}

            {(card.action === 'catnap' || card.action === 'd4') && (
              <g transform="translate(50, 64)">
                <rect
                  x="-28"
                  y="-22"
                  width="20"
                  height="32"
                  rx="3"
                  transform="rotate(-25)"
                  fill="#D72600"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
                <rect
                  x="-16"
                  y="-25"
                  width="20"
                  height="32"
                  rx="3"
                  transform="rotate(-9)"
                  fill="#0B6FD1"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
                <rect
                  x="-4"
                  y="-25"
                  width="20"
                  height="32"
                  rx="3"
                  transform="rotate(9)"
                  fill="#F5B400"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
                <rect
                  x="8"
                  y="-22"
                  width="20"
                  height="32"
                  rx="3"
                  transform="rotate(25)"
                  fill="#2FA64F"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
                <text
                  x="0"
                  y="28"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="38"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  +4
                </text>
              </g>
            )}

            {card.action === 'wrd4' && (
              <g transform="translate(50, 68)">
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="34"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  ⇄+4
                </text>
              </g>
            )}

            {card.action === 'wd6' && (
              <g transform="translate(50, 72)">
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="44"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  +6
                </text>
              </g>
            )}

            {card.action === 'wd10' && (
              <g transform="translate(50, 72)">
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="40"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  +10
                </text>
              </g>
            )}

            {card.action === 'roul' && (
              <g transform="translate(50, 76)">
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="56"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  ?
                </text>
              </g>
            )}

            {card.action === 'pounce' && (
              <g transform="translate(50, 68)">
                <path
                  d="M-22 -18 L-8 2 M-14 -22 L0 -2 M-6 -25 L8 -6 M2 -22 L16 -3"
                  stroke="#D72600"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text
                  x="0"
                  y="10"
                  textAnchor="middle"
                  fill="#FFD23F"
                  fontStyle="italic"
                  fontWeight="900"
                  fontSize="19"
                  fontFamily="'Arial Black', Impact, sans-serif"
                  stroke="#000000"
                  strokeWidth="3"
                  paintOrder="stroke fill"
                  filter="drop-shadow(2px 3px 0 #000000)"
                >
                  POUNCE
                </text>
                <rect x="-24" y="16" width="48" height="15" rx="4" fill="#D72600" stroke="#FFD23F" strokeWidth="1" />
                <text
                  x="0"
                  y="27"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontWeight="900"
                  fontSize="10"
                  fontFamily="'Arial Black', sans-serif"
                >
                  +2 / ⇄
                </text>
              </g>
            )}
          </g>
        )}

        {/* Top-Left Corner Index (Legible when fanned in hand) */}
        <g transform="translate(10, 18)">
          <CardCorner corner={corner} suit={card.suit ?? null} subType={subType} />
        </g>

        {/* Bottom-Right Corner Index (Rotated 180° - authentic symmetrical UNO layout) */}
        <g transform="rotate(180 90 122)">
          <CardCorner corner={corner} suit={card.suit ?? null} subType={subType} />
        </g>

        {/* Bottom Label (crisp, subtle text for clarity and accessibility) */}
        {bottomLabel && (
          <text
            x="50"
            y="132"
            textAnchor="middle"
            fill="#FFFFFF"
            opacity="0.9"
            fontSize="6.5"
            fontWeight="800"
            letterSpacing="0.8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {bottomLabel}
          </text>
        )}
      </svg>
    </span>
  );
}
