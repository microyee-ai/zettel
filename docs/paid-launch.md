# Official desktop paid-launch plan

Research date: 2026-10-05. **Status: proposed scope; no billing implementation or live offer.** [ADR 0002](decisions/0002-desktop-licensing.md) defines the recommended design. No merchant credentials were provided, no callable Stripe connector was available, and this research did not create an account, sandbox, Product, Price, checkout, registration, key, or paid infrastructure. Reading public documentation through the Stripe CLI did not authenticate or activate a merchant.

The current free preview and Apache-2.0 source remain available. Never make a price card, test payment, ad-hoc signed archive, or successful source build stand in for a purchasable verified desktop product.

## Offer to validate and approve

Proposed customer copy:

> $49 once for official Zettel desktop distribution, with 12 months of updates and support. Keep the versions you acquire. Your local work keeps working when coverage ends. Renewal is optional. Free source builds remain available.

That copy is a hypothesis, not published terms. Define supported platforms, support channels/hours and response target, tax inclusion/exclusion by selling region, refund rules and applicable consumer rights, delivery timing, renewal price, security-maintenance policy, and archive retention before taking payment. Do not add blanket “no refunds,” perpetual all-update promises, or included AI/cloud usage. Have the maintainer's appropriate business/legal/tax reviewers settle the policy questions; implementation cannot infer their legal entity, registrations, or jurisdiction.

Recommended initial commercial unit: one named purchaser's official service entitlement across their own computers, without a hardware-bound activation quota. This is separate from their rights to use, modify, or redistribute Apache-covered software. Changes to business offerings must not retroactively remove acquired source rights. See the actual [Apache-2.0 license](https://www.apache.org/licenses/LICENSE-2.0).

Use a bounded contribution model before approving $49:

`contribution = net selling price − payment fees − refund/fraud reserve − support time cost − per-order service cost − allocated signing/security cost`

Inputs must be measured or explicitly labeled assumptions. For illustration only, 15 minutes of support at an assumed $60/hour consumes $15 of a $49 price before payment, hosting, refund, and maintenance costs. No observed demand or margin is established. Offering all future updates/support for $49 would add an unbounded liability; a 12-month service window and optional separately purchased renewal is the recommended experiment.

## External setup dependencies

| Dependency | Exact decision or evidence needed | Why it blocks live sales |
| --- | --- | --- |
| Merchant | Legal selling entity, eligible Stripe account, identity/business verification, bank/payout setup, statement descriptor, customer support contact | There is no merchant identity to charge on behalf of today |
| Product catalog | Approved SKU/offer version; immutable one-time USD Price for 4,900 cents; tax behavior; initial supported-platform allowlist; no surprise discount or currency conversion | A server must reconcile the purchased deliverable and amount |
| Tax/consumer policy | Selling regions, confirmed relevant registrations, correct product tax code from Stripe's current catalog, head-office settings, pricing/consent/refund policy | Configuration alone does not establish obligations or collection correctness |
| Billing API | HTTPS origin, durable SQL provider and backups, worker/scheduler execution, rate limiting, monitored operational owner | Static Vercel assets and local SQLite are not a payment ledger |
| Email | Provider/account, verified sender domain, SPF/DKIM/DMARC setup, transactional templates, bounce handling, redacted logs | Delivery and purchase recovery need a working channel |
| Entitlement signer | Ed25519-capable custody choice, separate sandbox/live keys, public key IDs, access and rotation/recovery procedures | An unsigned JSON flag is not an offline entitlement |
| macOS distribution | Apple Developer membership and identity, Developer ID signing, entitlements/hardened runtime review, notarization and stapling, Gatekeeper install evidence on each sold architecture | The current ad-hoc preview does not establish publisher trust |
| Windows distribution | Eligible publisher signing identity/service or CA certificate, secure CI signing, Authenticode verification, clean-host installation evidence | A configured NSIS target is not a trusted installable release |
| Linux distribution | Published signing/integrity policy, tested target distributions, artifact signature/checksum verification, upgrade and restore evidence | An AppImage configuration is not supported distribution evidence |
| Update service | Signed immutable release manifest, authenticated eligibility check, artifact retention, backup/migration/rollback strategy | “12 months of updates” needs a functioning delivery service |
| Support | Named owner, channel, hours, expected response, renewal/refund escalation, incident and business-closure plan | A one-time price must not conceal undefined ongoing promises |

