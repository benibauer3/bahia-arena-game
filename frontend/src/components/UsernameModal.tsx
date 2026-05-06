import { useState, FormEvent, useEffect } from "react";
import { useAccount } from "wagmi";
import BahiaArenaLogo from "@/components/BahiaArenaLogo";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useXAuth } from "@/hooks/useXAuth";
import { X_CLIENT_ID } from "@/lib/xAuth";

interface UsernameModalProps {
  onClose: () => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,18}$/;

/** Converts an X display name / handle into a valid arena username */
function toArenaUsername(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 18);
}

export default function UsernameModal({ onClose }: UsernameModalProps) {
  const { address } = useAccount();
  const { setupProfile, checkUsername, syncXProfile } = usePlayerProfile();
  const { isConnected: xConnected, xUser, connectX, isConnecting: xConnecting } = useXAuth();

  const [username, setUsername] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // If X is already connected, pre-fill the username field automatically
  useEffect(() => {
    if (xConnected && xUser && !username) {
      setUsername(toArenaUsername(xUser.username));
    }
  }, [xConnected, xUser]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  function validate(name: string): string {
    if (!name) return "Username is required.";
    if (!USERNAME_RE.test(name)) return "3–18 chars · letters, numbers and _ only.";
    if (!checkUsername(name)) return "Username already taken. Try another.";
    return "";
  }

  const usernameError = username.length > 0 ? validate(username) : "";
  const canSubmit = username.length > 0 && !usernameError && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(username);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      // Create profile — xHandle comes from OAuth if connected
      setupProfile(username.trim(), xUser?.username || undefined);
      // Immediately sync full X identity (avatar, name, id) if available
      if (xUser) syncXProfile(xUser);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-arena-surface border border-arena-border rounded-2xl p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-arena-muted hover:text-white text-lg leading-none transition-colors"
          title="Skip for now"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <BahiaArenaLogo size={80} showWordmark={false} />
        </div>

        <h2 className="font-display text-arena-primary text-xs text-center mb-1 tracking-wider">
          Create Your Arena Profile
        </h2>
        <p className="text-xs text-arena-muted text-center mb-5">
          Your wallet, username and X account form a single identity.
        </p>

        {/* ── X identity section — only shown when X OAuth is configured ── */}
        {X_CLIENT_ID && (
          xConnected && xUser ? (
            /* X already connected — show verified badge */
            <div className="flex items-center gap-3 p-3 rounded-xl bg-arena-bg border border-[#1d9bf0]/30 mb-4">
              {xUser.profile_image_url ? (
                <img
                  src={xUser.profile_image_url.replace("_normal", "_bigger")}
                  alt={xUser.name}
                  className="w-10 h-10 rounded-full border-2 border-[#1d9bf0]/40 shrink-0 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1d9bf0]/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1d9bf0]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{xUser.name}</p>
                <p className="text-xs text-[#1d9bf0]">@{xUser.username}</p>
              </div>
              <span className="text-green-400 font-bold text-sm shrink-0">✓</span>
            </div>
          ) : (
            /* X not connected — offer OAuth button */
            <button
              type="button"
              onClick={connectX}
              disabled={xConnecting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm font-semibold mb-4 active:scale-95 transition-transform hover:bg-white/5 disabled:opacity-60"
            >
              {xConnecting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              )}
              Connect X to use your @handle
            </button>
          )
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Arena Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="arena_warrior"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                maxLength={18}
                autoFocus={!xConnected}
                className="w-full px-3 py-2.5 rounded-xl bg-arena-bg border border-arena-border text-white text-sm placeholder:text-arena-muted focus:outline-none focus:border-arena-primary transition-colors"
              />
              {xConnected && xUser && username === toArenaUsername(xUser.username) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1d9bf0] font-semibold">
                  via X
                </span>
              )}
            </div>
            {username.length > 0 && usernameError && (
              <p className="mt-1 text-[10px] text-red-400">{usernameError}</p>
            )}
            {username.length > 0 && !usernameError && (
              <p className="mt-1 text-[10px] text-arena-success">✓ Available</p>
            )}
          </div>

          {/* Generic error */}
          {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-arena-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Enter the Arena →"}
          </button>

          {/* Identity summary */}
          <div className="rounded-xl bg-arena-bg/60 border border-arena-border p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-arena-muted">🔑 Wallet</span>
              <span className="font-mono text-white">{shortAddress}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-arena-muted">👤 Username</span>
              <span className="text-arena-primary font-semibold">{username || "—"}</span>
            </div>
            {X_CLIENT_ID && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-arena-muted">𝕏 Twitter</span>
                <span className={xUser ? "text-[#1d9bf0] font-semibold" : "text-arena-muted"}>
                  {xUser ? `@${xUser.username}` : "not connected"}
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
