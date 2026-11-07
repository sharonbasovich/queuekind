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

## November 7: deterministic duplicate representatives

Feature-equivalent examples with the same label now retain the lexicographically smallest trimmed original text (JavaScript UTF-16 string order), rather than whichever spelling arrived first. This makes the training/check partitions reproducible when the same rows are reordered. Conflicting labels still reject, duplicates still count once, and held-out feature exclusion remains unchanged.

Regression: placing `Can I pick up a grocery hamper this week?!!!` before versus after the unchanged 48 sample rows previously changed the check set and produced 6/12 versus 7/12 matches. Both orders now produce 7/12. The original sample without duplicates keeps precisely the same split, fitted model, predictions, explanations and metrics (macro F1 0.5809523809523809).

This is **row-permutation invariance**, not invariance to adding or removing equivalent spellings. Splitting still hashes the selected original text. For example, adding `!!!Are there vegetarian meals available today?` selects a different representative and can change the check partition. Hashing feature fingerprints instead would provide the stronger property but also reassign the existing default check set and invalidate comparisons with its published baseline; that broader change is not part of this correction. Do not treat re-imported, modified datasets as the same fixed evaluation set.

Three focused Node regressions cover duplicate position, punctuation/word-order/stop-word variants across permutations, and conflicting-label rejection. All pass on the correction; two fail on the preceding model. The release candidate passes all 31 Node tests, all five README QA scripts and the static build. All nine distribution files match their runtime sources byte for byte.

The current capture source-verification manifest and its guards use the new `split-integrity-v1` identity and updated model hash. This prepares future browser verification; it does not record a browser run. The historical `capture/runtime-manifest.json` remains unchanged. Earlier browser observations above describe earlier versions, not acceptance of this correction. No native/browser acceptance, file-picker import or downloaded-file check was run for this model correction.
