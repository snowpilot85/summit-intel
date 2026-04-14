"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function PathwaysError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isProfileError = error.name === "ProfileNotFoundError";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-600 text-xl font-bold">!</span>
        </div>

        {isProfileError ? (
          <>
            <h1 className="text-[20px] font-semibold text-neutral-900 mb-2">
              Account not configured
            </h1>
            <p className="text-[14px] text-neutral-600 mb-4">
              Your login works, but your account has no district profile yet. A{" "}
              <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[12px] font-mono">
                user_profiles
              </code>{" "}
              row needs to be inserted in Supabase linking your auth user to a district.
            </p>
            <p className="text-[13px] text-neutral-500 mb-6">
              Contact your administrator or run the SQL insert below in the
              Supabase dashboard → SQL Editor.
            </p>
            <pre className="text-left bg-neutral-900 text-green-300 text-[11px] rounded-lg p-4 mb-6 overflow-x-auto whitespace-pre-wrap">
{`INSERT INTO user_profiles (id, district_id, full_name, role)
VALUES (
  auth.uid(),          -- replace with your auth user UUID
  '<your-district-id>',
  'Your Name',
  'district_admin'
);`}
            </pre>
          </>
        ) : (
          <>
            <h1 className="text-[20px] font-semibold text-neutral-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-[14px] text-neutral-600 mb-6">
              {error.message || "An unexpected error occurred."}
            </p>
          </>
        )}

        <button
          onClick={handleSignOut}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] font-medium py-2.5 rounded-lg transition-colors"
        >
          Sign out and try again
        </button>
      </div>
    </div>
  );
}
