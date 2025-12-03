import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
          Sign In
        </h1>
        <p className="text-foreground/60 text-center mb-8">
          Sign in to track your watch history
        </p>
        <LoginForm />
        <p className="text-center mt-6 text-sm text-foreground/60">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-foreground hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
