/**
 * Converts a timelock value from the script, into a number of seconds.
 */
export const scriptTimelockToSeconds = (scriptTimelock: number): number => {
  const encodingMask = 1 << 22; // 0x400000
  if ((scriptTimelock & encodingMask) === 0)
    throw new Error("Unsupported timelock encoding");

  const blocksOf512Seconds = scriptTimelock & 0x3FFFFF;
  const timeLockInSeconds = blocksOf512Seconds * 512;

  return timeLockInSeconds;
}