import { SignupForm } from "@/components/SignupForm";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
          Sign Up
        </h1>
        <p className="text-foreground/60 text-center mb-8">
          Create an account to start tracking
        </p>
        <SignupForm />
        <p className="text-center mt-6 text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

