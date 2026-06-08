/**
 * Battle.tsx — Redirects to ranked mode.
 * Classic on-chain PvP battles coming in the next contract upgrade.
 */
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Battle() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/ranked", { replace: true }); }, [navigate]);
  return null;
}
