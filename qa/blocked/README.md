# Blocked disciplines

One entry per discipline that cannot execute here: the blocker, and what would
unblock it. The detailed files carry the spec to write on that day, so unblocking
is a matter of writing tests rather than re-deriving what the tests should be.

The dominant blocker is the absence of a staging environment. See
`qa/registers/environment.md` for what creating one would cost and unlock.

| TR | Discipline | Blocker |
|---|---|---|
| TR-03 | Integration & contract | No CI to run the weekly drift job the exit criterion requires; Pact/WireMock not installed |
| TR-06 | End-to-end & system | Every journey mutates; no staging. **Spec written — see TR-06.md** |
| TR-07 | Mobile (device half) | No Detox harness, no physical low-end handset. Unit half is done. |
| TR-10 | Exploratory | Manual — 20 timeboxed charters with written debriefs |
| TR-13 | Manual payout reconciliation | Decision E-7 unresolved; needs a real bank statement |
| TR-15 | Concurrency & races | Requires concurrent real mutations against a live ledger |
| TR-16 | Auth, OTP & session | Rate-limit assertions require billable OTP sends; sender is denylisted |
| TR-18 | Penetration test | CERT-In empanelled auditor, ₹1.5–5 lakh. The one unavoidable paid item. |
| TR-20 | Secondary datastore | Firebase client config absent; region + notice are decision E-4 |
| TR-21 | Privacy & DPDPA | Erasure test requires creating and deleting a real user |
| TR-22 | Regulatory & tax | Decision E-1 — the calculation layer may not exist yet |
| TR-24 | Accessibility | Not started. axe/Lighthouse against a local dev server is the tractable next step. |
| TR-25 | Usability & UAT | Manual — 6–8 participants per group, SUS > 68 |
| TR-26 | Compatibility & device | Real-device cloud or physical handsets |
| TR-27 | Localisation | Not started. IST midnight-boundary logic is the tractable part. |
| TR-28 | Email deliverability | Requires real sends through the production SMTP relay |
| TR-29 | Push notifications | Requires real devices and real sends |
| TR-30 | Soak/spike/stress | Would load the live project. Explicitly refused. |
| TR-31 | Chaos | Requires breaking dependencies in a staging environment |
| TR-32 | Fallback & failover | **No fallback exists yet to test.** See TR-32.md |
| TR-33 | Backup & DR | Restore into a clean project = a second project; decision E-8 |
| TR-35 | Observability | No Sentry/Checkly configured; nothing to validate |
| TR-37 | Beta / pilot | Real cohort, real money |
