# Patroner v1.23 test report

Command: `npm test`

Results:

- PASS — default skirt outline and cut topology regression across XS, S, M, L, XL, XXL.
- PASS — canonical block constructor, waist/dart relationship, sample-count and intake guards.
- PASS — dart construction and zero-intake inactive state.
- PASS — tangent-based notch construction and zero-tangent guard.
- PASS — seam allowance topology/bounds diagnostic contract.
- PASS — polygon area, perimeter, bounds, self-intersection, collinear overlap, seam tolerance, offset, and degenerate-shape guards.
- PASS — size chart progression, input validation, experimental 16-point grading, identity transform, and failure cases.
- PASS — inline JavaScript syntax parse.

Not completed: browser-driven interaction tests, physical printing calibration, professional reference-block comparison, and sewn-toile fit validation. These remain release gates before any production-readiness claim.
