import { useEffect, useState } from "react";

export interface MiniPayInfo {
  isMiniPay:  boolean;
  isDetected: boolean; // detection complete
}

/**
 * Detects whether the app is running inside MiniPay (Opera Mini embedded browser).
 *
 * MiniPay injects window.ethereum with isMiniPay = true, and also
 * sets navigator.userAgent to include "MiniPay".
 */
export function useMiniPay(): MiniPayInfo {
  const [info, setInfo] = useState<MiniPayInfo>({ isMiniPay: false, isDetected: false });

  useEffect(() => {
    const checkMiniPay = () => {
      const win = window as Window & {
        ethereum?: { isMiniPay?: boolean };
      };

      const byEthereum = !!win.ethereum?.isMiniPay;
      const byUA       = navigator.userAgent.toLowerCase().includes("minipay");

      setInfo({ isMiniPay: byEthereum || byUA, isDetected: true });
    };

    // MiniPay may inject ethereum asynchronously
    if (document.readyState === "complete") {
      checkMiniPay();
    } else {
      window.addEventListener("load", checkMiniPay, { once: true });
    }
  }, []);

  return info;
}
