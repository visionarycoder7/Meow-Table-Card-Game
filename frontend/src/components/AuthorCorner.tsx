import { useState } from 'react';

const instagramUrl = 'https://www.instagram.com/sohan_ghosh7?evlk=cmZxam5udDQ3Ym1i';
const githubUrl = 'https://github.com/visionarycoder7';
const linkedinUrl = 'https://www.linkedin.com/search/results/all/?keywords=Sohan%20Ghosh';

export function AuthorCorner() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      aria-label="Creator Profile"
      className="fixed bottom-3 right-3 z-40 max-w-[calc(100vw-1.5rem)] text-xs text-ink transition-all duration-200 sm:bottom-4 sm:right-4"
    >
      {open ? (
        <div className="relative flex flex-col gap-2.5 rounded-2xl border border-amber-400/30 bg-[#0e1a14]/95 p-3.5 shadow-2xl backdrop-blur-md sm:max-w-xs">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimize creator info"
            className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-white/10 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 pr-5">
            <img
              src="/author.jpg"
              alt="Sohan Ghosh"
              width={46}
              height={46}
              className="h-11 w-11 shrink-0 rounded-full border-2 border-amber-400 object-cover shadow-md"
            />
            <div>
              <p className="font-semibold text-white">Sohan Ghosh</p>
              <p className="text-[11px] text-muted">Creator of Meow Table</p>
            </div>
          </div>

          <p className="text-[12px] italic leading-snug text-neutral-200">
            &ldquo;You&rsquo;ve played my game. Might as well know who&rsquo;s behind it.&rdquo;
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 font-medium">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-pink-400 hover:bg-white/10 hover:text-pink-300 transition-colors"
            >
              <span>Instagram</span>
            </a>
            <span className="text-muted" aria-hidden="true">&middot;</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-amber-300 hover:bg-white/10 hover:text-amber-200 transition-colors"
            >
              <span>GitHub</span>
            </a>
            <span className="text-muted" aria-hidden="true">&middot;</span>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-sky-400 hover:bg-white/10 hover:text-sky-300 transition-colors"
            >
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Creator Profile: Sohan Ghosh"
          aria-label="View Creator Profile"
          className="group flex items-center gap-2 rounded-full border border-amber-400/40 bg-[#0e1a14]/95 p-1.5 pr-3 shadow-xl backdrop-blur-md hover:scale-105 hover:border-amber-400 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <img
            src="/author.jpg"
            alt="Sohan Ghosh"
            width={34}
            height={34}
            className="h-8 w-8 rounded-full border border-amber-400 object-cover"
          />
          <span className="text-xs font-semibold text-amber-300 group-hover:text-amber-200">
            Creator
          </span>
        </button>
      )}
    </aside>
  );
}
