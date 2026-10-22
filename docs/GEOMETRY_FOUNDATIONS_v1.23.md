# Patroner v1.23 — production geometry foundations

## Scope delivered

- Centralized the simplified quarter-skirt panel constructor in `buildSkirtPanel`.
- Added input contracts for positive panel dimensions, dart intake, curve sample count, and Bezier control ratios.
- Centralized dart geometry in `buildDart`, including a stable inactive representation for zero intake/depth.
- Centralized V-notch geometry in `buildNotch`, defined from a seam point and tangent direction.
- Added `validateSeamAllowance` to report stitch/cut topology and bounding-box regressions.
- Updated the app's generation path to use the shared block, dart, and notch constructors, and surfaced seam allowance topology/bounds in the geometry audit.
- Added deterministic tests for the new construction primitives and failure modes.

## Units and conventions

All drafting-engine coordinates and geometric lengths are millimetres. Body measurements remain centimetres at the UI boundary. `buildSkirtPanel` accepts the closed target waist width excluding dart intake; the constructed top edge adds the dart intake. Its returned `waistTopMm` is therefore the open-dart waist width.

The V-notch constructor takes a point on the seam and a second point defining the local tangent direction. The tip is offset along the left-hand normal. This is a reproducible marking convention, not a universal apparel standard.

## Validation boundary

`validateSeamAllowance` checks topology and whether the cut polygon's bounds have unexpectedly shrunk. It does **not** certify a constant offset distance at every curve, corner, concave region, or dart. The current UI still uses its legacy panel-offset routine for cut-line generation; migration to a fully validated offset pipeline is deliberately not claimed in this milestone.

The skirt block remains a simplified demonstrator. The sizing chart and grading rules remain provisional. No fit, toile, production CAD/CAM, or professional grading certification is implied.
