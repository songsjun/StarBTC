import { Box, Card, Stack, Typography } from "@mui/material";

import { TickText } from "../../base/TickText";

type TokenCardProps = {
  tick: string;
  amount: number;
  perMint: number;
  number: number;
};

export const TinyInscriptionCard = ({
  tick,
  amount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  perMint,
  number,
}: TokenCardProps) => (
  <Stack alignItems="center" spacing="30px" margin="20px">
    <Stack
      width={164}
      padding="8px 0 0"
      component={Card}
      spacing="4px"
      alignItems="center"
    >
      <TickText
        sx={{
          paddingLeft: "20px",
          alignSelf: "self-start",
          fontSize: {
            sm: "24px",
            xs: "18px",
          },
          lineHeight: "32px",
        }}
      >
        {tick}
      </TickText>
      <Typography
        lineHeight="38px"
        sx={{
          fontSize: {
            sm: "18px",
            xs: "14px",
          },
        }}
        textAlign="center"
      >
        {amount}
      </Typography>
      {/* <Typography
        sx={{
          fontSize: {
            sm: "18px",
            xs: "12px",
          },
        }}
        color={TEXT_INACTIVE_COLOR}
        textAlign="center"
        lineHeight="27px"
      >
        {perMint ? Math.floor(amount / perMint) : 0} mints
      </Typography> */}
      <Box
        width="100%"
        sx={{
          padding: "10px 20px;",
          textAlign: "center",
          background: "rgba(190, 194, 218, 0.10)",
        }}
      >
        <Typography
          sx={{
            fontSize: {
              sm: "18px",
              xs: "12px",
            },
          }}
          textAlign="center"
        >
          #{number}
        </Typography>
      </Box>
    </Stack>
  </Stack>
);
