export function DeckMark() {
  return (
    <svg viewBox="0 0 64 64" width={144} height={144} className="deck-mark mx-auto size-36" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0e1a14" />
      <rect x="12" y="19" width="27" height="34" rx="5" fill="#2d7048" transform="rotate(-17 25.5 36)" />
      <path d="M23 16a2 2 0 0 1 3.2-1.6L33 20h7l6.8-5.6A2 2 0 0 1 50 16v29a5 5 0 0 1-5 5H28a5 5 0 0 1-5-5z" fill="#ffd23f" />
      <g fill="#0e1a14">
        <rect className="deck-mark-eye" x="30" y="31" width="4" height="5" />
        <rect className="deck-mark-eye" x="39" y="31" width="4" height="5" />
      </g>
    </svg>
  );
}
