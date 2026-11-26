# Enterprising Taumarunui

Replacement website developed by Iconic Mahi. Staging: https://taumarunui.netlify.app. Official site remains unchanged.

This repository is the permanent source for the staging project. Do not deploy an incomplete source tree over the existing staging site. Never commit private membership records, credentials or service account keys.

Infrastructure: Netlify Functions and Blobs for independent event publishing; Google Calendar is an optional external view. Netlify Forms must remain disabled during testing. See [the committee handover](RELEASE.md).

### Community event review on Netlify

Organisers submit from What’s On. ETI reviewers open the Event review link on that page. The first attempt to open the queue creates a random reviewer key. A Netlify project owner can copy it from **Blobs → eti-events-… → review-access** in the project dashboard. Each source branch has a separate store. Keep the owner key private. Issue individual keys through the dashboard. Deleting the review-access entry rotates the key on the next sign-in attempt.

Approved events are stored independently in branch-scoped Netlify Blobs (public-events/). The calendar combines the existing occurrence snapshot with approved website events. Reviewers can add, edit, and cancel new events. Google Calendar write synchronization is not enabled; no Google credentials are required to approve an event. Existing archive occurrences remain read-only pending migration and recurring-series management. Only use Iconic Mahi for test notifications; never send ETI automated emails.

Run npm ci, npm run build and node --test for verification. Reconcile the latest public event data and image permissions before cutover. Do not deploy over the newer password-protected preview until source is reconciled.
