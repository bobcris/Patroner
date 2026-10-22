# Patroner v1.29 — Image-to-Pattern Draft Pipeline

## Scope

v1.29 adds a deterministic bridge between a normalized vision-analysis record and the existing parametric garment constructors. It does **not** perform computer vision, upload images, infer body measurements from pixels, or claim a production-ready pattern.

## Pipeline

1. Import structured output from a separate vision-capable model.
2. Validate the analysis schema and preserve feature evidence labels (`visible`, `inferred`, `unknown`).
3. Require an explicit user approval checkbox before drafting.
4. Require positive, confirmed measurements for the selected constructor.
5. Generate a parametric pattern using the relevant garment-specific function.
6. Analyze the generated outline and emit a versioned JSON report with warnings and limitations.

## Constructors

- **Skirt:** curve-regenerated panel using confirmed waist, hip, hip depth, length, ease and optional dart intake. This is a provisional simplified panel.
- **Trouser:** experimental parametric leg-panel scaffold with explicit body/construction measurements. The crotch and fit are not professionally validated.
- **Bodice:** experimental panel scaffold with explicit bust, waist, shoulder, back-length, armhole-depth and neck-width measurements. It does not infer darts or balance corrections.
- **Dress, sleeve, jacket and shirt:** blocked with explicit missing-constructor requirements rather than silently approximated with a different garment family.

## Units and safety

User-entered measurements are centimetres; generated geometry is millimetres. Image-derived dimensions are not accepted as body measurements. Unknown or inferred feature classifications are surfaced as warnings. Approval means the user accepts the design interpretation as a drafting input; it is not a fit or manufacturing certification.

## Test coverage

- Drafting is blocked without explicit approval.
- Missing confirmed measurements block generation.
- A confirmed skirt input produces deterministic geometry and a geometry report.
- Unsupported garment families return explicit constructor requirements.
- Invalid dart intake is rejected by the underlying geometry constructor.

## Remaining work

- Real vision-model integration with image transfer and structured output.
- Review/edit UI for each detected feature before approval.
- More complete trouser and bodice blocks and dedicated sleeve/dress constructors.
- Seam-specific geometry generation, seam-pair compatibility, pattern-piece export and print validation.
- Browser interaction, professional reference-block comparison and physical toile validation.
