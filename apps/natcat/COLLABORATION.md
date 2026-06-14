# Collaborating on the BirdsEyeView Product Sandbox

For James and Muskan. Your Claude plans (personal or org) don't matter — GitHub and Claude are
separate. You collaborate through **GitHub**: each works on a **branch**, opens a **pull request**,
the other reviews, then it merges to `main` and Netlify redeploys.

---

## 1. SET UP ONCE (each of you)

1. Install **Node.js (LTS)**, **GitHub Desktop**, and **Claude Code**.
2. James adds Muskan to the repo: GitHub → repo → **Settings → Collaborators → Add people →**
   her GitHub username. She accepts the email invite.
3. Both: **GitHub Desktop → File → Clone repository →** choose `birdseyeview-product-sandbox` → Clone.
4. Get the **same design kit** (this is what makes your styles match):
   - Put the `birdseyeview-design` skill in a private repo you both clone into `~/.claude/skills/`
     (recommended), **or** James zips `~/.claude/skills/birdseyeview-design/` and sends it to Muskan
     to unzip into the same place.
   - The repo's **`CLAUDE.md`** is read by Claude automatically — so both your sessions already
     follow the same rules. Nothing to install for that.
5. Run it: in the `app` folder → `npm install` → `npm run dev` → open http://localhost:5173.

---

## 2. EVERY TIME YOU MAKE A CHANGE (the loop)

Do **not** both edit `main` directly — that collides. Always:

1. **Open GitHub Desktop.**
2. **Get the latest:** Current Branch = `main` → click **Fetch origin** → **Pull origin**.
3. **Make a branch:** Current Branch → **New Branch** → name it for the work
   (e.g. `muskan/exposure-management`) → Create Branch.
4. **Build it** (Claude Code in the `app` folder). Plain English is fine — e.g.
   *"add an Exposure Management product to the sandbox, following CLAUDE.md."*
5. **Check it runs:** `npm run dev` (look at it), then `npm run build` (must pass).
6. **Commit:** in GitHub Desktop, write a one-line **Summary** → **Commit to `<branch>`**.
7. **Push:** click **Push origin**.
8. **Open a PR:** click **Create Pull Request** (opens the browser).
9. **Preview + review:** Netlify posts a live **Deploy Preview** link on the PR — open it, share it
   with each other or a client. The other person reads the diff on GitHub.
10. **Merge:** click **Merge pull request** → `main` updates → Netlify redeploys production (~1–2 min).

Golden rules: **pull before you start**, **one product per branch**, **small PRs**. Because you
own different products, you almost never touch the same files.

---

## 3. BRINGING IN A MODULE BUILT SOMEWHERE ELSE
(e.g. Muskan's existing Exposure Management mock-up)

1. Muskan: **New Branch** (`muskan/exposure-management`).
2. Copy her component file(s) into `src/ui/` (or a `src/ui/exposure/` folder for a big one).
3. Wire it in: add an entry to `SANDBOX_PRODUCTS` in `ui/SandboxHome.tsx` (set `enterable: true`,
   `status: "live"`), and render it in `App.tsx` when its product id is selected (mirror the
   `product === "natcat"` block), with a `‹ All products` back-link.
4. Re-skin to the shared system (see §4): swap any ad-hoc colours/fonts for the `bev.css` classes
   and tokens, keep her layout and ideas.
5. `npm run build` → Commit → Push → PR → preview → merge. It becomes a live card on the directory.

---

## 4. DESIGN CONSISTENCY — when one of us has a nicer design

The sandbox must feel like **one product**, so every module shares the same **system**: the navy/
pink palette, Mulish, the pink eyebrow + headline rule, white content cards, Lucide icons, the BEV
voice. All of that lives in `src/bev.css` + `CLAUDE.md` + the design skill.

- **Slightly different is fine.** A module can have its own layout, charts and components — variety
  is good — **as long as it uses the shared tokens and devices.** It should still look like the
  same family.
- **If a design is genuinely nicer, promote it — don't fork it.** If Muskan's Claude produces a
  better card, stat tile or chart treatment, don't leave it living only in her module. Pull the
  pattern into the **shared `bev.css`** as a reusable class and note it in **`CLAUDE.md`** (in its
  own PR). Then *every* module — including NatCat — levels up, and the sandbox stays coherent. The
  whole thing ratchets upward instead of drifting apart.
- **Quick design check at merge time** (use `CLAUDE.md` as the checklist): navy chrome / white
  content? pink eyebrow + headline rule? Mulish? Lucide, no emoji? British spelling, CERA® mark?
  If yes, it's on-brand. If something looks better than the current system, raise it as a
  "promote to the design system" PR.

Rule of thumb: **module-level polish stays in the module; reusable improvements go into the shared
system so both of us inherit them.**
