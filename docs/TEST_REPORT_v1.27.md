# Test report — Patroner v1.27

## Automated results

`npm test` passes:

- Existing six-size skirt topology and grading regressions.
- v1.23 shared construction primitives and geometry diagnostics.
- v1.24 schema, landmark and provisional grading contracts.
- v1.25 curve-aware skirt generation and experimental trouser/bodice constructors.
- v1.26 shared rule stack and design brief schema.
- v1.27 piece metadata contracts, grainline/fold rules, duplicate piece identity rejection, seam-pair matching and tolerance, seam allowance midpoint sampling, print calibration scale tolerance, tile continuity, and manufacturing-rule integration.
- Inline application script syntax validation.

## Limits

These tests verify deterministic software behavior on fixtures. They do not certify professional garment fit, industrial grading, a continuous seam allowance around all curves/corners, PDF printer scaling, or full tile assembly. Browser interaction testing, reference-block comparisons and physical toile testing remain outstanding.
