# Component-first frontend playbook

Use this file as a standalone brief for building or refining a web interface. It gives the agent a workflow, design defaults, Tailwind CSS v4 guidance, and a checklist for reviewing the result. The project brief supplies the product, audience, brand, and scope.

## Start with the task

State the surface, who uses it, and the action they should be able to complete. Include the existing screen or files, primary and secondary actions, supported browsers or devices, behavior to preserve, and what counts as done. Inspect the current app, components, theme, and build before changing them. For an existing project, first identify the colors, layout, typography, and interactions worth carrying forward.

Choose one visual anchor that belongs to the product, such as the table and cards in a card game or the chart in a reporting tool. Keep the controls around it quiet. Use realistic content and cover long names, large lists, missing data, loading, errors, and permissions where relevant. When a brief delegates a judgment call, use a reversible choice and report it.

## Skills to use

| Skill | When to apply it |
| --- | --- |
| **Impeccable** | Shape a new surface or refine an existing one. Review rendered UI at the sizes it ships at. |
| **Unslop** | Run a focused critique of spacing, hierarchy, icon consistency, copy, and decorative effects. Keep the product’s recognizable details. |
| **Tailwind 4 Docs** | Verify setup, tokens, utilities, source scanning, and variants against the installed major version. Use the official online docs when an offline snapshot is unavailable. |
| **React best practices** | Apply to React work. Review component ownership, derived state, rendering, and bundle implications. |
| **Adapt** | Use when a component must work in narrow layouts, on touch screens, or in multiple containers. |
| **Animate** or **Emil Design Engineering** (`emil-design-eng`) | Use when motion communicates feedback, origin, direction, or continuity. |
| **Typeset** or **Audit** | Use for typography-heavy or accessibility-sensitive work. Check keyboard behavior, contrast, focus, zoom, and reduced motion directly. |

Read the current instructions for skills available in the session. Apply the smallest set that covers the assignment. Skill names and automation features vary by environment, so carry the acceptance checks in this file into the task itself.

## Build the components first

1. **List the components and their states.** Start with existing primitives such as buttons, fields, and dialogs. Define feature-specific pieces such as a card, player seat, or invite control next. Cover default, focus, pressed, disabled, loading, empty, error, and selected states where they apply.
2. **Give each piece a clear interface.** Use inputs and callbacks so visual components can render with sample data. Keep feature components near the feature and promote genuine cross-feature reuse into a shared directory. Keep network calls and server-owned business rules outside visual components.
3. **Compose screens from the pieces.** Check the primary task path and recovery paths with realistic data. Make the active control or next action obvious in every state. Use semantic HTML and a labeled native control where one fits.
4. **Review context.** Check components in their real layout as well as by themselves. Give icon-only controls accessible names. Use a consistent icon family and plain labels. Keep emoji out of product-authored UI by default and show important status with text or symbols alongside color.

## Tailwind CSS v4

