# Patroner v1.25 automated test report

Status: PASS

Command: `npm test`

Verified:
- Existing six-size chart, measurement validation, and legacy grading regressions.
- Polygon area, perimeter, bounds, self-intersection, collinear overlap, seam-length tolerance, and offset guards.
- v1.23 skirt block, dart, notch, and seam diagnostic contracts.
- v1.24 versioned measurement schemas, named landmarks, and grading-rule contracts.
- v1.25 curve-aware skirt regeneration at target measurements and identity-equivalent base construction.
- Trouser and bodice schema required-field validation.
- Experimental trouser and bodice scaffold polygon topology and input constraints.
- Inline JavaScript syntax parsing.

Not tested / not claimed:
- Browser-driven UI interaction (the prior browser smoke test could not be completed reliably in this environment).
- Comparison with a professionally drafted reference block.
- Physical toile fit, production grading certification, or industrial CAD/CAM readiness.
