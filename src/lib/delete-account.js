// Account deletion instructions — the public page Google Play requires as the
// "Delete account URL" in Data safety.
//
// Play's criteria for this page: it must name the app and developer shown on
// the store listing, prominently feature the steps to request deletion, and
// specify which data is deleted, which is kept, and any additional retention
// period. The page itself must be publicly readable — but the deletion action
// may require sign-in, which is deliberate here: an unauthenticated deletion
// channel would let anyone request deletion of someone else's account.
//
// Retention figures below come from Section 10 of the Privacy & Cookie Policy
// (three years post-closure, for the Income Tax Act, CGST Act and Companies
// Act). Keep the two in step — an overstated deletion claim is its own
// compliance problem.
//
// Grace-window mechanics mirror the app: status flips to 'pending_deletion'
// with deleted_at set (migrations 018_brand_soft_delete /
// 046_influencer_soft_delete); sign-in is blocked for both roles while
// pending; the admin purge hard-deletes 30 days later.

export const deleteAccountHtml = `
<p><strong>DELETE YOUR RGOSSIPS ACCOUNT</strong></p>
<p><em>RGossips — Influencer Marketing Platform</em></p>
<p>Operated by RUDE LABS Private Limited</p>

<h1>1. Who this page is for</h1>
<p>This page explains how to delete your RGossips account and what happens to your data when you do. It applies to both account types on the platform — Creators (Influencers) and Brands — and to both the RGossips mobile app and rgossips.com.</p>
<p>You will need to sign in to complete the deletion. We require this to confirm the request genuinely comes from the account holder; without it, anyone who knew your phone number could request that your account be removed.</p>

<h1>2. How to delete your account</h1>

<h2>2.1 Creators</h2>
<ol>
<li>Open the RGossips app and sign in.</li>
<li>Go to <strong>Profile</strong>.</li>
<li>Open <strong>Privacy &amp; Security</strong>.</li>
<li>Tap <strong>Delete Account</strong>.</li>
<li>Choose a reason, tick the confirmation box, type <strong>DELETE</strong> to confirm, and tap <strong>Delete Account</strong>.</li>
</ol>

<h2>2.2 Brands</h2>
<ol>
<li>Open the RGossips app and sign in.</li>
<li>Go to <strong>Profile</strong>.</li>
<li>Tap <strong>Delete Account</strong>.</li>
<li>Choose a reason, tick the confirmation box, type <strong>DELETE</strong> to confirm, and tap <strong>Delete Account</strong>.</li>
</ol>

<h2>2.3 If you cannot sign in</h2>
<p>If you have lost access to the phone number on your account and cannot sign in, email <strong>grievance@rgossips.com</strong> from the email address registered on the account. We will verify your identity before acting on the request. We acknowledge within 24 hours and resolve within 15 days.</p>

<h1>3. What happens immediately</h1>
<ul>
<li>Your profile stops appearing anywhere on the platform — you will not be visible in search, discovery, or campaign listings.</li>
<li>You are signed out on every device, and all active sessions are revoked.</li>
<li>Sign-in is blocked while your account is pending deletion.</li>
<li>Active campaigns and applications associated with your account are withdrawn from view.</li>
</ul>

<h1>4. The 30-day grace window</h1>
<p>Deletion is not instant. Your account enters a <strong>30-day grace period</strong>, during which it is hidden but recoverable. This exists so an accidental or coerced deletion can be undone.</p>
<p>If you change your mind, email <strong>grievance@rgossips.com</strong> within 30 days and ask for your account to be restored. Only our team can restore an account in this window — you cannot do it by signing back in, because sign-in is blocked.</p>
<p>After 30 days, the deletion becomes permanent and cannot be reversed.</p>

<h1>5. What is deleted</h1>
<p>After the 30-day grace window, the following are permanently removed:</p>
<ul>
<li>Your account and login credentials.</li>
<li>Your profile — name, contact details, bio, location, categories, and profile photo.</li>
<li>Your media kit and any media you uploaded.</li>
<li>Your campaign applications, pitches, and submitted deliverables.</li>
<li>For Brands: your campaigns and the applications attached to them.</li>
<li>Your saved payout details — UPI IDs and bank account information.</li>
<li>Your notification preferences and privacy settings.</li>
<li>Any Instagram data we obtained through your connected account, including handle, follower counts, engagement metrics, and media insights.</li>
</ul>

<h1>6. What is kept, and for how long</h1>
<p>Some records cannot be deleted on request, because Indian law requires us to retain them. These are kept for <strong>three (3) years</strong> after your account is closed, in line with the Income Tax Act, 1961, the Central Goods and Services Tax Act, 2017, and the Companies Act, 2013:</p>
<ul>
<li>Transaction, escrow, and payout records, including amounts, dates, and tax deducted (TDS/GST).</li>
<li>Invoices and related accounting entries.</li>
<li>Identity and tax records collected for payout compliance, such as PAN or GSTIN.</li>
</ul>
<p>These records are retained for legal and accounting purposes only. They are not used to identify you on the platform, are not visible to other users, and your profile is not restored by their presence.</p>
<p>Where a dispute or legal claim involving your account is unresolved, related data may be retained until the matter is concluded.</p>
<p>We may also retain anonymised or aggregated statistics that cannot be traced back to you.</p>

<h1>7. Deleting some data without closing your account</h1>
<p>If you want to remove specific information rather than your whole account, you can do so without deleting it:</p>
<ul>
<li><strong>Payout details</strong> — remove a saved UPI ID or bank account from Payment Methods in the app.</li>
<li><strong>Instagram data</strong> — disconnect Instagram from your RGossips settings, or revoke access from your Instagram or Meta settings. See <a href="/instagram/deletion-status">Instagram data deletion status</a>.</li>
<li><strong>Profile content</strong> — edit or remove media, bio, and other profile fields at any time.</li>
</ul>
<p>For anything not covered above, contact our Grievance Officer using the details below.</p>

<h1>8. Deactivating instead</h1>
<p>If you only want to step away temporarily, use <strong>Deactivate Account</strong> rather than Delete. Deactivating hides your profile and signs you out everywhere, but nothing is erased and signing back in restores your account automatically.</p>

<h1>9. Contact</h1>
<p><strong>Grievance Officer &amp; Data Protection Contact</strong><br/>
RUDE LABS Private Limited<br/>
Email: grievance@rgossips.com<br/>
Acknowledgment within 24 hours; resolution within 15 days.</p>
<p>If you are not satisfied with our response, you may approach the Data Protection Board of India or any other competent authority.</p>

<p><em>— End of Account Deletion Instructions —</em></p>
<p>© RUDE LABS Private Limited. All rights reserved.</p>
`;
