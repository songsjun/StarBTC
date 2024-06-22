import { FC } from "react";
import { Stack } from "@mui/material";

// import BadgeYellow from "../../assets/badge-yellow.svg";
// import BadgeBlue from "../../assets/badge-blue.svg";
// import BadgeRed from "../../assets/badge-red.svg";

import { TickText } from "./TickMetric.styles";

// const volumeRanges = [
//   { min: 20000, max: 100000, badge: BadgeBlue },
//   { min: 100000, max: 500000, badge: BadgeYellow },
//   { min: 500000, max: 2500000, badge: BadgeRed },
//   { min: 2500000, max: Infinity, badge: BadgeRed },
// ];

interface TickMetricProps {
  tick: string;
  // volume?: number;
}

export const TickMetric: FC<TickMetricProps> = ({ tick /* volume*/ }) => {
  // const matchedRange = volumeRanges.find(
  //   (range) => volume >= range.min && volume < range.max
  // );

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap={1}
      width="100%"
    >
      <TickText>{tick}</TickText>
      {/* {matchedRange?.badge ? <img src={matchedRange?.badge} /> : null} */}
    </Stack>
  );
};
