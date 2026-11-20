import { DeckMark } from './DeckMark';

export function App() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-12">
      <section className="w-full max-w-sm text-center" aria-labelledby="app-title">
        <DeckMark />
        <h1 id="app-title" className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
          Meow Table
        </h1>
        <p className="mt-3 text-base text-muted">A card table for friends. Private rooms are coming next.</p>
      </section>
    </main>
  );
}
