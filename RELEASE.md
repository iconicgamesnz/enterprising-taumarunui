# ETI committee handover

## Daily tasks

Visit the Committee dashboard from the homepage footer. Use your own reviewer key. Check pending events each working day. Use Save edits to retain corrections to the event title, venue or NZ times before approval. Decline inappropriate or duplicate submissions. If publishing fails, retry the saved approval. Verify the event on Local Events. Correct or cancel a website-managed event in the committee dashboard. A repeating series can be edited or cancelled as a whole, or individual dates omitted using the exceptions field. The archive snapshot remains read-only.

For directory corrections, confirm details with the operator. Save, open the listing as a visitor, and use Restore previous version if needed. Unpublish closures. For new membership badges, check the current paid register including billboard memberships. Seven exact business-name matches were found in the treasurer’s 5 November records. Other trading names, including KoruForm, need individual confirmation before displaying a badge.

Membership fees cover July–June. The dashboard edits the public contact email and annual fees. **Testing notification policy:** never configure or send any test, form, deployment, integration or automated notification to ETI, its committee or its domain. Keep Netlify Forms disabled until the project owner manually removes all ETI recipient rules and verifies Iconic Mahi’s mailbox (hello@iconicmahi.co.nz) as the sole permitted destination. Do not send confirmation or test messages to ETI. Public contact details may remain visible; they are not notification recipients. During testing use the private queue and dashboard only. Do not enable notifications or change the official website without separate approval.

## Accounts and recovery

The site runs under the existing Iconic Games Netlify Pro team and the iconicgamesnz GitHub account. The project owner retrieves the bootstrap key from Blobs → the main branch event store → review-access. Use it to create individual reviewer keys in the dashboard, deliver each privately and revoke it when a reviewer leaves. Keep the bootstrap key with the owner. Deleting review-access rotates the bootstrap key. Lock the dashboard on shared devices. ETI should designate its own calendar owner, operational reviewer and a second person who can recover access. Check plan charges before adding paid seats.

The independent website calendar requires no Google credentials. After a separately approved public cutover, Google Calendar users may subscribe to the iCalendar URL /.netlify/functions/community-events?action=ical. This exports newly approved website events only, excludes organiser email, and is one-way; Google controls its refresh frequency. It cannot be fetched through the password-protected staging site. Do not send any notification or calendar invitation to ETI.

No new subscription was ordered. Functions, Blobs, builds and forms use the existing Netlify plan and are subject to team allowances. No fixed incremental monthly amount has been established. Confirm usage, ETI ownership, support responsibility and billing before a transfer. The WordPress contract, domain and email remain with their existing providers.

## Calendar comparison and old links

The staging download /calendar-comparison.csv lists all 3,911 published WordPress occurrences returned for 26 November 2026 to 26 November 2028. Recurring Google entries were expanded in Pacific/Auckland before comparing normalised titles and local starting minutes. 188 match. 3,723 have no exact match. All 188 in-range Google occurrences matched. No repeated title/start pair or explicitly cancelled calendar component was found. Missing or renamed events can still be cancelled, and matching starts do not establish equal duration or venue. Compare /legacy-events.html and the live WordPress source. Ask organisers about exceptions, holiday breaks and disputed times before importing. No events were bulk imported. The archive is a dated snapshot. Re-export and reconcile immediately before cutover.

Legacy links for membership, contact, about ETI, the town, event listings and the calendar have redirects. Known dated occurrences open in the snapshot. Historical event details outside the export, discontinued media/PDFs and posts require a WordPress export and individual redirect decisions. The visitor tourism link continues to Visit Ruapehu.

## Cutover and rollback

1. Sign off the privacy wording, retention/deletion timetable, branding and authorised operator access. Verify both form workflows without external notification; use only Iconic Mahi-approved test destinations. Verify publication in an isolated test calendar before any live ETI calendar write. Obtain approval for unmatched events and unmapped pages.
2. Request a full WordPress database and media backup from its host. Export the calendar, Google calendar ICS and both Netlify Forms CSVs. The Netlify project owner should back up main-branch Blobs in protected storage, including reviewer metadata, private research, directory edits and event decisions. Store credentials separately. Rehearse restoration to an isolated copy. Never put private exports in the public repository.
3. Record the current deploy ID, domain DNS values, TLS and email records. Only after separate approval, configure the custom domain, verify TLS and all redirects. Keep noindex on Netlify aliases and previews. Prepare host-specific robots headers so only the approved custom domain becomes indexable. Check this live before submitting a sitemap.
4. If cutover fails, restore the previous web DNS target or approved working deploy. Keep email records and the WordPress calendar licence untouched until ETI signs off. Keep Netlify Forms and the main Blobs store intact. Export all submissions received during the switch and reconcile them by ID before resuming processing. Never restore a datastore over newer entries.
5. The public repository and older Netlify deploys previously served the research records. Sanitising the current deployment cannot remove those historical copies. Privately archive the research first; the owner must separately approve restricting the repository and retiring affected old deploy URLs. Avoid rolling back to a publicly accessible unsanitised deploy.

## Workspace update

Use editor.html for existing pages, posts, media and users, workspace.html for new pages, menus, optional forms/comments and configuration restoration. Practice mode is local only. Real forms and comments are disabled by default and only the owner can enable collection after privacy approval. No email service is called. Configuration export is not a full backup. Do not remove visitor protection until historical files are securely archived and affected deploy URLs retired. The comparison CSV is no longer copied to the new public build.
