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

Independent actual Chrome verification on November2,2026 passed the hold-only state fix: holds alone do not enable learning; routed review changes do; undoing an applied route enables a baseline rebuild; rebuilding restores36 training examples. This is scripted synthetic workflow verification, not a user study.

## November 3: recover from mistaken queue additions

Added confirmed removal of unreviewed requests and one-step undo. Reviewed/held decisions are protected; display numbers remain stable and are not reused. Undo preserves draft choices, reveals the restored row if filters hid it, and focuses its decision control. A reserved capacity slot prevents new additions from blocking recovery.

Verification: 22 Node tests including full-capacity, cancellation, second removal, session replacement, repeated undo, export-byte and model invariance. Existing adversarial, correction, lifecycle, diagnostics and 60-case synthetic evaluation remain unchanged. Browser regression `capture/removal.mjs` covers 1280/390px, keyboard confirmation/cancel, empty queue/undo focus, filter recovery, numbering and reviewed CSV invariance. Native cloud-browser cancellation and confirmation/undo checked separately. No classifier changes, new dependencies, automatic persistence or external transmission.

Exact event checked from QueueKind's Submitted To link on November 3: ML Empowerment Build Challenge 4.0; 44 participants (not a team/submission count), start November 1; use earlier rules deadline December 1, 21:00 Pacific rather than overview 23:45. Technical implementation 30%, UX 15%. Existing entry and historical video preserved.

## November 7: preserve imported request identity

Request IDs longer than 100 UTF-16 code units now reject the whole batch with a request-row number, instead of being silently truncated. Valid IDs retain whitespace, punctuation and Unicode; existing CSV quoting and spreadsheet-formula neutralization remain in place.

The dependency-free simulated lifecycle regression covers the 100/101-code-unit boundary, supplementary Unicode, colliding overlong prefixes, a valid row preceding an invalid row, unchanged queue/export/model/removal undo, stable numbering and exported UTF-8 bytes. This is not native/browser acceptance. Actual file-picker import and downloaded-file verification of this change remain pending; no browser check was run for this change.
