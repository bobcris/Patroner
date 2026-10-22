# Patroner v1.30 test report

Automated tests passed on the current development environment.

- Existing geometry, grading, all-six-size regression and drafting-engine checks passed.
- Multi-rule, manufacturing, image-analysis contract, assembly graph and image-to-draft gate tests passed.
- Standalone inline script syntax check passed.
- Server tests passed for access-token gating, status/quota metadata, static app serving, and fail-closed behavior when no OpenRouter key is configured.
- `configure-key.js` passes Node syntax validation.

No live OpenRouter request was made. Browser-driven interaction, model capability/availability, professional pattern-block comparisons, calibrated print output, and physical toile validation remain outstanding.
