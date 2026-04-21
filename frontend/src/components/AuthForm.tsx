import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";

type AuthTab = "login" | "register";
type AuthView = "main" | "forgot" | "forgot-sent";

interface AuthFormProps {
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
}

const SERVER_URL = import.meta.env.VITE_API_URL;

const AuthForm: React.FC<AuthFormProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [view, setView] = useState<AuthView>("main");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const submitLabel = activeTab === "login" ? "sign in" : "create account";

  const resetAll = () => {
    setFormError(null);
    clearError();
  };

  const handleTabChange = (tab: AuthTab) => {
    resetAll();
    setView("main");
    setPendingVerification(false);
    onTabChange(tab);
  };

  const handleSubmit = async () => {
    resetAll();

    if (activeTab === "login") {
      if (!email.trim() || !password.trim()) {
        setFormError("Email and password are required.");
        return;
      }
      try {
        await login(email.trim(), password);
        navigate("/interests", { replace: true });
      } catch (err) {
        if (!(err instanceof ApiError)) setFormError("Unable to log in right now.");
      }
      return;
    }

    if (!username.trim() || !email.trim() || !password.trim()) {
      setFormError("Username, email, and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }

      await fetch(`${SERVER_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });

      setPendingVerification(true);
    } catch {
      setFormError("Unable to create account right now.");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setFormError("Email is required.");
      return;
    }
    setIsSending(true);
    setFormError(null);
    try {
      await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setView("forgot-sent");
    } catch {
      setFormError("Unable to send reset email right now.");
    } finally {
      setIsSending(false);
    }
  };

  const mutedText = "text-[#5c5752]";
  const inputClass = "w-full rounded-lg border border-[#D3D1C7] bg-[#F7F7F5] px-4 py-3 text-[#1a1714] outline-none transition placeholder:text-[#6b6b64] focus:border-[#EF9F27]";
  const labelClass = `mb-2 block text-[10px] font-light uppercase tracking-[0.2em] ${mutedText}`;
  const gridBg = "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)";

  // ── Pending email verification state ──────────────────────────────────────
  if (pendingVerification) {
    return (
      <div className="flex-1 min-h-screen flex items-start justify-center bg-white px-8 pt-20"
        style={{ backgroundImage: gridBg, backgroundSize: "60px 60px" }}
      >
        <div className="flex w-full max-w-md flex-col gap-4 pt-8">
          <h2 className="text-3xl font-normal lowercase text-black">check your email</h2>
          <p className={`text-sm ${mutedText}`}>
            we sent a verification link to <span className="text-black">{email}</span>.
            click it to activate your account.
          </p>
          <p className={`text-xs italic ${mutedText}`}>
            didn't get it? check your spam folder or{" "}
            <button className="underline" onClick={() => setPendingVerification(false)}>
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  // ── Forgot password sent state ─────────────────────────────────────────────
  if (view === "forgot-sent") {
    return (
      <div className="flex-1 min-h-screen flex items-start justify-center bg-white px-8 pt-20"
        style={{ backgroundImage: gridBg, backgroundSize: "60px 60px" }}
      >
        <div className="flex w-full max-w-md flex-col gap-4 pt-8">
          <h2 className="text-3xl font-normal lowercase text-black">check your email</h2>
          <p className={`text-sm ${mutedText}`}>
            if an account exists for <span className="text-black">{forgotEmail}</span>,
            we sent a password reset link. it expires in 1 hour.
          </p>
          <button
            className={`text-sm ${mutedText} underline text-left`}
            onClick={() => { setView("main"); setForgotEmail(""); }}
          >
            ← back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Forgot password form ───────────────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="flex-1 min-h-screen flex items-start justify-center bg-white px-8 pt-20"
        style={{ backgroundImage: gridBg, backgroundSize: "60px 60px" }}
      >
        <div className="flex w-full max-w-md flex-col gap-6 pt-8">
          <div>
            <h2 className="text-3xl font-normal lowercase text-black mb-2">forgot password</h2>
            <p className={`text-sm ${mutedText}`}>enter your email and we'll send a reset link.</p>
          </div>

          <div>
            <label htmlFor="forgot-email" className={labelClass}>EMAIL</label>
            <input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setFormError(null); }}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          {formError && <p className="text-sm text-[#B02A2A]" role="alert">{formError}</p>}

          <button
            onClick={handleForgotPassword}
            disabled={isSending}
            className="w-full rounded-full bg-[#E24B4A] px-4 py-3 text-sm font-normal lowercase text-white transition hover:shadow-[0_6px_0_#4A1B0C] active:translate-y-[1px]"
          >
            {isSending ? "sending..." : "send reset link"}
          </button>

          <button
            className={`text-sm ${mutedText} underline text-left`}
            onClick={() => { setView("main"); setFormError(null); }}
          >
            ← back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Main login/register form ───────────────────────────────────────────────
  return (
    <div
      className="flex-1 min-h-screen flex items-start justify-center bg-white px-8 pt-20"
      style={{ backgroundImage: gridBg, backgroundSize: "60px 60px" }}
    >
      <div className="flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col">
        <h2 className="mb-8 text-3xl font-normal lowercase text-black">
          {activeTab === "login" ? "sign in" : "create account"}
        </h2>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F1EFE8] p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "login"}
            onClick={() => handleTabChange("login")}
            className={`rounded-lg px-4 py-2 text-sm font-normal lowercase transition ${activeTab === "login" ? "bg-white text-black" : `bg-[#F1EFE8] ${mutedText}`}`}
          >sign in</button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "register"}
            onClick={() => handleTabChange("register")}
            className={`rounded-lg px-4 py-2 text-sm font-normal lowercase transition ${activeTab === "register" ? "bg-white text-black" : `bg-[#F1EFE8] ${mutedText}`}`}
          >register</button>
        </div>

        <form className="mt-10 space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>

          {/* Username (register) or Email (login) */}
          <div>
            <label htmlFor={activeTab === "login" ? "login-email" : "username"} className={labelClass}>
              {activeTab === "login" ? "EMAIL" : "USERNAME"}
            </label>
            <input
              id={activeTab === "login" ? "login-email" : "username"}
              type={activeTab === "login" ? "email" : "text"}
              value={activeTab === "login" ? email : username}
              onChange={(e) => { resetAll(); activeTab === "login" ? setEmail(e.target.value) : setUsername(e.target.value); }}
              placeholder={activeTab === "login" ? "you@example.com" : undefined}
              className={inputClass}
            />
          </div>

          {/* Email (register only) */}
          {activeTab === "register" && (
            <div>
              <label htmlFor="register-email" className={labelClass}>EMAIL</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { resetAll(); setEmail(e.target.value); }}
                className={inputClass}
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>PASSWORD</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { resetAll(); setPassword(e.target.value); }}
              className={inputClass}
            />
          </div>

          {activeTab === "login" && (
            <button
              type="button"
              onClick={() => { setView("forgot"); setFormError(null); clearError(); }}
              className={`text-left text-sm ${mutedText} underline`}
            >
              forgot password?
            </button>
          )}

          {/* Confirm password (register only) */}
          {activeTab === "register" && (
            <div>
              <label htmlFor="confirm-password" className={labelClass}>CONFIRM PASSWORD</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { resetAll(); setConfirmPassword(e.target.value); }}
                className={inputClass}
              />
            </div>
          )}

          {(formError || error) && (
            <p className="text-sm text-[#B02A2A]" role="alert">{formError ?? error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full rounded-full bg-[#E24B4A] px-4 py-3 text-sm font-normal lowercase text-white transition hover:bg-[#E24B4A] hover:text-white hover:shadow-[0_6px_0_#4A1B0C] active:bg-white active:text-black active:translate-y-[1px]"
          >
            {isLoading ? "working..." : submitLabel}
          </button>

          <p className={`mt-auto pt-8 text-center text-xs italic lowercase ${mutedText}`}>
            your identity is never shared with matches
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;