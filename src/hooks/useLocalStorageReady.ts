"use client";

import { useEffect, useState } from "react";

/**
 * Static export pre-renders with no localStorage access, so any hook that
 * reads storage must wait for this to flip true (inside a useEffect) before
 * trusting client state, or React throws a hydration mismatch.
 */
export function useLocalStorageReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration flip, not derived state
    setReady(true);
  }, []);

  return ready;
}
