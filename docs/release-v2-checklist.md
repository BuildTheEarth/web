# v2 Release Checklist (remaining)

Everything fixed, committed or ticked off earlier is removed. Only open items are left.

## Before deploying

- [ ] Back up the production DB, then run the new migrations (including `20261031120000_backfill_onboarding_completed`).

## Test where Redis is available (not possible in the dev environment)

- [ ] Server-side answer validation: check the error messages actually reach the user in a production build (Next can replace server action error text with a generic one).
- [ ] Minecraft question on apply: a verified user entering a different name is rejected; an unverified user entering a name updates their profile name (stays unverified).
- [ ] Instant-accept teams: the applicant is added as a member, gets the DM and the builder role.
- [ ] Reviewer DM for a new application links to `<dashboard>/team/<slug>/applications/<id>` (uses `NEXTAUTH_URL`, falls back to `https://my.buildtheearth.net`).

## Tracked in issues

- #174 showcase image page for build teams
- #175 migrate `team.claim.list` holders to `team.claim.edit`
- #176 validate webhook, icon, banner and invite URLs
- #177 `?claim=<id>` deep link on `/map`
- #178 claim image upload
- #179 staff manage claim owner and builders
- #180 Discord claim update embed
- #146 / #145 claim drawer rework and claim page

## Housekeeping

- [ ] Uncommitted local edit in `apps/dashboard/src/app/auth/signup/page.tsx` (removes `{ prompt: 'create' }` from `signIn`). Commit or discard.
- [ ] `apps/*/next-env.d.ts` formatting noise from the dev server. Discard.
