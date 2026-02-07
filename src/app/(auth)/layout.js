import BackButton from "@/components/BackButton";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* <BackButton /> */}
      <main className="flex-1 flex items-center justify-center w-full">
        {children}
      </main>
    </div>
  );
}
