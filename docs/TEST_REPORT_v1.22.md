# Patroner v1.22 test report

Date: 2026-10-22

## Automated results

- [PASS] XS, S, M, L, XL, XXL standard profiles are available and ordered.
- [PASS] Configured waist and hip values progress monotonically.
- [PASS] Unsupported size profiles are rejected.
- [PASS] Experimental point grading preserves its 16-point schema and base-size identity.
- [PASS] Invalid measurements and outline schemas are rejected.
- [PASS] Polygon area, perimeter, bounds, and edge lengths are computed deterministically.
- [PASS] Bow-tie/self-intersecting polygons are rejected.
- [PASS] Duplicate adjacent vertices and degenerate offsets are rejected.
- [PASS] Strict segment crossing and collinear overlap are detected.
- [PASS] Seam-length tolerance comparison behaves as expected.
- [PASS] Rectangular offset geometry has expected bounds.
- [PASS] Inline application JavaScript parses successfully.
- [PASS] Sample stitch outline and cut polygon pass topology regression checks across all six standard sizes in an independent geometry fixture.

Run `npm test` to reproduce the automated suite.

## Scope limitation

These are software and geometric-invariant tests, not garment-fit validation. The size chart and grading rules remain provisional. No physical toile, professional reference-block comparison, or full browser interaction test has been completed. A headless browser smoke attempt did not complete in this environment, so browser-level validation is explicitly outstanding.
