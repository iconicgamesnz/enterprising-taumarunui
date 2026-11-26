# ETI WEBSITE — PROFESSIONAL DELIVERY SPECIFICATION
Owner: Iconic Mahi, delivering for Enterprising Taumarunui (ETI)
Canonical source: this GitHub repository, main branch. Staging: https://taumarunui.netlify.app. Production WordPress/DNS/email must remain untouched until explicit ETI approval and a tested migration plan.

## Definition of done
A professional, responsive, accessible, content-complete site suitable for paid client handover. No dummy profiles, invented membership status, fake testimonials, broken controls, placeholder admin, or promises of functionality that does not exist. Verify on deployed Netlify and mobile, not merely in source code.

## 1. Business directory — top priority
- Comprehensive Taumarunui/Ruapehu business coverage, not merely ETI members. Research from legitimate public sources; maintain source URL, last checked date, business name, category, description, location, and independently verified public phone, email, website, social links and logo where licensed/authorized.
- Separate internal verification and ETI approval from public fields. Never publish payment, renewal, invoice, contact notes or private member records.
- Verify member status from ETI records and authorized confirmation, not from directory presence or assumption. Nonmembers can have useful basic listings; verified members can receive rich detail pages, subject to ETI approval.
- Robust search, categories, sort, mobile cards, accessible empty/error/loading states, safe external links, no XSS. Member detail pages must use safe rendering and stable slugs.
- Dedupe alternate names (e.g. King Country Glass/Novus); do not mark Inframax paid without confirmation. Current three records are candidates only, not live listings.
- Approval workflow and easy admin editing required. Import legacy directory only if provenance and accuracy can be verified. Check rights to reuse photographs and logos.

## 2. Events and Google Calendar
- Verify embedded calendar is the actual populated ETI Local Events calendar (primary vs secondary calendar ID).
- Public event submission: title, organizer, contact, date/time and timezone, venue, description, event link, optional image, consent, anti-spam.
- Pending queue, review/edit/approve/reject, audit log; approval must create/update the correct Google Calendar event through secure server-side authorization. Never expose credentials or API secrets in browser code. Handle duplicates, retries and cancellation.
- Test an event end-to-end, including timezone and mobile display.

## 3. Admin/CMS
- Firebase Auth and Firestore already provisioned; implement invitation-only owner/admin/editor authorization enforced by Firestore rules and server-side checks, not just hidden UI.
- Responsive, accessible dashboard: manage businesses, events, content, membership enquiries, media, drafts, publishing, restore/version history, audit trail and account management.
- Restrict public signup, protect private data, ensure owner recovery and test permissions. No unverified claim that admin works.

## 4. Content, design and trust
- Premium navy/gold/cream ETI identity with authentic logo and approved Taumarunui photography; source assets from approved originals.
- Complete About, membership ($25 individual/$50 business incl GST; membership year July–June), networking, contact, privacy and relevant pages. Confirm wording, contact information and committee approvals.
- Functional forms, email delivery/notifications, anti-spam, privacy disclosure and accessible validation. Verify Netlify form registration and notification routing.
- Responsive navigation, consistent spacing and typography, contrast, keyboard focus, screen reader semantics, optimized images, favicon, metadata, social previews, sitemap, robots and analytics only with appropriate consent.

## 5. QA, launch and handover
- Verify all links, forms, search/filter, mobile breakpoints, performance, accessibility, error states, permissions, security, backup and restore.
- Document costs, domain/DNS, email continuity, content ownership, ongoing maintenance and rollback. Preserve the existing site until ETI authorizes migration.
- Provide admin training and a clear handover checklist. ETI should be able to update routine content without coding.

## Implementation discipline
- Work directly in this repository, one canonical staging site, small testable commits.
- Do not label a feature complete unless tested end-to-end. Distinguish implemented, awaiting data/approval, and blocked.
- Do not populate with speculative business contacts or assert member status from ambiguous renewal records.
