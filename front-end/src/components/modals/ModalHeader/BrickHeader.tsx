import { Stack, Typography } from "@mui/material";

import { Chip } from "../../base/Chip";
import { TickText } from "../../base/TickText";

import { FC } from "react";
import { ModalBaseHeader } from "./BaseHeader";

type HeaderProps = {
  action: string;
  tick: string;
  suffix: string;
  chipLabel?: string;
  onClose: () => void;
};

export const ModalBrickHeader: FC<HeaderProps> = ({
  action,
  tick,
  suffix,
  chipLabel = "esc-20",
  onClose,
}: HeaderProps) => {
  return (
    <ModalBaseHeader onClose={onClose}>
      <Typography fontSize="inherit">{action}</Typography>
      <Stack direction="row" spacing="6px" alignItems="center">
        <TickText>{tick}</TickText>
        <Chip label={chipLabel} size="small" />
      </Stack>
      <Typography fontSize="inherit">{suffix}</Typography>
    </ModalBaseHeader>
  );
};
