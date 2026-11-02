# Synthetic evaluation provenance

These 60 cases were prepared by a separate AI-assisted evaluator and frozen on November 2, 2026, before the implementation engineer received them. Exact SHA256: `ec565c0abb8622b376c4255a4653365f3446af71f203ee72b0a3fb1cd82f7995`. The case file is preserved byte-for-byte.

There are 32 clear-intent cases (eight per route), 12 negation/contrast cases (three per route), eight mixed-intent cases and eight out-of-scope cases. The evaluator did not inspect training text or prior challenge files before authoring, but inherited context included earlier failures and interest in negation handling. This was engineer-blind at freeze time, **not fully double-blind or knowledge-isolated**.

Cases and expected labels are synthetic evaluator judgments, not representative real-world data, verified ground truth or a user study. Mixed-intent and out-of-scope cases have no single expected route; report their warning rates, not routing accuracy. Relative model scores are not probabilities. Warning rates are not proof of safe abstention: all requests still require human review.

The public runner evaluates only the shipped model against its unchanged synthetic training partition. It does not use these cases for training or threshold tuning. It checks the frozen case hash, asserts the reported subgroup counts and writes per-case results to `results.json`.

From the project root:

```sh
node qa/evaluation/run.mjs
```

The cases are now public and therefore cannot serve as a fresh blind evaluation for future tuning.
