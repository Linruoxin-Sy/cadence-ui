# Real React 19.0 consumer

Run from the repository root on Windows (Edge installed):

```powershell
node tests/fixtures/react19-consumer/prepare.mjs
npm install --prefix .cache/react19-consumer --no-audit --no-fund
Push-Location .cache/react19-consumer
npm exec -- vite build
npm exec -- vite preview --host 127.0.0.1 --port 3161
# In another shell at the repository root:
node tests/fixtures/react19-consumer/run.mjs
```

The isolated npm package copies shipped source with its relative layout intact. It owns
React and React DOM 19.0.0, Motion 13.5.1, Base 1.9.0 and OTP 1.5.0; Vite dedupes React.
It does not resolve component imports back into the workspace, alter the workspace lock,
mock hooks, or patch dependencies. `main.tsx.txt` is an executable fixture template copied
to main.tsx during preparation, outside the host TypeScript compilation.

The production browser runner tests StrictMode, three adapters, actual OTP typing, all
three modes and both OS settings, running cancellation, same-target physics clock changes,
unrelated committed renders, stable DOM/focus, native drag and ref cleanup. It records
real WAAPI state for the adapters and computed per-frame OTP behavior (OTP uses Motion's
JS driver here). It does not certify all React versions or the whole library. Use the
normal B3 suite for the Next SSR/hydration paths under installed React 19.3.1.

The generic adapters deliberately select `layout.move` physics so the retained positive-clock
assertion proves full-mode retiming. Its reduced finite opacity fallback instead retains its running
handle on a positive clock edit. Finite action clocks capture their start timing; the shared policy browser
fixture in `tests/runtime/motion-policy.mjs` covers that separate contract and composed CSS owners.
