# Test report — v1.28

## Automated result

`npm test` passed.

Coverage includes:
- all six standard sizes and existing geometry regressions;
- curve-aware skirt grading and experimental trouser/bodice scaffolds;
- multi-rule validation and manufacturing checks from prior milestones;
- structured vision-analysis schema validation;
- evidence labels and low-confidence inference warnings;
- invalid confidence rejection;
- exclusion of uncalibrated image dimensions from normalized output;
- assembly graph duplicate-ID, missing-reference, connectivity and disconnected-component checks;
- inline JavaScript syntax parsing.

## Not covered / not claimed

- No live vision-model invocation or image-to-pattern automation.
- No browser-driven interaction test.
- No certified patternmaking, professional block comparison or physical toile-fit test.
- Assembly graph connectivity does not prove seam length or garment assembly compatibility.
