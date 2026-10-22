# Patroner experimental point grading v1

## Scope

This rule set applies only to the current simplified skirt panel with a fixed 16-point outline. It is implemented as a pure function in `src/drafting-engine.js` and covered by automated tests. It is a transparent experimental baseline, not a certified industrial grading standard or a claim of fit.

## Coordinate convention

- Coordinates are millimetres.
- Standard body measurements are centimetres.
- Waist and hip circumference changes are distributed to a quarter-panel using `delta_cm × 2.5 mm`.
- Hip-depth and length changes use `delta_cm × 10 mm`.
- Ease and seam allowance remain separate from body measurements.

## Point map and rules

| Outline index | Landmark | X shift | Y shift |
|---:|---|---|---|
| 0 | Centre-fold waist | 0 | 0 |
| 1 | Side waist | waist delta × 2.5 mm | 0 |
| 2–13 | Sampled side seam | linear interpolation from waist shift to hip shift | linear interpolation from hip-depth delta |
| 14 | Side hem | hip delta × 2.5 mm | length delta × 10 mm |
| 15 | Centre-fold hem | 0 | length delta × 10 mm |

For sampled side-seam point `i`, `t = (i - 1) / 12`, `x' = x + waistShift × (1 - t) + hipShift × t`, and `y' = y + hipDepthDelta × t`.

## Guardrails

- The function rejects any outline not containing exactly 16 points.
- Measurement inputs must be finite.
- Unsupported custom measurements do not silently use this standard-size grading path; the UI falls back to measurement-derived drafting and displays a warning.
- The size chart remains provisional and configurable.
- Before production use, replace this demonstrator rule set with block-specific, professionally reviewed grading increments, notches, dart rules, seam matching checks, and fit/toile validation.
