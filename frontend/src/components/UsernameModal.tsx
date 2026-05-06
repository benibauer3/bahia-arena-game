import { useState, FormEvent } from "react";
import { useAccount } from "wagmi";
import BahiaArenaLogo from "@/components/BahiaArenaLogo";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

interface UsernameModalProps {
  onClose: () => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,18}$/;

export default function UsernameModal({ onClose }: UsernameModalProps) {
  const { address } = useAccount();
  const { setupProfile, checkUsername } = usePlayerProfile();

  const [username, setUsername] = useState("");
  const [xHandle, setXHandle]  = useState("");
  const [error,   setError]    = useState("");
  const [loading, setLoading]  = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  function validate(name: string): string {
    if (!name) return "Username is required.";
    if (!USERNAME_RE.test(name)) return "3–18 chars · letters, numbers and _ only.";
    if (!checkUsername(name)) return "Username already taken. Try another.";
    return "";
  }

  const usernameError = validate(username);
  const canSubmit = username.length > 0 && !usernameError && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(username);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const handle = xHandle.replace(/^@/, "").trim() || undefined;
      setupProfile(username.trim(), handle);
      onClose();
    } catch (ex) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-arena-surface border border-arena-border rounded-2xl p-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <BahiaArenaLogo size={80} showWordmark={false} />
        </div>

        {/* Title */}
        <h2 className="font-display text-arena-primary text-xs text-center mb-1 tracking-wider">
          Create Your Arena Profile
        </h2>
        <p className="text-xs text-arena-muted text-center mb-5">
          Choose a name to track your ranking and compete for monthly prizes.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="arena_warrior"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              maxLength={18}
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-arena-bg border border-arena-border text-white text-sm placeholder:text-arena-muted focus:outline-none focus:border-arena-primary transition-colors"
            />
            {username.length > 0 && usernameError && (
              <p className="mt-1 text-[10px] text-red-400">{usernameError}</p>
            )}
            {username.length > 0 && !usernameError && (
              <p className="mt-1 text-[10px] text-arena-success">✓ Available</p>
            )}
          </div>

          {/* X Handle */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              X / Twitter <span className="text-arena-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="@yourhandle"
              value={xHandle}
              onChange={e => setXHandle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-arena-bg border border-arena-border text-white text-sm placeholder:text-arena-muted focus:outline-none focus:border-arena-primary transition-colors"
            />
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

          {/* Footer info */}
          <p className="text-center text-[10px] text-arena-muted">
            Username cannot be changed · Wallet: {shortAddress}
          </p>
        </form>
      </div>
    </div>
  );
}