Apple documents Developer ID and notarization as distinct distribution mechanisms; test the notarized artifact through the intended download/install path. Windows offers publisher-signing options including Artifact Signing where eligible; do not promise that signing alone eliminates all reputation prompts. No signing services were provisioned. [Apple Developer ID](https://developer.apple.com/developer-id/), [Microsoft code-signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

For Stripe Tax, first verify actual Tax Settings and confirmed applicable registrations. Only then enable `automatic_tax` and validate customer-location calculations using the intended product tax code. Zero tax can be legitimate or reflect missing setup; inspect the reason rather than assuming success. Recording a Stripe registration is distinct from registering with a tax authority. No tax code or registration is chosen in this plan. [Tax setup](https://docs.stripe.com/tax/set-up), [tax codes](https://docs.stripe.com/tax/tax-codes), [tax testing](https://docs.stripe.com/tax/testing)

## Proposed environment and configuration manifest

These names describe the next implementation; **they are not supported application settings yet**. Add a validated typed manifest and secret-free example only when implementing. Startup must reject missing or inconsistent values for an enabled sales deployment. The app continues free operation when commerce is absent.

| Proposed setting | Class / consumers | Required validation |
| --- | --- | --- |
| `ZETTEL_COMMERCE_ENV` | Public deployment config; API/worker | `development-sandbox`, `ci-sandbox`, or `live`; bound to expected account/Price/key IDs |
| `ZETTEL_SALES_ENABLED` | Server-only config | Default false; true only after explicit release and policy gates |
| `ZETTEL_COMMERCE_ORIGIN` | Public config; web/API | Exact HTTPS origin; loopback allowed only for development |
| `ZETTEL_ALLOWED_CHECKOUT_ORIGINS` | Server config | Finite origin allowlist; no wildcard with credentialed requests |
| `ZETTEL_CHECKOUT_SUCCESS_URL`, `ZETTEL_CHECKOUT_CANCEL_URL` | Server config | Same approved commerce origin; never accept these from a browser request |
| `ZETTEL_STRIPE_ACCOUNT_ID` | Server config | Expected account for webhook/API reconciliation; not a secret |
| `ZETTEL_STRIPE_API_VERSION` | Server config | Initially verified `2026-09-30.endive`; match pinned stripe-node 23.0.0 and webhook version; recheck at implementation |
| `ZETTEL_STRIPE_CHECKOUT_KEY` | Secret; checkout API | Environment-scoped restricted key with only required Session creation/catalog/customer capabilities proved in sandbox |
| `ZETTEL_STRIPE_RECONCILE_KEY` | Secret; worker | Separate restricted read permissions for Session/line items/payment/refund/dispute reconciliation; no refund creation by default |
| `ZETTEL_STRIPE_WEBHOOK_SECRET` | Secret; webhook receiver | Actual endpoint secret for this environment, distinct from Stripe API keys and the CLI listener secret |
| `ZETTEL_STRIPE_WEBHOOK_PREVIOUS_SECRET` | Optional temporary secret | Bounded rotation overlap; monitor removal date |
| `ZETTEL_STRIPE_DESKTOP_PRICE_ID` | Server catalog config | Retrieve and assert expected account/environment, active one-time Price, USD 4,900 amount, product/offer mapping and tax behavior |
| `ZETTEL_STRIPE_INTEGRATION_ID` | Server config | Stable label such as `zettel-desktop-` plus eight randomly generated letters; no customer data |
| `ZETTEL_TAX_POLICY_VERSION` | Server catalog config | Reviewed allowed-region/tax behavior record; enables automatic tax only after demonstrated setup |
| `ZETTEL_COMMERCE_DATABASE_URL` | Secret; API/worker | Durable provider connection, TLS, role permissions and exercised backup/restore |
| `ZETTEL_COMMERCE_JOB_AUTH` | Secret; scheduled worker endpoint if used | Strong random credential or provider workload identity; not a public cron URL alone |
| `ZETTEL_ENTITLEMENT_SIGNING_KEY_ID` | Server config | Must match configured private key and distributed public keyring |
| `ZETTEL_ENTITLEMENT_SIGNING_KEY_REF` | Secret reference; signer | A real Ed25519-capable vault/signing service; verify support before selection |
| `ZETTEL_ENTITLEMENT_PRIVATE_KEY_PKCS8_B64` | Optional secret; signer alternative | Use only if a managed signer is not selected; encrypted/secret storage, least access, backup/rotation plan; never both signer modes |
| `ZETTEL_ENTITLEMENT_PUBLIC_KEYS` | Public versioned asset/config; desktop/API | Allowlisted key ID → Ed25519 SPKI key; sandbox keys excluded from paid production acceptance |
| `ZETTEL_EMAIL_API_KEY`, `ZETTEL_EMAIL_FROM` | Secret plus sender config; notification worker | Least-privilege provider credential and verified sender; no email sending until explicitly configured |
| `ZETTEL_COMMERCE_DATA_ENCRYPTION_KEY` | Secret; PII/token-bearing job storage | Versioned encrypted-at-rest application fields if provider storage is insufficient; rotation/recovery tested |
| `ZETTEL_RELEASE_MANIFEST_ORIGIN` | Public config; desktop/API | Exact HTTPS distribution origin; signed immutable manifests, separately trusted release keys |
| `ZETTEL_SUPPORT_POLICY_VERSION`, `ZETTEL_REFUND_POLICY_VERSION`, `ZETTEL_PRIVACY_POLICY_VERSION` | Versioned catalog records | Published exact terms presented at purchase and retained with order |

Public frontend configuration needs only a commerce base URL and whether to show a verified live offer. A hosted-Checkout redirect does not require a publishable Stripe key or Stripe.js in the desktop renderer. No `VITE_*` variable may contain merchant, signing, email, database, or webhook secrets. On Vercel, use server-only sensitive environment settings or an appropriate secret provider; isolate previews from live secrets. [Key management](https://docs.stripe.com/keys-best-practices)

Do not give a universal “all payments” restricted key. Prove the minimum resource permissions against the actual SDK calls in the sandbox. Refund initiation can initially remain an authorized merchant Dashboard operation; the app still consumes and reconciles refund events. Any later refund API needs a separate role, key, authorization model, and audit tests.

## Scoped implementation issues and acceptance evidence

The IDs below are local proposed work items, not created external issues. Assign file ownership and a durable service provider before implementation.

| Work item | User outcome | Acceptance evidence |
| --- | --- | --- |
| PAY-01 / catalog and order API | Customer sees the exact supported offer and reaches its hosted Checkout | Server allowlist; disabled-sales state; no client amount/Price tampering; no open redirects; create-retry convergence; consent/policy version retained |
| PAY-02 / webhook ledger and worker | Paid orders complete even if the success page is closed | Raw-body signature fixture and real sandbox delivery; duplicate/concurrent/out-of-order handling; atomic event/outbox commit; crash recovery and reconciliation |
| PAY-03 / signed entitlement | Customer obtains one verifiable entitlement for each paid order | Ed25519 deterministic known-answer fixtures, strict parsing, key/environment isolation, exact-once issuance under worker races; no private key in any client artifact |
| PAY-04 / desktop activation and coverage | Customer imports a license offline and keeps working when coverage ends | Full packaged-client test with network blocked; dates visible; eligible release check; absent/invalid/refunded/expired-service states preserve create/edit/read/export/backup |
| PAY-05 / delivery and recovery | Purchaser recovers a lost license without disclosing workspace content | Verified email-only recovery; generic responses; single-use expiry; IDOR/CSRF/rate-limit tests; resend/reissue idempotency and provider-outage retry |
| PAY-06 / adjustments | Refund/dispute outcomes update paid services accurately | Partial/pending/failed/full refund fixtures; dispute suspended/won/lost/late-change fixtures; current-provider reconciliation; no local-work revocation |
| PAY-07 / signed updates | Customer receives only eligible authentic official updates | Signed release timestamp and artifact hash, publisher trust checks, no client-clock entitlement extension, clean install/update/restart/restore on each sold platform |
| PAY-08 / operational launch | Operator can safely maintain orders and customer commitments | DB restore, outbox replay, signer/email outage drills, key rotation, support/refund policy, data retention, incident owner, production configuration evidence |

Proposed test commands for those issues, **not commands supported today**: `npm run test:commerce` for deterministic API/ledger/signature cases, `npm run test:commerce:e2e` for sandbox Checkout and webhooks, and `npm run test:desktop-license` for the packaged-client scenarios. Tests must use isolated fixtures and sandbox accounts; no paid transaction is authorized by this document.

The next suite must demonstrate:

1. An unpaid asynchronous completion creates no entitlement; its later paid event creates exactly one; failure leaves normal local work available.
2. Concurrent copies of the same event and distinct event IDs for the same Session result in one paid order, one coverage period, one certificate. Notification retries do not duplicate issuance.
3. Wrong signatures, altered raw bytes, stale signed requests, wrong environment/account/Price/currency/quantity, and forged success URLs cannot grant access. Never disable signature freshness to make fixtures pass.
4. DB failure before event persistence returns retryable failure; a crash after durable acceptance but before signing/delivery is recovered. Replay after Stripe's idempotency cache window still cannot create a duplicate entitlement.
5. Refund/dispute events arriving before completion are reconciled against current Stripe state. Partial refunds are not treated as full refunds; failed/pending refunds are not marked succeeded. Restored/won outcomes recover the intended remaining services.
6. A license with one changed byte, a substituted key ID, an untrusted/sandbox key, invalid base64, oversized payload, wrong audience/environment, invalid timestamps, or unsupported schema is rejected without changing workspace data.
7. At the exact coverage boundary, release timestamps before the cutoff are eligible and timestamps at/after it are not. UTC month-end and leap-day fixtures match the published term. Clock rollback does not make a newly signed release eligible.
8. Offline mode, service outage, missing license, and expired update/support periods leave all ordinary local CRUD, search, notes, read, export, import, and backup usable. License import does not send tickets, notes, provider secrets, or device fingerprints.
9. Purchase Session IDs and order IDs alone cannot retrieve a license or PII. Recovery challenges expire and can be used only once; cross-order access, token replay, enumeration, and malicious return URLs fail.
10. Each sold OS/architecture passes the signed-artifact download → verification → install → activation → ticket creation → full restart → update → backup restore flow. The current preview does not satisfy these paid-distribution gates merely because its development executable opens.

## Privacy, operations, and launch decision

Keep commerce data apart from product workspace data. Minimum retained data is purchaser contact, opaque internal/provider references, offer/policy versions, amounts/tax outcomes needed for accounting, coverage, issuance/adjustment history, and limited delivery/abuse metadata. Do not collect local tickets, note content, AI prompts/keys, serial numbers, MAC addresses, or browsing history for licensing. Restrict staff access and redact event bodies, recovery tokens, certificates, and credentials from logs. A certificate contains pseudonymous identifiers but can still be sensitive because it links to a purchaser.

Adopt a retention schedule before launch: expired recovery secrets are promptly removed; raw webhook/contact-bearing job payloads have short operational retention; financial and adjustment records follow the merchant's confirmed legal/accounting needs; deletion requests distinguish those obligations from optional telemetry. Provide purchaser access/correction/recovery paths and a processor list. Do not invent a universal legal retention period.

The live switch stays false until the operator records: the approved exact offer/terms; merchant and tax setup; sandbox success plus all listed negative-path tests; verified supported artifacts; payment/entitlement/refund/recovery flow; dependency/security review; database and key restore; observability and incident ownership. Deployment/configuration can be prepared in advance, but no live products, infrastructure subscription, signing purchase, or charge is authorized by this research task.

Source retrieval notes: the host Stripe CLI was 1.40.6, so research used a temporary official 1.53.0 binary with the release checksum verified, without replacing the system CLI. Stripe's payments/security/tax skill references were read locally; their linked `/references/*` pages returned 404, so the corresponding public official API/documentation pages were used. Current API and SDK observations supersede the older version table in that skill. This records research provenance, not merchant readiness.
