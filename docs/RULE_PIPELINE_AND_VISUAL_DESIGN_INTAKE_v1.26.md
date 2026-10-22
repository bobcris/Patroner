# Shared Rule Pipeline and Visual Design Intake — v1.26

## Purpose

Patroner must apply multiple constraints to each garment without collapsing all garments into one drafting formula. v1.26 introduces a shared rule evaluation contract and a structured visual design brief. Garment-specific construction remains separate.

## Rule pipeline

Each rule has an ID, type, optional garment allow-list, severity (`error`, `warning`, or `info`), enabled flag, and type-specific parameters. The current supported types are:

- `measurement-positive` — checks named measurement values.
- `ease-minimum` — checks a named ease value against a minimum.
- `fabric-stretch-ease` — flags combinations of fabric stretch and ease for review.
- `grainline-required` — requires a grainline on every supplied piece.
- `design-confidence-minimum` — checks user-estimated interpretation confidence.
- `seam-allowance-minimum` — checks a minimum allowance value.
- `geometry-valid` — requires a positive geometry-validation result.
- `seam-length-tolerance` — checks a seam-length mismatch against a tolerance.

`evaluateRuleStack(context, ruleSet)` returns per-rule results plus blocking errors and review warnings. Rules can target a garment or all garment families. The rule evaluator is deterministic and does not itself generate geometry; construction modules must pass their own measurements, geometry and metadata into the context.

## Visual / AI-style intake

The UI supports a local reference image preview, source type (reference image, AI-generated style, or text-only), garment family, a free-text design prompt, visible feature fields, and a user-estimated confidence score. It exports a `patroner.design-brief` schema v1.0.0. The brief records that its contents are design intent, not a production pattern.

The UI also builds a vision-analysis prompt asking a separate vision-capable model to distinguish visible evidence from uncertain inference, list likely garment pieces and seams, identify missing measurements, and explicitly avoid inventing dimensions from images.

**Not implemented in this local-only milestone:** no vision model is called, no automatic pixel-to-pattern measurement is performed, and image bytes are not uploaded or embedded in the JSON brief. Users must inspect and confirm any AI-extracted features.

## Recommended image-to-pattern workflow

1. Import a photo, sketch, flat drawing or AI-generated style.
2. Extract visible features with a vision model and record confidence / uncertainty.
3. Confirm garment family, front/back details, closure, fabric, grainline and construction assumptions.
4. Collect body measurements and fit/ease preferences separately from image-derived estimates.
5. Select the relevant garment block and versioned construction rules.
6. Generate parametric pieces, run the shared rule stack, and resolve blocking issues.
7. Validate against a trusted reference block and a sewn toile before production use.

## Important limitations

- Single-view images generally do not reveal hidden seams, back construction, body dimensions, fabric stretch, or true scale.
- Confidence is currently user-estimated and is not a calibrated probability.
- Passing rules means only that the coded conditions passed; it is not a fit, safety, or manufacturing certification.
- Standard size profiles and existing trouser/bodice constructors remain provisional / experimental.
