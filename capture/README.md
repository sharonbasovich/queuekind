# Reproduce the QueueKind browser demonstration

This experimental capture harness drives the actual static application in Chromium.
It does not inject replacement UI, mock the model, or redraw screenshots. All inputs
are synthetic. It records a silent112-second workflow; it is not a real-user study,
an audio review, or evidence of reliable real-world routing.

## Requirements and execution
Use Node24.22.1 on Linux. From the repository root:

```sh
npm test
npm run build
npm ci --ignore-scripts --prefix capture
./capture/node_modules/.bin/playwright install --with-deps chromium
node capture/serve.mjs
```

In a second terminal, from the same repository root:

```sh
QUEUEKIND_FILM=1 node capture/record.mjs
```

Without `QUEUEKIND_FILM=1`, the assertions run without film pacing. Such output is
a test recording, not the timed demonstration. Stop the static server afterward.
Capture dependencies are isolated from the dependency-free application.

## What is checked
Before opening Chromium, the script requires exact source/build equality and the
seven runtime SHA256 hashes in `runtime-manifest.json`. That manifest identifies
the reviewed application revision; the audit separately records the workflow's
Git commit. Changes to runtime files require review and a corresponding manifest
update, not silently removing the checks.

A separate browser context first imports48 synthetic labeled examples and two
synthetic requests through real file inputs. It checks invalid-header and over-2MB
rejection without queue changes. This uses Playwright file-input automation, not
an operating-system file chooser.

The recorded session loads the48-example/six-request sample, inspects held-out
metrics and actual mismatches, holds an unsupported request, manually routes one
request, exports both decisions, and retrains from only the routed review. The
actual downloaded CSV is parsed and checked for labels, review statuses, review-time
model versions and synthetic provenance. Its SHA256 is retained. The same held-out
set is reused after correction; that is not fresh independent validation.

## Outputs and review
`capture-output/` contains the raw silent WebM, real-app screenshots, downloaded
CSV, audit JSON, import QA and failure evidence when applicable. The audit includes
commit IDs, runtime hashes, event times, browser errors and export verification.

`captions-plan.srt` is a draft plan, not verified subtitles. Its clock starts after
navigation settles while the raw recording starts at page creation. Review actual
frames and event times, account for the approximate offset in the audit, and retime
captions before rendering a final film. Never infer a successful run from the
presence of this script. At preparation time, capture execution is not yet verified.

Before publishing a finished film, review the complete recording frame-by-frame,
check caption-to-screen alignment, legibility, cropping, loading/blank frames,
encoded duration and absence of audio. Confirm that the CSV/audit and all visible
results belong to the same recorded commit. Screenshots also require visual review.

## GitHub Actions boundaries
The proposed workflow runs only on manual dispatch, only for a public repository,
on a standard `ubuntu-24.04` runner with a15-minute job timeout. It requests only
`contents: read`, does not persist checkout credentials, and uses no secrets or
new credentials. It installs the pinned capture-only dependencies and Chromium;
it does not deploy, push source changes, submit contest entries or contact users.
Browser requests outside the loopback app are blocked and recorded as failures.

The workflow uploads generated evidence using the Actions artifact service with
three-day retention. Anyone able to access the public repository's run artifacts
may see those synthetic files. Do not substitute private user data into this
workflow. Review runtime source, dependency pins and workflow permissions before
running a modified version.
