export function DeckMark() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-32 w-48 rounded-[50%] border border-felt bg-felt/20">
      <span className="absolute left-10 top-5 h-20 w-14 -rotate-16 rounded-lg border border-ink/25 bg-felt" />
      <span className="absolute right-10 top-5 h-20 w-14 rotate-16 rounded-lg border border-ink/25 bg-felt" />
      <span className="absolute left-1/2 top-4 grid h-20 w-14 -translate-x-1/2 place-items-center rounded-lg border border-accent/70 bg-surface">
        <span className="size-4 rotate-45 rounded-[3px] bg-accent" />
      </span>
    </div>
  );
}
