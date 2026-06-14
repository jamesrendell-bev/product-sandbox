# START HERE — CERA® MGA AAL & Pricing Engine

This folder is a **clean, self-contained build package**. Build in a **fresh project** using only what is here. Do not pull in any other repo, old PoC, or engine.

## Read first
1. `MGA_AAL_Engine_Claude_Code_Build_Instructions.md` — the build brief (start here).
2. `MGA_Pricing_Engine_Build_Spec.md` — full rationale and detail (Appendices A–E).

## What's in here
- `engine/` — the **ONLY** engine. Exactly 5 TypeScript files (`aal.ts`, `vuln-functions.ts`, `vuln-tables.ts`, `cera-client.ts`, `_sanity.ts`). Verified (14/14 sanity tests). **Reuse and extend these — do not reference any other engine.**
- `samples/` — example Australian bordereaux for portfolio testing (`BDX_AU_MGA_Build_with_AI_Output.xlsx` includes the AI-geocoded `AI_Output` sheet with lat/long) + `Portfolio_Results_Template.xltx` (the output format to mirror).
- `style-reference/CERA_Hazard_Feed_POC.html` — match this look (navy `#131F3C` / hot pink `#FF66C4`, dark theme). The map should be dark mode too.
- `reference/` — the AAL methodology paper + calculator. **Optional** calibration context; not required to build.

## Key facts
- **Scope: US and Australia only.** Wordings: US → ISO/E&S; Australia → ISR Mark V.
- **Data:** runs on stub curves now. Going live = set env vars `BEV_API_KEY` and `BEV_API_BASE_URL` (CERA® API docs: https://api-docs.birdseyeview.ai). No code rework needed.
- **Guardrail:** the five files in `engine/` are the trusted foundation. Ignore everything else on the machine.
