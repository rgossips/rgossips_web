export const metadata = {
  title: "Instagram data deletion · RGossips",
};

export default function DeletionStatusPage({ searchParams }) {
  const id = searchParams?.id || "";
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 max-w-md w-full p-7">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Instagram data deletion
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mt-3">
          Your request to disconnect Instagram from RGossips has been
          received and processed. The access token, Instagram handle,
          follower data and cached insights for this account have been
          removed from our records.
        </p>
        {id && (
          <div className="mt-5 p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Confirmation code
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">{id}</p>
          </div>
        )}
        <p className="text-xs text-slate-400 leading-relaxed mt-5">
          To also delete your full RGossips account (subscription, campaigns,
          messages), open the app and use the Delete Account flow under
          Profile → Account.
        </p>
        <a
          href="/"
          className="block text-center mt-6 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Back to RGossips
        </a>
      </div>
    </main>
  );
}
