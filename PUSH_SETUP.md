# Push notifications — setup

Web + mobile push share one backend: every new row in `notifications` fires an
AFTER INSERT trigger (migration 056) that POSTs to the **send-push** edge fn,
which fans the payload out to all of the recipient's registered devices —
**web-push** subscriptions (browsers) and **FCM** tokens (Android + iOS). Devices
register through the **register-push** edge fn into `push_subscriptions`.

All the **code** is shipped + deployed. What remains is the **credentials + native
config** below (secrets are intentionally NOT in git).

---

## 1. Turn on the fan-out trigger (required for any push)

The trigger only fires once these DB settings point it at send-push. Run in the
Supabase **SQL editor**:

```sql
alter database postgres
  set app.push_endpoint = 'https://hlfevcdtbehukxrrgykv.supabase.co/functions/v1/send-push';
alter database postgres set app.push_secret = 'CHOOSE_A_RANDOM_STRING';
```

Then set the **same** secret as a function secret so send-push accepts the call:

```bash
npx supabase secrets set PUSH_SECRET='CHOOSE_A_RANDOM_STRING'
```

(If `app.push_endpoint` is unset, the trigger is a silent no-op — safe.)

---

## 2. Web push (browsers)

1. Generate a VAPID key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Set the private side as function secrets:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY='<public>' VAPID_PRIVATE_KEY='<private>' VAPID_SUBJECT='mailto:support@rgossips.com'
   ```
3. Expose the **public** key to the web app — add to `.env.local` (and Vercel):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
   ```
4. Done. The service worker (`public/sw.js`) is already served at `/sw.js`; users
   flip **Notification Settings → This device → Browser notifications** to
   subscribe (`useWebPush` hook). Must be HTTPS (localhost is exempt).

---

## 3. Mobile push — FCM (Android + iOS)

The JS deps (`@react-native-firebase/app`, `/messaging`) are installed and the
client is wired (`src/lib/push.ts`, `App.tsx`). Native Firebase config is still
needed — the app runs fine without it (push just stays off).

App ids are `com.rgossips` on both platforms.

### Android — DONE (wired in the repo)
`android/app/google-services.json` is in place; the google-services classpath
(`android/build.gradle`), the `apply plugin` (`android/app/build.gradle`), and the
`POST_NOTIFICATIONS` permission (AndroidManifest) are committed. Just:
```bash
cd rsgossips_app && npm install      # pulls the Firebase JS packages
# then a normal Android build
```

### iOS — file in place, Xcode steps remain
`ios/RGossips/GoogleService-Info.plist` is placed and `remote-notification`
background mode is in Info.plist. In **Xcode** (these touch entitlements /
provisioning, so they can't be done from files):
1. Add `GoogleService-Info.plist` to the **RGossips** target (drag it in → check
   the target, or File → Add Files).
2. Target → **Signing & Capabilities** → **+ Capability** → add **Push
   Notifications** (and **Background Modes → Remote notifications**).
3. `cd ios && pod install`.

### APNs (iOS delivery) — Firebase console
Project settings → **Cloud Messaging** → **APNs authentication key**: upload your
`.p8` with its Key ID + your Team ID.

### FCM server credential (for send-push)
Firebase console → Project settings → **Service accounts** → **Generate new
private key** → download the JSON. Set it as a single-line function secret:

```bash
npx supabase secrets set FCM_SERVICE_ACCOUNT='{"type":"service_account","project_id":"…", …}'
```

---

## 4. Verify

Insert a test notification for your own `user_id` (SQL editor) and you should get
a push on any registered device:

```sql
insert into notifications (user_id, type, title, body, is_read)
values ('<your-user-id>', 'welcome', 'Test push', '{"text":"It works 🎉","link":"/influencer"}', false);
```

Or call send-push directly:

```bash
curl -X POST 'https://hlfevcdtbehukxrrgykv.supabase.co/functions/v1/send-push' \
  -H 'Content-Type: application/json' -H 'x-push-secret: CHOOSE_A_RANDOM_STRING' \
  -d '{"userId":"<your-user-id>","title":"Test","body":"{\"text\":\"hi\",\"link\":\"/influencer\"}"}'
```

Dead subscriptions (expired browser subs / unregistered FCM tokens) are pruned
automatically by send-push.

---

## Notes / limits
- **Foreground on mobile**: OS shows push automatically in background/quit. In the
  foreground, the in-app bell already updates via polling; to also show a system
  banner in-foreground, add `@notifee/react-native` and display from
  `messaging().onMessage`.
- **Device handoff**: register-push upserts by token/endpoint, so logging in as a
  different user on the same device reassigns it automatically.
- **Adding a platform later**: add a `platform` value + a branch in send-push +
  `_shared/push.ts`. No schema or trigger change.
