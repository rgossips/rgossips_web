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

### Firebase project
- Create a Firebase project; add an **Android app** (your `applicationId`) and an
  **iOS app** (your bundle id).

### Android
1. Download **google-services.json** → `android/app/google-services.json`.
2. `android/build.gradle` (project) — add to `dependencies`:
   ```gradle
   classpath 'com.google.gms:google-services:4.4.2'
   ```
3. `android/app/build.gradle` — at the top, after the other `apply plugin` lines:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
4. `android/app/src/main/AndroidManifest.xml` — for Android 13+ permission:
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```
5. Rebuild.

### iOS
1. Download **GoogleService-Info.plist** → `ios/<App>/GoogleService-Info.plist`
   (add to the Xcode target).
2. In Xcode → target → **Signing & Capabilities**: add **Push Notifications** and
   **Background Modes → Remote notifications**.
3. Firebase console → Project settings → **Cloud Messaging** → upload your **APNs
   auth key** (.p8) with Key ID + Team ID.
4. `cd ios && pod install`, then rebuild.

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
