// Support page — the public "Support URL" both app stores require.
//
// App Store Connect makes this a required field and expects a page carrying
// real support information and a contact route, not a marketing homepage.
// Play uses the same URL under Store settings.
//
// Must stay publicly readable: a reviewer will open it while signed out, so
// "/support" is registered in ProtectedRoute's publicPaths. If that entry is
// ever removed the page silently starts redirecting to /login and the store
// listing's support link breaks.
//
// Response-time commitments below mirror Section 18 of the Privacy & Cookie
// Policy (24-hour acknowledgment, 15-day resolution). Keep the two in step —
// this page is a public promise.

const LINK = "color: rgb(124, 58, 237); font-weight: 600;";

export const supportHtml = `
<p><strong>SUPPORT</strong></p>
<p><em>RGossips — Influencer Marketing Platform</em></p>
<p>Operated by RUDE LABS Private Limited</p>

<h1>1. Contact us</h1>
<p>We answer every message. Pick whichever channel suits you:</p>
<ul>
<li><strong>Email</strong> — <a href="mailto:grievance@rgossips.com" style="${LINK}">grievance@rgossips.com</a><br/>
Best for account problems, payment questions, data requests and anything needing a written record.</li>
<li><strong>WhatsApp</strong> — <a href="https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146" target="_blank" rel="noopener noreferrer" style="${LINK}">RGossips channel</a><br/>
Product updates and announcements.</li>
<li><strong>Instagram</strong> — <a href="https://www.instagram.com/rgossips.agency/" target="_blank" rel="noopener noreferrer" style="${LINK}">@rgossips.agency</a><br/>
General questions and campaign news.</li>
</ul>
<p>For business and partnership enquiries, write to <a href="mailto:info@rgossips.com" style="${LINK}">info@rgossips.com</a>.</p>

<h1>2. Response times</h1>
<ul>
<li>We acknowledge every email within <strong>24 hours</strong>.</li>
<li>We aim to resolve within <strong>15 days</strong>, and usually far sooner.</li>
<li>Payout and escrow queries are prioritised — tell us the campaign name and the date.</li>
</ul>

<h1>3. Common questions</h1>

<h2>I can't sign in</h2>
<p>Sign-in uses your phone number and a one-time code sent over WhatsApp. If the code does not arrive, check that WhatsApp is installed and active on that number, then request a new code after 30 seconds. If your account was deleted it will not accept sign-in during the 30-day grace window — email us to restore it.</p>

<h2>My Instagram won't connect</h2>
<p>RGossips connects to <strong>Instagram Business or Creator</strong> accounts only. Personal accounts cannot be connected, because the data we display comes from Instagram's professional APIs. Switch your account type in the Instagram app, then reconnect from RGossips settings.</p>

<h2>When do I get paid?</h2>
<p>Campaign funds are held in escrow from the moment the brand commits. They are released once your deliverable is approved. Add a payout method — UPI or bank account — under Payment Methods before your first payout. If a payout is delayed, email us with the campaign name.</p>

<h2>How do I report a user or content?</h2>
<p>Open the safety menu on any profile or listing and choose <strong>Report</strong>. We review reports and act on them. You can also <strong>Block</strong> a user, which hides you from each other across the platform. Anything urgent, email us directly.</p>

<h2>How do I delete my account?</h2>
<p>See <a href="/consent/delete-account" style="${LINK}">Delete your account</a> for the steps, what is removed, and what we are required to keep.</p>

<h1>4. Policies</h1>
<ul>
<li><a href="/consent/privacy" style="${LINK}">Privacy &amp; Cookie Policy</a></li>
<li><a href="/consent/influencer" style="${LINK}">Influencer Consent Policy</a></li>
<li><a href="/consent/brand" style="${LINK}">Brand Consent Policy</a></li>
<li><a href="/consent/refund" style="${LINK}">Refund Policy</a></li>
<li><a href="/consent/delete-account" style="${LINK}">Delete your account</a></li>
</ul>

<h1>5. Grievance Officer</h1>
<p>In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:</p>
<p><strong>Grievance Officer &amp; Data Protection Contact</strong><br/>
RUDE LABS Private Limited<br/>
Email: <a href="mailto:grievance@rgossips.com" style="${LINK}">grievance@rgossips.com</a><br/>
Acknowledgment within 24 hours; resolution within 15 days.</p>
<p>If you are not satisfied with our response, you may approach the Data Protection Board of India or any other competent authority.</p>

<p>© RUDE LABS Private Limited. All rights reserved.</p>
`;
