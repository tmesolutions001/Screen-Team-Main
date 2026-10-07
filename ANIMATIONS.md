# Animation approach

How motion works in the Screen Team App: the philosophy behind it, the house style, and the
techniques that keep every animation interruptible, reversible and smooth. Read this before adding
or changing anything that moves.

## The standard

> All transitions, element movements and actions must be ultra-clean, interruptible and fully
> reversible. If a user changes state mid-animation, it must seamlessly reverse without lag,
> blocking or jank. Use spring physics for state-driven animations.

Every rule below serves that sentence. In practice it means three promises to the operator:

1. **Never wait.** No click, keypress or navigation is ever queued behind an animation. Input
   always lands immediately; motion catches up.
2. **Never snap.** Changing your mind mid-animation continues from exactly where the element is,
   at the speed it was moving. Nothing restarts from zero, nothing jumps.
3. **Never distract.** Motion is subtle and short. It explains a change (where something came from,
   what just happened) and then gets out of the way. These tools are used live, in the booth.

## Philosophy

**State drives motion, not the other way round.** Components declare *what state they are in*
(`open`, `editing`, `correct`); the animation library works out how to get there from wherever the
element currently is. We never script "play animation A, then B". That is what makes everything
reversible for free: reversing is just declaring the previous state again.

**Springs for state, tweens only for time.** Springs carry velocity, so retargeting mid-flight
blends naturally. Tweens are reserved for things that are genuinely about time or that must not
overshoot (see *When a tween is right*).

**Subtle beats flashy.** Small distances (4 to 12px), short durations (about 150 to 350ms of
visible movement), soft blur rather than big slides. If you notice the animation more than the
content, it's too much.

**One vocabulary.** The same few motions recur everywhere, so the app feels like one thing:
text *resolves* out of a blur, panels *settle* in with a slight scale, lists *grow* into place,
feedback *glows* and fades. A new feature should reuse these, not invent a sixth.

**Never block the main thread or the user.** Prefer compositor-only properties (opacity,
transform), update hot paths without React re-renders, and clean up after every effect.

## The building blocks

All shared motion lives in `src/lib/motion.ts`. Use these presets instead of inline numbers.

### Springs

| Preset | Feel | Used for |
|---|---|---|
| `springs.snappy` (stiffness 520, damping 36, mass 0.8) | Fast, no visible overshoot | Presses, carets, pills, switches, small UI |
| `springs.smooth` (stiffness 260, damping 30) | Calm settle | Panels, pages, popovers, rows |
| `springs.gentle` (stiffness 140, damping 22) | Slow, soft | Large or decorative movement |

### Shared variants and props

- **`pageVariants`**: page transitions. Opacity, scale (0.985 to 1) and an 8px rise. *No filter*,
  because a filter on a page wrapper would become a backdrop root and cut the glass panels inside
  it off from the background they blur.
- **`swapVariants` / `swapProps`**: content replaced in place (score, then results panel).
- **`staggerContainer` / `staggerItem`**: menus and tiles cascade in, inheriting the page's
  `enter` label so no extra orchestration is needed.
- **`blurText`**: the signature motion. Text resolves from `blur(8px)`, 4px low and transparent,
  into focus. Used by simulator answer letters, Warm Up titles and countdown digits, the toast
  message, the "No Title Detected!" heading and the Edit/Copy icon swaps. Its exit is the mirror
  image.
- **`rowReveal`**: list rows that *grow* into place (height from 0 on an overdamped spring, plus
  blur and rise), so the container and everything below glide down instead of jumping.

## Techniques for interruptible, reversible motion

### 1. Animate between states; don't mount and unmount mid-flight

When something can be toggled quickly, keep it mounted and animate between two named states.

- **Issue popover** (`IssueButton`): one element that animates between `open` and `closed`
  variants. Clicking again mid-open reverses the same springs from where they are. After it
  finishes closing it is hidden (`visibility: hidden`, `aria-hidden`), not removed.
- **Language pill** (`LanguageToggle`): its label cross-fades between "English" and "Español"
  in place, so rapid switching reverses the swap instead of restarting it.
- **Edit/Save** (`SongFormatter`): the label and icon swap through `AnimatePresence` with
  `blurText`, so a second click mid-swap reverses it smoothly.

### 2. Never queue; retarget or layer

Two strategies, depending on what the effect means:

- **Retarget** for state: a spring heading somewhere new just changes destination (popovers, page
  transitions, the caret gliding to the end of the text).
- **Layer** for events: each event gets its own short-lived element, so overlapping events overlap
  visually instead of waiting. The Edit/Save **sparkle-grain wave** mounts one wave per click (the
  last six are kept) and each removes itself on `animationend`. Spam-clicking produces a cascade
  of overlapping waves, never a stutter. The same `GrainWaves` component powers the simulator's
  language pill, sweeping the whole page (purple for English, green for Español); its state is
  read from the settings store at the moment of the click, so spam-switching never desyncs.
- **Cross-fade text in place** when its value changes (a language switch): `SwapText` puts the old
  and new text in one grid cell and blurs between them, so switching again mid-swap retargets.

### 3. Replace, don't stack, for feedback flashes

Answer feedback (the green or red glow on the HUD score and the ring on the answer field) is
pre-rendered and animated with `useAnimate`. Starting a new animation on an element replaces the
running one, so back-to-back answers retrigger cleanly instead of piling up. Only opacity animates,
so the work stays on the compositor.

