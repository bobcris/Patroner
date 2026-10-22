# Patroner v1.28 — AI visual analysis and assembly graph

## Purpose

This milestone adds a reliable contract between an external vision-capable model and Patroner’s drafting engine. It deliberately separates visual interpretation from measured body dimensions and from production geometry.

## Structured vision analysis

`validateVisionAnalysis(input)` accepts a versioned normalized report with:

- garment family and available views;
- feature values classified as `visible`, `inferred`, or `unknown`;
- confidence scores from 0 to 1;
- missing body measurements and questions for the user;
- unobservable details, such as internal facings or hidden closures.

The validator rejects unsupported garment families and invalid confidence values. Unclassified strings are retained as unconfirmed values and generate warnings. Low-confidence inferred features require review. Any numeric image-derived dimensions are deliberately excluded from the normalized output; a known reference scale and user confirmation are required before dimensions can enter a pattern specification.

This is a schema and uncertainty validator only. The standalone application does not call a vision model, upload images, or infer garment features itself.

## Assembly graph

`validateAssemblyGraph(graph)` checks stable unique piece IDs, unique join IDs, valid references to existing pieces, self-joins, and whether the graph has disconnected components. Joins carry named seam identifiers for later matching.

Connectivity is not proof of sewing compatibility. Seam lengths, geometry, ease distribution, construction order and physical fit require independent validation.

## UI

The application provides JSON paste/import fields for external vision results and assembly graphs, displays normalized reports, and exports reports as JSON. It runs locally in the browser.

## Safety and production boundary

The design-intent status is never represented as production-ready. Image interpretation cannot recover reliable body measurements from a single uncalibrated fashion photograph. The user must confirm inferred details, supply body measurements, and validate the resulting blocks with professional references and toile fitting.
