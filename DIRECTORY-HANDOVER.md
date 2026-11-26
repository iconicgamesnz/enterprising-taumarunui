# ETI Taumarunui Business Directory — Handover and maintenance
Updated: 26 November 2026

## Where it lives
- Staging directory: https://taumarunui.netlify.app/directory.html
- Source data: `businesses.json`
- Directory view: `directory.html`, `directory.js`
- Profile view: `business.html`, `business.js`
- Shared responsive styling: `style.css`
- The existing production domain taumarunui.co.nz has **not** been changed.

## Current delivery
- 203 researched records.
- 134 records marked `approved:true` for the public staging directory.
- 69 records held out of the public view for research, closed operations, potential duplicates or insufficiently current evidence.
- Published listings are in 20 searchable categories. Search accepts business name, location, services, or category. Sort by name or show ETI members first; there is a confirmed-member-only filter.
- Every public business has an individual profile URL `business.html?business=...`.
- Telephone links and external website links are rendered only when safe; member badge and enhanced services section appear only when `member:true`.
- KoruForm: ETI membership confirmed by a local ETI contributor; no public billing data.
- Café & Restaurant 75: locally confirmed CLOSED and deliberately excluded. Thai Spoon is a separate published record at 75 Hakiaha Street.

## Important evidence limits
A public directory listing, NZBN registration or historic campaign appearance does **not** prove a business is still trading. This directory is a useful community resource, not a certified complete census of all trading businesses. Some published records still depend on publicly available business directories rather than direct operator confirmation. Review contact details before a formal ETI handover; do not treat `approved:true` as an ETI endorsement.

Known matters needing confirmation:
- King Country Glass & Home Plus: conflicting addresses in official company and Visit Ruapehu listings.
- Harcourts Taumarunui: historic online references, not sufficiently confirmed as a current separate office.
- Country, accommodation and rural operators: check current trading season/contact details where public listings are sparse.
- The remaining unpublished research candidates should stay hidden until verified as current trading businesses, separate entities and within the geographic service area.

## Safe editing workflow
1. Check an official business site, current operator announcement, specialist directory or current reputable local source. Save a working `source` and `checked` date.
2. Use the actual trading name and a concise non-promotional description. Check for an existing alias before adding a second record.
3. Keep `approved:false` for uncorroborated, historical, ambiguous, closed or duplicate leads; note `verification_status` and reasons. Never invent a phone number, street address, hours or website.
4. Change `approved:true` only when satisfied that a current business listing is evidenced. A listing alone is not ETI membership.
5. Set `member:true` only after ETI directly confirms the business is a current member; never expose member payment records, arrears, contact lists or invoices.
6. Accept changes through ETI's public directory correction email link; independently verify corrections before publishing.
7. Confirm the GitHub commit has built on the Netlify staging project; inspect the category/search/profile flows on a mobile browser before production cutover.
8. Review the directory quarterly and after local closures, relocations or renames. The site's automatic deployment does not automatically verify business operations.

## Minimum regression QA
- Validate JSON and unique business names; no published record has `operating_status:"closed"`.
- Search by category, location, name and text; try no-results and reset controls.
- Check the member-only filter and KoruForm badge/profile details; confirm ordinary entries have no badge.
- Open first, middle and last profiles. Check back navigation, website and telephone links, link safety, and mobile layouts.
- Ensure hidden research candidates and Café 75 never appear in search results or profiles.
- Check staging Netlify deploy state and commit reference; verify noindex headers are still present.
- Do not migrate production or change ETI DNS without explicit ETI approval.
