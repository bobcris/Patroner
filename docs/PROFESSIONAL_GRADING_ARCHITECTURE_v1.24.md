# Patroner v1.24 — Professional grading architecture

## Purpose

This milestone creates explicit, versioned contracts for measurement inputs, pattern landmarks, and grading rules. It does not certify the current skirt chart or turn the experimental 16-point point-grading method into industrial grading.

## Versioned contracts

- Measurement schema: `skirt.body.v1`, version `1.0.0`, body dimensions in centimetres.
- Landmark schema: `skirt.panel.landmarks.v1`, version `1.0.0`, coordinates in millimetres.
- Grade rule set: `patroner.skirt.landmark-linear.v1`, version `1.0.0-provisional`.
- Project JSON schema: `patroner.pattern-project`, version `1.1.0`.

## Named skirt landmarks

| ID | Outline index | Meaning |
|---|---:|---|
| `CF_FOLD_WAIST` | 0 | Centre-fold waist anchor |
| `SIDE_WAIST` | 1 | Side waist vertex |
| `SIDE_HIP` | 13 | Side seam at hip-depth endpoint |
| `SIDE_HEM` | 14 | Side hem vertex |
| `CF_FOLD_HEM` | 15 | Centre-fold hem anchor |

Indices are part of the current simplified 16-point panel contract. If the curve sampling or block topology changes, a new landmark schema version is required; silently reusing these indices is unsafe.

## Rule model

Each named landmark has explicit coefficients for waist, hip, hip-depth, and length measurement deltas. Coordinates are millimetres; input deltas are centimetres. Coefficients are the movement in millimetres per centimetre of measurement delta. The rule-set validator checks required landmark coverage and finite coefficients. The identity transform and deterministic sample movements are covered by automated tests.

## Safety and current limits

- The size chart remains a provisional Patroner chart, not a universal or population-validated standard.
- The provisional rule coefficients are transparent placeholders. They have not been approved against a trusted professional reference block.
- The new named-landmark grading contract is an engine capability and test target; the UI's current generated outline still uses the existing measurement-derived drafting path or legacy experimental point grading. It does not yet regenerate all curve samples from the named landmark rules.
- Custom measurements are validated against the schema, but schema validity is not a fit guarantee.
- No claim of production readiness is made without professional pattern review, comparison against reference-block coordinates with stated tolerances, physical toile fitting, and full-scale print checks.

## Next implementation requirements

1. Replace index-only anchors with stable semantic construction nodes and curve parameters.
2. Define block-specific, professionally sourced grade increments and document source, unit, direction, and tolerance for each rule.
3. Regenerate intermediate curve geometry from graded control points, then rerun topology, seam, notch, dart, and allowance checks.
4. Add trusted reference fixtures and coordinate-difference reports.
5. Add browser interaction tests and physical toile validation before any production-ready status is permitted.