### 4. Keep the source of truth outside the animation

The animation shows state; it never *is* the state.

- **Edit/Save** flips a ref synchronously on every click (`editingRef`), then sets React state.
  Ten clicks in one frame still leave the label, `aria-pressed`, the read-only lock and the wave
  colour in agreement.
- **Toast**: a `setTimeout` decides when it closes; the draining SVG ring is a picture of that
  timer. The callback is kept in a ref, so a parent re-render (typing in the page) never restarts
  the countdown.
- **Warm Up**: the whole segment sequence (switch sound, title, gap, 3-2-1, play) is a schedule of
  absolute timestamps (`game/warmup.ts`). Each cue fires once, on entering its phase. If the page
  starts leaving and the user reverses that, the round resumes against the same schedule without
  replaying cues.

### 5. Key carefully so only new things animate

- **Answer letters** are keyed by index and character, so appending mounts only the new letter.
  Deleting is instant: rapid typing and submits never wait for an exit.
- **Formatted output while editing** (`EditableOutput`) diffs the old and new text. The unchanged
  start and end keep their glyph identities, so only the characters you just typed mount and blur
  in. A glyph only counts as "new" for about 300ms, so a line that re-mounts later never replays
  its animation.
- **Rounds and results pages** are keyed per navigation, not per path. Re-entering a round while
  the old one is still animating out mounts a fresh round instead of reviving the old one.

### 6. Pages cross-fade; they never queue

`AnimatePresence mode="popLayout"` lifts the outgoing page out of flow so the incoming one mounts
immediately. Navigating again mid-transition just retargets the springs. While a round's page is
leaving, its clock and speech stop at once (`useIsPresent`), and they resume if the exit is reversed.

## When a tween is right

Springs are the default. A tween (fixed duration and easing) is correct when:

- **The value must not overshoot.** Blur radius and opacity in `blurText` and `rowReveal` are short
  tweens, because a spring can overshoot into a negative blur. The movement on the same element
  stays sprung.
- **The animation is literally about time.** The toast's ring drains *linearly* over exactly the
  toast's duration (5s for the Song Formatter reminder), so it empties on the deadline.
- **It's a one-shot CSS effect on mount.** Typed glyphs in the editable output and the grain wave
  are CSS keyframes. They are fire-and-forget, cost no JavaScript per frame, and overlap freely.
- **It's a count.** The end-of-round score counts up with a 0.9s ease-out on a motion value.

## Style details

- **Blur-in is the signature.** Text appears by resolving from a soft blur and a small rise, never
  by sliding across the screen.
- **Small distances.** Rises of 4 to 12px; scale changes of 0.94 to 1.03.
- **Grow from the source.** Popovers and the title prompt scale from the point nearest what opened
  them (`transformOrigin` follows the pill). The sparkle wave radiates from the button that was
  clicked.
- **Colour carries meaning.** Accent purple for neutral actions and Edit, green for correct and
  Save, red for misses, warm orange for Warm Up and the `[BLANK]` placeholder period.
- **Settled means clean.** Animated text drops its filter when it finishes
  (`transitionEnd: { filter: 'none' }`), so finished letters don't stay as filter layers.
- **Glass rules.** Only `.glass` applies `backdrop-filter`; glass nested inside glass uses
  `glass-flat`. Never put a `filter` or a lasting opacity below 1 on an ancestor of glass, because
  it breaks the frosted effect.

## Performance rules

- Animate **opacity and transform** wherever possible; they run on the compositor.
- **No React re-renders on hot paths.** The pointer spotlight writes CSS variables straight onto
  the element, at most once per frame. CountUp drives the DOM through a motion value. The memoized
  HUD doesn't re-render on keystrokes.
- **Clean up.** Every timeout, animation frame and listener is cleared in its effect cleanup.
  Waves and toasts remove themselves when they finish.
- **Measured budget.** One keystroke in a round costs about 1.6ms median (3.6ms worst) on the
  production build.

## Reduced motion

`<MotionConfig reducedMotion="user">` wraps the app: when the operating system asks for reduced
motion, movement becomes plain opacity fades. On top of that:

- The ambient background stops drifting.
- The miss shake on the answer field is skipped.
- Typed glyphs in the editable output appear without blur.
- The sparkle wave becomes a simple colour fade instead of a sweeping ring.

Feedback is never lost under reduced motion; only movement is removed.

## Checklist for new motion

1. Is it **state-driven**? Use a preset spring from `lib/motion.ts`, not inline numbers.
2. Can it be **toggled quickly**? Animate between states on one element; don't unmount mid-flight.
3. Is it an **event that can repeat**? Layer short-lived elements, or replace the running animation.
   Never queue.
4. Does **clicking or typing mid-animation** do the right thing immediately? Test it by spamming
   the control.
5. Is the **source of truth** outside the animation (a ref, a timeout, a schedule)?
6. Does anything **overshoot** that mustn't (blur, opacity)? Use a short tween for that property.
7. Only **opacity and transform** where possible? No filters on glass ancestors?
8. Does it still communicate under **reduced motion**?
9. Is it **subtle**: small distance, short, reusing the blur-in, settle, grow and glow vocabulary?
