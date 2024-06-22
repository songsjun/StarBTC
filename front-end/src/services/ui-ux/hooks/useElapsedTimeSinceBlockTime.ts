import { useCallback, useState } from "react";
import { useInterval } from "react-use";

/**
 * Returns the time elapsed in seconds since the given timestamp.
 * This method refreshes every second.
 */
export const useElapsedTimeSinceTimestamp = (timestamp: number) => {
  const [elapsed, setElapsed] = useState<number>(undefined); // seconds

  const refresh = useCallback(() => {
    if (!timestamp) {
      setElapsed(undefined);
      return;
    }
    else {
      setElapsed(Math.floor(Date.now() / 1000 - timestamp));
    }
  }, [timestamp]);

  useInterval(refresh, 1000);

  return elapsed;
}