- **Integration.** In a Vite project, install matching v4 versions of `tailwindcss` and `@tailwindcss/vite`, register the Vite plugin alongside the framework plugin, and use `@import "tailwindcss";` in the app’s CSS entry. Follow the framework-specific installation guide if the project uses another build tool. Keep the lockfile and check the compatibility page against the actual browser support target, including mobile WebViews where relevant. [Vite setup](https://tailwindcss.com/docs/installation/using-vite) · [Compatibility](https://tailwindcss.com/docs/compatibility) · [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- **Tokens.** Declare top-level `@theme` values when they should produce utilities. Use plain CSS variables in `:root` or theme selectors for runtime values, and use `@theme inline` when exposing an alias to those variables as utilities. Name tokens by role, such as surface, ink, accent, and focus. Preserve the project palette and check the contrast of actual foreground/background pairs. [Theme variables](https://tailwindcss.com/docs/theme) · [Dark mode](https://tailwindcss.com/docs/dark-mode)
- **Class detection.** Write whole class names or map variants to complete literal strings, such as `{ success: "text-green-700", error: "text-red-700" }`. For a truly dynamic value, pass a CSS variable and keep the utility literal. In monorepos, check the scanner’s base path and use `source()` or `@source` where needed. Validate a production build so omitted classes are caught. [Class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- **Layout and states.** Set the narrow layout in unprefixed utilities, then add viewport variants for screens and container queries for reusable components whose width depends on the parent. Pair hover with keyboard and touch behavior. Use `focus-visible:`, `disabled:`, semantic ARIA or data states, and `motion-safe:` or `motion-reduce:` as appropriate. [Responsive design](https://tailwindcss.com/docs/responsive-design) · [State variants](https://tailwindcss.com/docs/hover-focus-and-other-states)
- **CSS boundaries.** Compose with utilities first. Use component-local CSS for distinctive geometry, complex selectors, and keyframes. Add `@utility` for a recurring low-level pattern and reserve `@apply` for cases such as styling markup you cannot change. Check Preflight’s effect on native controls, embedded content, and existing pages during migration. [Custom styles](https://tailwindcss.com/docs/adding-custom-styles) · [Preflight](https://tailwindcss.com/docs/preflight)

For a runtime palette, a small token pattern could look like this. Replace the values and naming with the project’s roles.

```css
@import "tailwindcss";

:root {
  --ui-surface: #f8f7f4;
  --ui-ink: #222321;
}

@theme inline {
  --color-surface: var(--ui-surface);
  --color-ink: var(--ui-ink);
}
```

Components can now use `bg-surface text-ink`. If a dark theme is in scope, override the underlying `--ui-*` values under its theme selector. Change themes without animating the entire page. Set the initial theme before first paint when needed and test refresh to check for a flash.

## Layout, type, and visual detail

The supplied screenshot references are inspiration. Use a technique when it fixes a concrete issue in the current interface.

| Technique | Where it helps |
| --- | --- |
| **Spacing and concentric radii** | Use the spacing scale to show grouping. For evenly inset rounded surfaces, start with an inner radius equal to the outer radius minus the inset, then check the corners visually. |
| **Alpha borders and dark-mode depth** | Use subtle translucent dividers for separation and surface tones for elevation. Check the composited contrast. Use a clearly visible boundary for focus and interactive controls. |
| **OKLCH palettes and gradients** | Use perceptual color adjustments when building related colors. Check the actual result in target browsers and color gamuts. Reserve a gradient for a deliberate visual element, then test contrast across it. |
| **Matched icon weight and masked edges** | Keep optical size and stroke consistent. A fade can hint at more content in a scroll region. Keep interactive edges, focus rings, and the last reachable item visible. |
| **Blend modes** | Use multiply or another blend mode on decorative imagery only where the treatment benefits from it. Test both themes and provide a readable fallback. |
| **Dynamic viewport** | Use a dynamic viewport size when a full-height panel needs to track browser chrome. Prefer a minimum height where content can grow. Test the mobile address bar, safe areas, and the on-screen keyboard. |
| **Fluid type** | Use a bounded `clamp()` with a rem-based minimum and maximum for prominent headings. Keep body and control text stable unless fluid sizing solves a real layout issue. Verify zoom and wrapping. |
| **Reserved width and tabular figures** | Prevent active labels from jumping when weight changes. Keep the weight stable or reserve the widest state. Use tabular numerals for timers, scores, or counters that visibly shift. |
| **Text trim, underline offset, and superscripts** | Use underline offset for legible links and semantic superscripts for references or exponents. Treat `text-box-trim` as progressive enhancement for optical alignment. Test multiple fonts and scripts with the rule both enabled and disabled. [Browser support](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim) |

## Motion

Tie each motion to an action or state change. Use opacity and transforms for most movement, with layout animations reserved for cases that need them. Update functional state when it is known, independent of whether an animation finishes. Give reduced-motion users the same information through an immediate update or a brief non-spatial transition.

| Situation | Starting point |
| --- | --- |
| **Press feedback** | Use a short pressed state. A scale around 0.97 can suit a button that benefits from a tactile cue. Keep the hit area and focus indicator stable. |
| **Menus, popovers, and tooltips** | Start with a short ease-out entrance and a slightly faster exit. Around 150–250 ms can be a useful menu starting point. Use the trigger as the origin when placement is clear. Delay the first tooltip and shorten subsequent delays within the same group. Restore focus when an interactive popup closes. |
| **Directional or shared movement** | Match the direction to the action. For an object moving between positions, consider a short arc or shared-element transition. An existing Motion setup can use a stable `layoutId` for the same logical item. Keep layout IDs scoped and confirm rapid interruptions behave correctly. [Motion layout animations](https://motion.dev/docs/react-layout-animations) |
| **State changes and feedback** | Prefer stable text and visible status. Use a brief crossfade for icon swaps, with blur or masking only when it improves legibility or continuity. An optional single pulse can acknowledge success. Report errors inline and move focus when helpful. A shake is optional and should disappear in reduced motion. |
| **Expanding content** | Use a disclosure that opens immediately as the fallback. Where browser support and performance justify it, animate between a fixed and intrinsic size with scoped `interpolate-size`, or use a measured transition with interruption handling. [Intrinsic size interpolation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size) |
| **Choreography** | Ease in and out when moving between stable positions. Use a small stagger for a short sequence only if it helps the eye follow it. Overlap old and new visuals when it preserves context, and keep hidden controls out of the focus order. |
| **Direct manipulation** | Track the pointer directly while held. Velocity-sensitive springs, elastic bounds, or a slight stretch can suit drag and release interactions. Keep ordinary buttons and menus restrained. Verify touch cancellation, keyboard alternatives, and reduced motion. |

Use CSS transitions for simple feedback. Reach for a motion library when shared layout, interruption, or gesture physics genuinely needs it. Review rapid clicks, interruptions, and multiple animated items on a representative phone.

## Verify and hand off

- Run the project’s build and relevant tests. Open the rendered UI on a narrow phone and a desktop. Check long content, scroll behavior, and the least common states as well as the normal path.
- Navigate with a keyboard, verify focus order and visibility, and test contrast, zoom, reduced motion, and touch targets. Keep critical feedback readable without color or motion. Use the current accessibility requirements for the project. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Check that interaction works without waiting on effects and that the production build includes the intended utility styles. Verify any newer CSS against the target browsers and keep a working fallback.
- Report the component boundaries, visual choices, checks actually run, and any remaining browser or behavior gaps. For a later project, reread the official docs for the installed versions before reusing syntax or timings.
