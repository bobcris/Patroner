# Patroner v1.25 — Curve-aware grading and multi-garment foundations

## Delivered

- Added `buildGradedSkirtPanel`, which reconstructs the complete skirt panel from target body measurements and target construction allowances. It does not grade a fixed set of sampled vertices; the curve is regenerated from the target control geometry.
- Added versioned `trouser.body.v1` and `bodice.body.v1` metric measurement schemas with required-field validation.
- Added experimental `buildTrouserPanel` and `buildBodicePanel` construction scaffolds with parameter constraints and polygon topology analysis.
- Made curve-aware regeneration the default grading method for configured standard sizes in the skirt UI. The legacy point-grading method remains available as an explicitly experimental option.
- Added regression tests for identity-sized regeneration, target hip-depth and hem movement, schema validation, and basic trouser/bodice block topology.

## Architecture contracts

Each garment block has its own measurement schema and construction function. Shared polygon, distance, intersection, and seam-analysis functions remain garment-agnostic. The skirt grading pipeline is the only one connected to the current user interface in this milestone.

## Known limitations

- The XS–XXL chart and skirt curve proportions remain provisional, not a universal size standard or professionally validated grade rule set.
- Trouser and bodice constructors are geometric scaffolds, not fitted production blocks. They do not model full crotch-curve drafting, front/back balance, darts, ease distribution, or all body-shape variants.
- Sleeve and dress blocks, armhole-to-sleeve-cap matching, dress block joining, and garment-to-garment seam compatibility are not implemented yet.
- Browser interaction automation, reference-block coordinate comparisons, full-scale print checks, and physical toile validation remain outstanding.

## Verification

Run `npm test` with Node.js 18+. The suite covers the existing XS–XXL and geometry regression tests plus v1.25 grading, schema, and block-scaffold checks. Passing these tests demonstrates software invariants only; it does not certify fit or manufacturing readiness.
