# Enterprising Taumarunui

Replacement website developed by Iconic Mahi. Staging: https://taumarunui.netlify.app. Official site remains unchanged.

This repository is the permanent source for the staging project. Do not deploy an incomplete source tree over the existing staging site. Never commit private membership records, credentials or service account keys.

Infrastructure: Netlify Functions and Blobs for independent event publishing; Google Calendar is an optional external view. Netlify Forms must remain disabled during testing. See [the committee handover](RELEASE.md).

### Community event review on Netlify

Organisers submit from What’s On. ETI reviewers open the Event review link on that page. The first attempt to open the queue creates a random reviewer key. A Netlify project owner can copy it from **Blobs → eti-events-… → review-access** in the project dashboard. Each source branch has a separate store. Keep the owner key private. Issue individual keys through the dashboard. Deleting the review-access entry rotates the key on the next sign-in attempt.

Approved events are stored independently in branch-scoped Netlify Blobs (public-events/). The calendar combines the existing occurrence snapshot with approved website events. Reviewers can add, edit, and cancel new events. Repeat options include daily, weekly, fortnightly, monthly by date, numbered weekday, and last weekday; an inclusive end date and explicit exclusions prevent automatic holiday assumptions. Existing archive occurrences remain read-only pending verified migration. Google Calendar can subscribe to the approved-event iCalendar feed after a public cutover; refresh intervals are controlled by Google. This is one-way, and the password-protected staging feed cannot be fetched by Google. No Google write synchronization is enabled. Only use Iconic Mahi for test notifications; never send ETI automated emails.

Run npm ci, npm run build and node --test for verification. Reconcile the latest public event data and image permissions before cutover. Do not deploy over the newer password-protected preview until source is reconciled.

### Optional automatic Google mirror

The scheduled calendar-mirror function is disabled unless ETI_GOOGLE_SYNC_ENABLED=true. It runs every 30 minutes when enabled in production. Use a dedicated mirror calendar (ETI_GOOGLE_MIRROR_CALENDAR_ID), not ETI's existing calendar, with an authorised service account (ETI_GOOGLE_SERVICE_ACCOUNT). It mirrors only website-approved events, uses stable occurrence IDs, compares hashes, and removes only events marked as managed by the mirror. It never adds attendees and uses sendUpdates=none. No setup, live credentials, calendar writes, invitations or subscription changes are authorised by staging tests. Test in an isolated calendar first. Imported archive occurrences are not mirrored until converted into approved website records. The native calendar works without this integration.
