# Patroner v1.21 test report

Date: 2026-10-22

## Automated results

- [PASS] All six standard size profiles are present in the configured order.
- [PASS] Waist and hip measurements increase monotonically across the configured chart.
- [PASS] Unsupported standard sizes are rejected by the engine.
- [PASS] Point grading preserves the 16-point outline schema.
- [PASS] Base-size grading is an identity transform.
- [PASS] Waist, hip, hip-depth, and length deltas move the documented landmarks.
- [PASS] Invalid measurement and invalid outline cases are rejected.
- [PASS] Inline application JavaScript parses successfully.

Run `npm test` to reproduce these checks.

## Limitations

These tests validate code behavior and arithmetic only. They do not establish population sizing validity, garment fit, professional pattern correctness, seam compatibility, or production readiness. The chart and point grading are explicitly provisional. Browser interaction and physical toile tests remain outstanding.
