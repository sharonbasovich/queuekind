# Verification notes

## Automated checks

- 19 built-in Node tests cover deterministic splits, prediction behavior, held-out exclusion, correction integrity, CSV escaping and formula neutralization, warning thresholds and read-only diagnostics.
- 22 additional adversarial checks cover malformed CSV, reserved labels, duplicate feature leakage and low-support predictions.
- Correction-integrity checks verify conflicting reviewed labels and missing-class evaluation behavior.
- A focused review-state regression verifies hold-only, mixed/routed, already-applied and undone reviews: only routed decision changes enable learning; held decisions remain exportable.
- A simulated DOM lifecycle test covers model versioning, fixed holdout disclosure, review-time export version, per-request provenance, undo/retrain, focus restoration hooks and stale asynchronous imports.
- Diagnostic invariance tests compare split, predictions and metrics to a frozen baseline, verify confusion counts, hostile-label escaping, empty/zero-mismatch handling and absence of training actions.

The lifecycle simulation is not a real browser test. Run commands are in README.md.

## Browser observations

Desktop Chrome and a 388 CSS-pixel-wide browser preview were inspected. Sample loading, training, mismatch display, review, holding an unknown request, undo, retraining and export confirmation were exercised. Matching-case disclosure opens with Enter and has visible focus. Narrow cards reflow without observed horizontal page overflow. Empty and overlong request input were rejected with valid-input recovery.

Source includes reduced-motion support. No physical mobile-device test, screen-reader study, comprehensive accessibility audit or real-user usability study has been performed.

## Remaining limitations

Actual browser file-picker import has not been verified. Parser edge cases and stale file-read behavior have automated coverage, but this is not a substitute for end-to-end upload testing. Export confirmation was exercised in the browser; exact serialization was checked by automated tests rather than inspecting browser download bytes.

Synthetic results in README.md do not establish real-world accuracy. A high relative score can still be wrong. Repeated checks after tuning are not independent validation. No production-readiness claim is made.
