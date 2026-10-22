# Patroner roadmap

## v1.29 — reviewed design-to-draft pipeline
- [x] Convert validated structured vision analysis into a deterministic draft request.
- [x] Require explicit user approval and positive confirmed measurements.
- [x] Generate a parametric skirt outline and analyze its geometry.
- [x] Route trouser and bodice designs to separate experimental constructors.
- [x] Block unsupported garment families instead of silently substituting a different block.
- [x] Export a versioned generation report with evidence labels, warnings and limitations.
- [ ] Integrate an actual vision-capable model with explicit consent and structured response handling.
- [ ] Add feature-by-feature review/edit UI and calibration for known image dimensions.
- [ ] Add complete garment-specific constructors, seam pairing, SVG/PDF export of generated pieces and reference-block tests.

## v1.28 — AI visual-analysis contract and assembly graph
- [x] Structured vision analysis import and schema validation.
- [x] Evidence labels distinguish visible features from inference and unknowns.
- [x] Confidence and unresolved questions trigger review status.
- [x] Image-derived dimensions are excluded from the accepted specification until calibrated and confirmed.
- [x] Assembly graph validates piece references, join IDs and connectivity.
- [x] This milestone does not itself run a remote vision model or generate a production pattern from pixels.


## v1.21 — drafting engine and grading baseline
- [x] Extract chart, measurement validation, and grading rules into a testable engine file.
- [x] Preserve standard sizes XS, S, M, L, XL, XXL and custom measurement entry.
- [x] Implement explicit experimental point grading for the current 16-point skirt outline.
- [x] Add deterministic unit tests for chart order, input validation, grading deltas, identity transform, and invalid schema.
- [ ] Validate interactions in a browser automation suite.
- [ ] Compare the generated block with a professionally drafted reference and a sewn toile.

## v1.22 — geometry and block correctness
- [x] Add a shared geometry engine for polygon area, perimeter, bounds, edge lengths, and topology.
- [x] Detect non-adjacent crossings, collinear overlap, duplicate vertices, and degenerate polygons.
- [x] Add offset-polygon safety checks and seam-length tolerance comparisons.
- [x] Expand UI geometry reports with engine-level outline/cut topology and fold alignment checks.
- [x] Export versioned project JSON with measurement, grading, geometry, and limitation metadata.
- [x] Add deterministic geometry regression tests.
- [ ] Define a full versioned measurement schema per garment block.
- [ ] Replace current offset/dart/notch geometry with validated production construction rules.
- [ ] Add browser interaction tests and trusted professional reference-block fixtures.
- [ ] Validate against sewn toiles and expert review.

## v1.23 — production geometry foundations
- [x] Centralize simplified skirt-block construction in the shared geometry engine.
- [x] Add reusable dart and tangent-based notch constructors with input contracts.
- [x] Add seam allowance topology/bounds diagnostics to the UI geometry report.
- [x] Add regression tests for construction primitives and invalid inputs.
- [ ] Replace legacy cut-offset code with a validated offset pipeline that checks local allowance distance and concave-corner behavior.
- [ ] Add browser interaction tests and trusted professional reference-block fixtures.

## v1.24 — professional grading architecture
- [x] Define a versioned skirt body-measurement schema with explicit units and required fields.
- [x] Define a versioned named-landmark schema for the current 16-point panel.
- [x] Define a versioned provisional landmark rule set and validate coverage/coefficient integrity.
- [x] Add deterministic landmark grading helper and identity/delta regression tests.
- [x] Record schema and grading contract versions/status in project JSON exports.
- [ ] Source and professionally review block-specific grade increments against a trusted reference block.
- [ ] Regenerate all curve samples from graded control geometry; do not move anchors in isolation.
- [ ] Add reference-block coordinate fixtures with explicit tolerances and provenance.
- [ ] Add browser interaction tests and physical toile-fit validation before any production-ready designation.


## v1.25 — curve-aware grading and multi-garment foundations
- [x] Regenerate skirt curve geometry from target measurements rather than shifting sampled points in isolation.
- [x] Add versioned trouser and bodice measurement schemas.
- [x] Add experimental trouser and bodice block constructors with input constraints and topology reports.
- [x] Connect curve-aware regeneration as the default standard-size skirt grading method in the UI.
- [ ] Add sleeve block construction with cap geometry derived from measured armhole seam length.
- [ ] Add dress block assembly with explicit compatible seam pairs and seam-length tolerances.
- [ ] Validate trouser crotch, bodice balance, and all grading rules against trusted professional reference blocks and sewn toiles.
- [ ] Add browser interaction automation and full-scale print calibration checks.


## v1.26 — shared rules and visual design intake
- [x] Add a common rule-stack schema with rule IDs, garment applicability, severity, enable/disable flag, and parameters.
- [x] Implement combined measurement, ease, stretch, grainline, design-confidence, seam-allowance, geometry, and seam-length checks.
- [x] Add structured design briefs for reference images, AI-generated styles, and text descriptions.
- [x] Add local image preview and a reusable vision-analysis prompt without uploading image bytes.
- [x] Add deterministic tests for rule stack validation, pass/fail cases, duplicate IDs, and design-brief normalization.
- [ ] Integrate a vision-capable model with explicit user consent and structured output validation.
- [ ] Convert confirmed image-derived features into garment-specific parametric construction plans.
- [ ] Add reference scale / known-dimension calibration and uncertainty propagation.
- [ ] Connect each garment's construction parameters to rule evaluation and actual piece generation.
- [ ] Add browser interaction automation, reference-block comparisons, and sewn-toile validation.

## v1.27 — manufacturing validation and piece contracts
- [x] Add piece metadata: grainline, cut quantity, fold status, fabric direction, and piece identity.
- [x] Add explicit seam-pair IDs, sew-line comparison, and tolerance reports.
- [x] Add sampled local seam-allowance distance diagnostics with explicit exclusions for fold edges.
- [x] Add print scale calibration validation and tile-edge continuity diagnostics.
- [x] Add an in-app manufacturing integrity panel and JSON report export.
- [ ] Replace sampled allowance diagnostics with a production-grade offset kernel and adaptive sampling around curves/corners.
- [ ] Add browser interaction tests and print/export regression fixtures from real PDF/SVG rendering.

## v1.28 — garment library and assembly graph
- [ ] Add dedicated versioned construction schemas for skirt, trouser, bodice, sleeve, dress, shirt, and jacket.
- [ ] Build dress assembly from compatible bodice/skirt seams; derive sleeve cap from measured armhole seam length.
- [ ] Track rule provenance, user overrides, confidence, and dependencies in project JSON.

## v2.0 — parametric pattern studio
- [ ] Add project history, reusable blocks, rule profiles, and structured review of AI-suggested construction plans.
- [ ] Provide an end-to-end pipeline from image/style brief → confirmed design specification → measurements → parametric pieces → validation → export.
- [ ] Keep all AI-inferred features reviewable and distinguish estimates from measured facts.

## v1.30 — OpenRouter vision integration and quota guardrails

- Added server-side OpenRouter proxy using the `openrouter/free` router, with server-only API key configuration.
- Added explicit image-analysis action, structured vision JSON import, and a server quota status panel.
- Added an 8-request/day default cap, 3-request/minute per-client limit, 4 MiB image limit, 900 output-token cap, 45-second timeout, and no automatic retries.
- Added optional server access token for API routes, no-store responses, and fail-closed behavior when no OpenRouter key is configured.
- Added persistent UTC daily request counting without storing image bytes or prompt contents.
- Automated tests cover server authentication, quota metadata, static serving, and missing-key behavior. Live OpenRouter calls and browser-driven UI testing remain unverified.
