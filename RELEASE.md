# ETI committee handover

## Daily tasks

Visit the Committee dashboard from the homepage footer. Use your own reviewer key. Check pending events each working day. Use Save edits to retain corrections to the event title, venue or NZ times before approval. Decline inappropriate or duplicate submissions. If publishing fails, retry the saved approval. Verify the event on Local Events. Correct a published event or cancel it directly in Google Calendar using a calendar editor account. For recurring events choose the intended occurrence or series.

For directory corrections, confirm details with the operator. Save, open the listing as a visitor, and use Restore previous version if needed. Unpublish closures. For new membership badges, check the current paid register including billboard memberships. Seven exact business-name matches were found in the treasurer’s 5 November records. Other trading names, including KoruForm, need individual confirmation before displaying a badge.

Membership fees cover July–June. The dashboard edits the public email and the two annual fees. The owner must separately update form notification recipients in Netlify. Netlify Forms → Submission notifications has a rule for info@taumarunui.co.nz covering both forms. The mailbox holder must accept Netlify’s confirmation email before notifications start. Verify receipt from both forms. Check Forms → Verified and Spam each working day until delivery is confirmed. Only authorised Netlify project users should have access to the form records.

## Accounts and recovery

The site runs under the existing Iconic Games Netlify Pro team and the iconicgamesnz GitHub account. The project owner retrieves the bootstrap key from Blobs → the main branch event store → review-access. Use it to create individual reviewer keys in the dashboard, deliver each privately and revoke it when a reviewer leaves. Keep the bootstrap key with the owner. Deleting review-access rotates the bootstrap key. Lock the dashboard on shared devices. ETI should designate its own calendar owner, operational reviewer and a second person who can recover access. Check plan charges before adding paid seats.

The public calendar ID is enterprisingtaumarunui@gmail.com (Local Events), confirmed by Niva on 26 November. Its public feed is readable. Enable Calendar API in the service account’s Google Cloud project. In Local Events, Settings and sharing → Share with specific people, grant the service account email “Make changes to events”. Store the service account credential only in Netlify Functions variable ETI_GOOGLE_SERVICE_ACCOUNT; the calendar ID is ETI_CALENDAR_ID. Redeploy, approve a labelled test, verify one public occurrence, then remove it in Calendar. Never put a credential in email, GitHub or chat.

No new subscription was ordered. Functions, Blobs, builds and forms use the existing Netlify plan and are subject to team allowances. No fixed incremental monthly amount has been established. Confirm usage, ETI ownership, support responsibility and billing before a transfer. The WordPress contract, domain and email remain with their existing providers.

## Calendar comparison and old links

The staging download /calendar-comparison.csv lists all 3,911 published WordPress occurrences returned for 26 November 2026 to 26 November 2028. Recurring Google entries were expanded in Pacific/Auckland before comparing normalised titles and local starting minutes. 188 match. 3,723 have no exact match. All 188 in-range Google occurrences matched. No repeated title/start pair or explicitly cancelled calendar component was found. Missing or renamed events can still be cancelled, and matching starts do not establish equal duration or venue. Compare /legacy-events.html and the live WordPress source. Ask organisers about exceptions, holiday breaks and disputed times before importing. No events were bulk imported. The archive is a dated snapshot. Re-export and reconcile immediately before cutover.

Legacy links for membership, contact, about ETI, the town, event listings and the calendar have redirects. Known dated occurrences open in the snapshot. Historical event details outside the export, discontinued media/PDFs and posts require a WordPress export and individual redirect decisions. The visitor tourism link continues to Visit Ruapehu.

## Cutover and rollback

1. Sign off the privacy wording, retention/deletion timetable, branding and authorised operator access. Record test receipt of both forms and one real approval in Local Events. Obtain approval for unmatched events and unmapped pages.
2. Request a full WordPress database and media backup from its host. Export the calendar, Google calendar ICS and both Netlify Forms CSVs. The Netlify project owner should back up main-branch Blobs in protected storage, including reviewer metadata, private research, directory edits and event decisions. Store credentials separately. Rehearse restoration to an isolated copy. Never put private exports in the public repository.
3. Record the current deploy ID, domain DNS values, TLS and email records. Only after separate approval, configure the custom domain, verify TLS and all redirects. Keep noindex on Netlify aliases and previews. Prepare host-specific robots headers so only the approved custom domain becomes indexable. Check this live before submitting a sitemap.
4. If cutover fails, restore the previous web DNS target or approved working deploy. Keep email records and the WordPress calendar licence untouched until ETI signs off. Keep Netlify Forms and the main Blobs store intact. Export all submissions received during the switch and reconcile them by ID before resuming processing. Never restore a datastore over newer entries.
5. The public repository and older Netlify deploys previously served the research records. Sanitising the current deployment cannot remove those historical copies. Privately archive the research first; the owner must separately approve restricting the repository and retiring affected old deploy URLs. Avoid rolling back to a publicly accessible unsanitised deploy.
