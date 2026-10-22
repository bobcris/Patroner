# Patroner v1.22 — geometry validation contract

## Scope

This milestone strengthens computational checks around the existing experimental quarter-skirt demonstrator. It does not certify a production pattern or fit.

## Coordinate contract

- Body measurements and construction allowances are entered in centimetres.
- Pattern coordinates and geometric lengths are in millimetres.
- Polygons use implicit closure; do not repeat the first point as the final point.
- The current outline contract remains 16 points: centre-fold waist, side waist, 12 sampled side-seam points, side hem, centre-fold hem.
- Numeric geometry tolerance defaults to 0.02 mm unless a check explicitly supplies another tolerance.

## Geometry engine checks

- Finite coordinate validation and minimum vertex count.
- Signed/absolute area, perimeter, axis-aligned bounds, and per-edge lengths.
- Near-zero edge detection.
- Non-adjacent segment intersection detection, including collinear overlap and endpoint contact.
- Offset polygon construction with degenerate-edge checks and a miter safety limit.
- Seam-polyline length comparison with explicit millimetre tolerance and percentage delta.

## UI validation

The geometry report combines existing structural checks with engine topology checks for both stitch outline and cut polygon. It also verifies the centre-fold anchor alignment and reports stitch/cut side-segment lengths. A green structural report means only that these computational invariants passed; it is not a fit or sewing certification.

## Export metadata

The project JSON export now contains a versioned schema, application version, unit conventions, provisional chart identity, grading mode/rule version, measurements, validation results, geometry analysis, pattern linework, and explicit limitations. `created_at` is a UTC ISO timestamp.

## Test coverage

Automated tests cover rectangle area/perimeter/bounds, self-intersecting bow-tie rejection, duplicate adjacent points, too-few-point failure handling, strict segment crossing, collinear overlap, seam tolerance, rectangular offset bounds, degenerate offset rejection, all six standard profiles, monotonic chart progression, point-grading identity and deltas, and invalid input handling.

## Known limitations / next gates

1. The standard chart is a provisional product configuration, not a universal sizing standard.
2. The current side-seam curve and dart placement are illustrative.
3. Seam allowance generation still needs curve-aware offset validation and corner-specific rules for production use.
4. Notches are currently diagnostic marks, not a full matched-seam/notch specification.
5. Add browser interaction tests, trusted reference-block fixtures, fabric/toile tests, and expert sign-off before production use.
