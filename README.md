# Enterprising Taumarunui

Replacement website developed by Iconic Mahi. Staging: https://taumarunui.netlify.app. Official site remains unchanged.

This repository is the permanent source for the staging project. Do not deploy an incomplete source tree over the existing staging site. Never commit private membership records, credentials or service account keys.

Infrastructure: Netlify Functions, Forms and Blobs, with Google Calendar for approved events. See [the committee handover](RELEASE.md).

### Community event review on Netlify

Organisers submit from What’s On. ETI reviewers open the Event review link on that page. The first attempt to open the queue creates a random reviewer key. A Netlify project owner can copy it from **Blobs → eti-events-… → review-access** in the project dashboard. Each source branch has a separate store. Keep the owner key private. Issue individual keys through the dashboard. Deleting the review-access entry rotates the key on the next sign-in attempt.

To enable publication, set two Functions environment variables for the intended Netlify deployment context and redeploy:

- ETI_CALENDAR_ID — the exact public community calendar ID from the calendar owner. This sets the publication destination and the website embed.
- ETI_GOOGLE_SERVICE_ACCOUNT — a Google service account JSON credential. Enable the Google Calendar API for its project and grant its client email permission to make changes to events on that calendar. Keep the JSON in Netlify secrets.

An interrupted approval preserves its edited details. Retrying publishes the same Google event ID. The organiser email stays in the private queue. Netlify project owners can remove old records from Blobs. Run npm ci, npm run build and node --test for local verification.
