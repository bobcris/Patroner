# Patroner v1.27 — Manufacturing integrity

## Scope

v1.27 introduces reusable manufacturing contracts and diagnostics shared by garment families. It does not claim industrial CAD/CAM certification.

## Pattern-piece metadata contract

Each piece records a stable `id`, human-readable `name`, `garment` family, valid `outline`, `cutQuantity` (integer 1–100), explicit `onFold` status, `fabricDirection`, and non-negative `seamAllowanceMm`. Pieces not marked on-fold require a non-zero grainline vector (`start`, `end`). Directional nap/print choices raise a review warning.

## Seam-pair comparison

A seam descriptor records `pieceId`, `seamId`, and an ordered polyline in millimetres. `compareSeamPair` calculates each sew-line length and absolute delta; a pair passes when the delta is within the configured tolerance. This is a length comparison, not a complete sewing-walk simulation and does not automatically add or remove ease.

## Seam allowance distance sampling

`validateSeamAllowanceDistance` samples the midpoint of each stitch-line edge and measures the nearest distance to the cut-outline edges. Callers may exclude edges such as the centre fold. Sampling can identify many allowance inconsistencies, but it cannot prove continuous distance around curved boundaries, sharp corners, offset cusps or complex concavities. A robust production kernel should use adaptive sampling and explicit corner-join policies.

## Print calibration

`validatePrintCalibration` compares a known expected dimension (default 100 mm) with the user's measured printed dimension. It reports print scale percentage and absolute percentage error. The user must print at Actual Size / 100% with fit-to-page disabled.

## Tile continuity

`validateTileContinuity` compares adjacent tile edge endpoints with a configurable tolerance and indicates likely endpoint order. It does not reconstruct page clipping or verify the complete tiled PDF; PDF-renderer regression fixtures remain outstanding.

## In-app workflow

The manufacturing panel validates the current skirt panel's piece metadata, user-entered seam lengths, the current cut outline's seam allowance samples, a measured calibration square, and a tile-edge gap. User-entered seam lengths are explicitly treated as diagnostics, not automatically derived piece seams.

## Validation status

Automated tests cover metadata requirements, duplicate piece IDs, seam tolerance, seam allowance sampling on rectangular fixtures, calibration error, tile continuity, rule-stack integration, existing six-size regressions, and inline JavaScript syntax. Browser interaction tests, rendered PDF measurements, professional block comparisons, and sewn-toile validation remain outstanding.
