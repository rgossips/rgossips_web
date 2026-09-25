// Make sure a storage bucket exists, without logging an error when it does.
//
// Three functions used to call `storage.createBucket()` unconditionally before
// every upload — on each Instagram refresh, each signup, each campaign image.
// The bucket has existed since the first signup, so Postgres rejected every one
// of those calls with `duplicate key value violates unique constraint
// "buckets_pkey"`, the surrounding try swallowed it, and the upload carried on.
// Harmless, but it put a red 400 and a database error in the logs for every
// photo anyone uploaded, which is a good way to stop noticing real ones.
//
// This checks first, creates only when missing, and remembers the answer for
// the life of the isolate so warm invocations skip the round trip entirely.

const ensured = new Set<string>();

export interface BucketOptions {
  public?: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}

export async function ensureBucket(
  admin: { storage: any },
  name: string,
  options: BucketOptions = {},
): Promise<void> {
  if (ensured.has(name)) return;

  const { data } = await admin.storage.getBucket(name);
  if (data) {
    ensured.add(name);
    return;
  }

  const { error } = await admin.storage.createBucket(name, options);
  // Another invocation may have created it between the check and here. That
  // is success as far as the caller is concerned; anything else is left for
  // the upload that follows to surface, since it has the better error.
  if (error && !/exist|duplicate/i.test(String(error.message || ""))) {
    console.warn(`ensureBucket(${name}) failed:`, error.message);
    return;
  }
  ensured.add(name);
}
