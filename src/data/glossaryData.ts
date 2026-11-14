import { GlossaryCategory, GlossaryEntry } from '../types/academy';
import { GLOSSARY_PART_1 } from './glossaryPart1';
import { GLOSSARY_PART_2 } from './glossaryPart2';

const GLOSSARY_EXTRAS: GlossaryEntry[] = [
  {
    id: 'back-gouging',
    term: 'Back-Gouging',
    fullMeaning: 'Removing Unfused Root Metal From Second Side of a Full-Penetration Joint',
    category: 'Welding Processes',
    register: 'Formal Technical',
    beginnerDefinition: 'Gouging out the back side of a weld root with air-arc or a grinder down to shiny sound weld metal before welding the second side.',
    advancedDefinition: 'Guarantees 100% joint penetration without root slag or lack of fusion on Double-V and Double-Bevel pressure seams; verify clean sound metal by MT/PT.',
    jobsiteExample: 'Air-arcing and flap-grinding the inside root of a 1-1/2" vessel long-seam prior to SAW second-side pass.',
    relatedTermIds: ['cac-a', 'double-v', 'incomplete-penetration'],
    lessonId: 'l2-metallurgy-distortion',
  },
  {
    id: 'back-purge',
    term: 'Back-Purging (Inert Gas Purge)',
    fullMeaning: 'Displacing Oxygen Inside Stainless/Alloy Pipe With Argon or Nitrogen',
    category: 'Welding Processes',
    register: 'Formal Technical',
    beginnerDefinition: 'Pumping Argon inside a stainless pipe before TIG-welding the root so the inside weld bead stays shiny silver instead of turning crusty black "sugaring".',
    advancedDefinition: 'Prevents oxidation ("sugaring") of Cr-rich root surfaces on austenitic stainless (304L/316L), duplex, and chrome-moly (T22/T91) boiler tubes; check <0.1% O2 with an analyzer.',
    jobsiteExample: 'Setting purge dams and running 15 CFH Argon inside a 4" 316L pipe before striking a GTAW root.',
    relatedTermIds: ['gtaw', 'austenitic-stainless', 'er70s-2'],
    lessonId: 'l3-advanced-metallurgy-pwht',
  },
  {
    id: 'burn-through',
    term: 'Burn-Through (Melt-Through)',
    fullMeaning: 'Excessive Penetration Melting a Hole Through Joint Root or Thin Plate',
    category: 'Metallurgy, Defects & NDE',
    register: 'Formal Technical',
    beginnerDefinition: 'Blowing a hole straight through the steel plate or pipe root because heat input was too high or travel speed slowed down too much.',
    advancedDefinition: 'Triggered by excessive amperage, wide root gap, razor-thin land, or slow travel on thin plate; requires cutting/grinding back to sound edge and rebuilding.',
    jobsiteExample: 'Dropping root amps by 10 A after seeing the E6010 keyhole widen toward burn-through on thin Schedule 10 pipe.',
    relatedTermIds: ['keyhole', 'root-face', 'heat-input'],
    lessonId: 'l1-welding-oxy-smaw',
    simulatorPresetId: 'ex-smaw-e6010-2g',
  },
  {
    id: 'refractory',
    term: 'Boiler Refractory & Stud Anchors',
    fullMeaning: 'High-Temperature Castable Ceramic or Brick Lining Protecting Furnace Casing',
    category: 'Boilers, Vessels & Piping',
    register: 'Formal Technical',
    beginnerDefinition: 'Heat-proof ceramic brick or poured concrete-like lining inside boiler fireboxes and ductwork anchored with Y-studs welded to the steel shell.',
    advancedDefinition: 'Insulates outer carbon-steel casing from 2,000°F+ flue gas and flame impingement; boilermakers weld stainless V/Y refractory anchors prior to gunnite/castable installation.',
    jobsiteExample: 'Stud-welding 310S V-anchors on a boiler windbox wall before refractory gunning.',
    relatedTermIds: ['waterwall', 'water-tube-boiler'],
    lessonId: 'l3-vessel-boiler-installation',
  },
  {
    id: 'csa-b51',
    term: 'CSA B51',
    acronym: 'CSA B51',
    fullMeaning: 'Boiler, Pressure Vessel, and Pressure Piping Code (Canada)',
    category: 'Canadian Standards, Safety & 428A',
    register: 'Formal Technical',
    canadianNote: 'Adopted provincially across Canada (TSSA in Ontario, ABSA in Alberta) for CRN registration and ASME adoption.',
    beginnerDefinition: 'Canada’s national umbrella pressure-equipment code tying ASME Boiler & Pressure Vessel rules to provincial CRN registration.',
    advancedDefinition: 'Governs Canadian Registration Number (CRN) design registration, provincial jurisdictional inspection boundaries, and authorized repair/alteration rules.',
    jobsiteExample: 'Checking the stamped CRN number on a replacement ASME heat exchanger nameplate before installation.',
    relatedTermIds: ['tssa', 'absa', 'asme-sec-viii'],
    lessonId: 'l3-vessel-boiler-installation',
  },
];

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'Welding Processes',
  'Positions, Joints & Consumables',
  'Metallurgy, Defects & NDE',
  'Boilers, Vessels & Piping',
  'Rigging & Hoisting',
  'Blueprints & Layout',
  'Canadian Standards, Safety & 428A',
  'Shop & Field Expressions',
];

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  ...GLOSSARY_PART_1,
  ...GLOSSARY_PART_2,
  ...GLOSSARY_EXTRAS,
].sort((a, b) => a.term.localeCompare(b.term));

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY_ENTRIES.map((e) => [e.id, e])
);
