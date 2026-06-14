# Resume & deploy runbook

Everything lives in this `app/` folder. Two jobs: **(A)** fire it back up to reassess, **(B)** push to GitHub → Netlify.

---

## A. Fire it up tomorrow (local, for reassessment)

```bash
cd "/Users/jamesrendell/Documents/Claude/Projects/Chief of Staff/MGA_ClaudeCode_Dropin/app"
npm install        # only needed if node_modules is gone
npm run dev        # → http://localhost:5173
```

Model-checking commands (no browser needed):

```bash
npm run trace        # full end-to-end numbers trace for one risk (edit the top of src/engine/_trace.ts)
npm run sanity       # 14/14 vulnerability-function tests vs the Excel methodology
npm run sanity:ext   # 10/10 extension + invariant tests
```

Read alongside **MODEL_REASSESSMENT.md** (per-peril model, assumptions register, the annotated trace, what to challenge).

> If you're back inside a Claude/Cowork session, the browser-preview helper used a symlink (`mga-engine-app`) + a `.claude/launch.json` entry in the *Claude Code* project. For plain local work you don't need either — just `npm run dev` here.

---

## B. Deploy to GitHub → Netlify

### Pre-deploy safety checklist (do this once, before the first push)

1. **Replace the real bordereau.** `public/sample-bdx.xlsx` is real coverholder data and is **git-ignored so it can't be pushed**. For the "Load sample" button to work on the live site, drop a *synthetic* file at `public/sample-bdx.xlsx` and remove that line from `.gitignore`. (Or leave it ignored — the button will just 404 on the deployed site. Better a broken button than leaked data.)
2. **Stay in stub mode for a public demo.** Don't set `VITE_BEV_API_KEY` in Netlify — build-time env vars get baked into the public JS. Live needs a proxy (see MODEL_REASSESSMENT.md §7).
3. Confirm it builds: `npm run build` (or just run `./deploy.sh` which builds first).

### First-time setup (once)

A local git repo is already initialised here with an initial commit. Create the GitHub repo and push:

```bash
cd "/Users/jamesrendell/Documents/Claude/Projects/Chief of Staff/MGA_ClaudeCode_Dropin/app"

# GitHub (needs the gh CLI, logged in). Private is safest.
gh repo create birdseyeview-product-sandbox --private --source . --remote origin --push
# …or create the repo on github.com and: git remote add origin <url> && git push -u origin main
```

Connect Netlify (either route):

- **Netlify UI:** Add new site → Import from Git → pick `birdseyeview-product-sandbox`. Build command `npm run build`, publish directory `dist`. (`netlify.toml` already sets these.)
- **Netlify CLI:** `npm i -g netlify-cli && netlify init` → follow prompts (build `npm run build`, publish `dist`).

Set env var in Netlify → Site settings → Environment: `VITE_BEV_API_BASE_URL` (and **leave `VITE_BEV_API_KEY` empty** for the public stub demo).

### Every update after that

```bash
./deploy.sh "what I changed"
```

That type-checks, builds, commits, and pushes. Netlify rebuilds and deploys automatically in ~1–2 minutes. (If you skip the script, plain `git push` also triggers Netlify.)

---

## File map

| File | Purpose |
|---|---|
| `MODEL_REASSESSMENT.md` | The model interrogation guide for the morning. |
| `README.md` | What the app is + run commands. |
| `netlify.toml` / `.gitignore` / `.env.example` | Deploy config (staged). |
| `deploy.sh` | One-command build + push. |
| `src/engine/_trace.ts` | The numbers trace (`npm run trace`). |
