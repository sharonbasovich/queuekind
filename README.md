# QueueKind

A browser-local administrative request-routing workbench for volunteer teams. Train a small, transparent text classifier from labeled examples, inspect where it fails, and review every request before exporting a decision.

**This is an experimental human-review aid, not an autonomous routing system.** It does not assess urgency, service eligibility or priority, and is not an emergency-response or clinical tool.

## Try it locally

No API key, account, package installation or external dependency is needed. Use an existing static HTTP server; for example, if Python 3 is installed:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 in your browser. ES modules need HTTP rather than opening the HTML directly. The runtime files are `index.html`, `style.css`, `app.js`, `model.js`, `csv.js`, `data.js` and `diagnostics.js`.

With a recent Node.js installation, run the tests or create a static distribution:

```sh
npm test
node qa/adversarial.mjs
node qa/correction.mjs
node qa/lifecycle.mjs
node qa/diagnostics-v2.mjs
node qa/evaluation/run.mjs
npm run build
```

The build copies seven runtime files into `dist/`. No dependency installation is required.

## A five-minute walkthrough

1. Load the synthetic sample. It contains 48 entirely fictional labeled examples and six fictional requests—not real organization data.
2. Open **Check**. Training uses 36 examples and reserves 12. See the five mismatches first, their expected/suggested routes and confusion counts; expand the seven matching cases.
3. Open **Review**. Read the entire request and both suggestions. Model scores are not probabilities.
4. Choose a route yourself and mark it reviewed. If no route fits, choose **Hold for follow-up / no suitable route**. A held request exports without a route and does not enter training.
5. Undo a decision if needed. Retrain from reviewed routes, while the original check examples remain excluded. Repeated checks are not fresh independent validation.
6. Export reviewed requests to CSV before reloading or closing the page.

To use your own examples, import a CSV with `text,label` columns: at least two routes and six unique examples per route. New requests use a `text` column and optional `id`. Remove identifying or sensitive information first. A new route requires a suitable imported training set, not a one-example class added during review.

## What the evidence says

These are small synthetic evaluations, not evidence of operational reliability:

| Check | Observed result |
| --- | --- |
| Starter split: 36 training, 12 held-out | 7/12 suggestions match supplied labels; macro F1 about 58% |
| Separately prepared 60-case synthetic evaluation: 32 clear-intent cases | 23/32 match supplied labels |
| Same evaluation: 12 negation/contrast cases | 8/12 match supplied labels |

The same evaluation flags 22/32 clear-intent cases, 12/12 negation cases, 6/8 mixed-intent cases and 8/8 out-of-scope cases for closer review. Mixed and out-of-scope cases have no single expected route and are not scored for routing accuracy.

Reproduce these results with `node qa/evaluation/run.mjs`. The [frozen cases](qa/evaluation/cases.json), [computed results](qa/evaluation/results.json) and [evaluation provenance](qa/evaluation/PROVENANCE.md) are included. The set was engineer-blind when frozen, not fully double-blind; its author inherited earlier failure context. Now that cases are public, they are not a fresh blind test for future tuning.

The remaining 16 cases assess other situations; the table is not an overall 60-case accuracy claim. Cases were not added to training. All labels are evaluation annotations, not verified ground truth. Warning heuristics can flag otherwise clear requests and miss difficult ones: warnings create a real review burden, not a calibrated safety guarantee. Every request requires human review, including high-scoring requests without warnings.

The read-only diagnostics make mismatches visible; they do not improve prediction accuracy. Inspect label quality as well as model mistakes. Collect genuinely varied new labeled examples rather than copying check rows into training. After tuning based on these results, the same check set is not independent validation of those changes. No real-user study, adoption, measured time saving or impact is claimed.

## Model and limitations

- Multinomial Naive Bayes with Unicode tokenization, lowercase normalization, common English stop-word filtering, Laplace smoothing and empirical class priors.
- Deterministic stratified holdout reserves approximately 25% per route, floored with a minimum of one. At the six-example minimum, one check example is too little to establish reliability.
- Identical bag-of-words count fingerprints are deduplicated before splitting. Conflicting labels for identical features are rejected. The correction path excludes held-out fingerprints. Semantic paraphrases may remain similar; this is not a semantic leakage detector.
- Relative normalized scores are **not calibrated probabilities**. Low vocabulary support, unfamiliar wording, top score below 0.75 or top-two margin below 0.35 trigger review warnings.
- The model does not understand word order, negation scope or multiple intentions. Conservative English negation/contrast cues trigger warnings without changing scores or routes. Implicit or non-English meanings may be missed.
- Only the first 500 content tokens affect scores. Longer inputs receive a truncation warning. Repetition is flagged when at least 10 retained tokens include one token at least five times and at least 40% of the total. These unvalidated thresholds may over-warn and do not correct the suggestion.
- Class imbalance above 3:1 is flagged. Retraining refuses corrections leaving fewer than three training examples in a route.
- Size limits: 3,000 rows, 20 labels, 4,000 characters per request, 60 characters per label, 2 MB per CSV import.

## Data handling

Processing happens in the browser page, with no model API calls, analytics, cookies, localStorage or backend. The app does not send messages or automatically route requests. This describes the app implementation, not the security of your browser, extensions, computer, hosting provider or exported files.

Reloading or closing the page loses the session. Export reviewed work first. CSV export neutralizes formula-like prefixes to reduce spreadsheet injection risk, but exported text can still contain private data: inspect it before sharing.

## Verification and attribution

See [QA.md](QA.md) for automated checks, browser observations and unverified areas. Passing tests is not a production-readiness or accessibility certification.

QueueKind was developed with AI-assisted implementation, test generation and independent AI-assisted review. The classifier itself is local multinomial Naive Bayes, not a generative model. Demonstration and evaluation examples are synthetic.

## License

MIT. See [LICENSE](LICENSE).
