"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Test() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useQuery(api.auth.getCurrentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (result.error) {
          setError(result.error.message || "Registration failed");
        } else {
          setSuccess("Registration successful! You are now logged in.");
          setEmail("");
          setPassword("");
          setName("");
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message || "Login failed");
        } else {
          setSuccess("Login successful!");
          setEmail("");
          setPassword("");
        } 
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    try {
      await authClient.signOut();
      setSuccess("Logged out successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-display font-bold tracking-tight">
          Auth Test
        </h1>
        <p className="text-foreground/60">
          Test user registration and login
        </p>
      </div>

      {/* Current User Status */}
      {currentUser && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3 animate-fade-in">
          <h2 className="font-display font-semibold text-lg">Current User</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-foreground/60">Email:</span> {currentUser.email}</p>
            {currentUser.name && (
              <p><span className="text-foreground/60">Name:</span> {currentUser.name}</p>
            )}
            <p><span className="text-foreground/60">ID:</span> {currentUser._id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Logout
          </button>
        </div>
      )}

      {/* Auth Form */}
      <div className="bg-surface border border-border rounded-2xl p-8 space-y-6 animate-slide-up">
        <div className="flex gap-2 border-b border-border pb-4">
          <button
            onClick={() => {
              setIsRegistering(true);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              isRegistering
                ? "bg-accent text-accent-foreground"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => {
              setIsRegistering(false);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              !isRegistering
                ? "bg-accent text-accent-foreground"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Your name"
                required={isRegistering}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm animate-scale-in">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm animate-scale-in">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Processing..."
              : isRegistering
              ? "Register"
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
