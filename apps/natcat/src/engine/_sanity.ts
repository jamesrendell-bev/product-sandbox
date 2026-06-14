// Sanity test — compares MDR(intensity) against the worked numbers
// printed in the Excel METHODOLOGY sheet (rows 82-92 for EQ, etc.)
// Run via:  npx tsx src/engine/_sanity.ts

import { earthquakeMDR, cycloneMDR, wildfireMDR, floodMDR } from "./vuln-functions";

interface Case { label: string; got: number; want: number; }
const cases: Case[] = [
  // Earthquake — table at intensity 0.10g, 0.25g, 0.50g for Default Residential
  { label: "EQ Default Res @ 0.10g",  got: earthquakeMDR(0.10, "Default Residential"), want: 0.1288 },
  { label: "EQ Default Res @ 0.25g",  got: earthquakeMDR(0.25, "Default Residential"), want: 0.5709 },
  { label: "EQ Default Res @ 0.50g",  got: earthquakeMDR(0.50, "Default Residential"), want: 0.8286 },
  { label: "EQ Adobe @ 0.10g",         got: earthquakeMDR(0.10, "Adobe"),               want: 0.6575 },
  { label: "EQ Steel @ 0.50g",         got: earthquakeMDR(0.50, "Steel"),               want: 0.2922 },

  // TC — methodology table E62-F62: MDR at Cat 3 (≈50 m/s) and Cat 5 (≈70 m/s)
  { label: "TC North Atlantic @ 50 m/s",  got: cycloneMDR(50, "North Atlantic"),  want: 0.0333 },
  { label: "TC North Atlantic @ 70 m/s",  got: cycloneMDR(70, "North Atlantic"),  want: 0.1726 },
  { label: "TC Western Pacific @ 50 m/s", got: cycloneMDR(50, "Western Pacific"), want: 0.0802 },

  // Wildfire — sigmoid hits 0.5 when I = I_thresh + I_half (e.g. 200+2000 = 2200 for Default Res)
  { label: "WF Res Default @ 2200 kW/m",  got: wildfireMDR(2200, "Residential — Default"), want: 0.5 },
  { label: "WF Res Default @ 200 kW/m",   got: wildfireMDR(200,  "Residential — Default"), want: 0   },

  // Flood — JRC table @ 1m for Oceania Residential = 0.40
  { label: "Flood Oceania Res @ 1.0 m",   got: floodMDR(1.0, "Oceania", "residential"), want: 0.40 },
  { label: "Flood Oceania Res @ 0.5 m",   got: floodMDR(0.5, "Oceania", "residential"), want: 0.22 },
  { label: "Flood Oceania Res @ 0.0 m",   got: floodMDR(0.0, "Oceania", "residential"), want: 0    },
  // Interpolated mid-point between 1.0m (0.40) and 1.5m (0.56) at 1.25m = 0.48
  { label: "Flood Oceania Res @ 1.25 m",  got: floodMDR(1.25, "Oceania", "residential"), want: 0.48 },
];

let pass = 0;
for (const c of cases) {
  const ok = Math.abs(c.got - c.want) < 0.005;
  console.log(`${ok ? "✓" : "✗"}  ${c.label.padEnd(40)}  got=${c.got.toFixed(4)}  want=${c.want.toFixed(4)}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${cases.length} cases pass`);
process.exit(pass === cases.length ? 0 : 1);
