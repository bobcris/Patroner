# Patroner v1.24 test report

## Automated result

`npm test` passes in the local Node.js test environment.

Coverage added in v1.24:
- Versioned measurement schema exists and accepts valid centimetre inputs.
- Non-positive required body measurements fail schema validation.
- Unknown schema identifiers fail explicitly.
- Named landmark schema maps documented IDs to the current outline indices.
- Grade-rule validator checks required landmark coverage and finite coefficients.
- Provisional status produces an explicit validation warning.
- Named landmark grading is an identity transform for zero deltas.
- Representative waist and hip-depth deltas produce deterministic coordinates.
- Non-finite measurement deltas are rejected.
- Standard-size grading profile includes chart, measurement, landmark, and rule-set version identity.
- Existing geometry, skirt construction, dart, notch, six-size regression, and inline JavaScript syntax tests continue to pass.

## Not verified

- Browser-driven interaction testing was not completed.
- No professional reference-block coordinate fixture has been supplied or validated.
- No physical toile, fit, production cutting, or industrial grading validation has been performed.
- The named-landmark helper is not yet connected to full curve-sample regeneration in the UI.

## Interpretation

This is a schema and grading-contract milestone, not a claim that Patroner has professional or production-certified grading.
