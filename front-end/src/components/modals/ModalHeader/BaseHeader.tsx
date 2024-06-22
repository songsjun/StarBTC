import { IconButton, Stack, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode } from "react";

type ModalBaseHeaderProps = {
  children: ReactNode;
  onClose?: () => void;
};

export const ModalBaseHeader = ({
  children,
  onClose,
}: ModalBaseHeaderProps) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      alignSelf="stretch"
      sx={{
        borderBottom: "1px solid rgba(190, 194, 218, 0.30)",
        padding: {
          sm: "26px 20px",
          xs: "18px 14px",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={matches ? "10px" : "20px"}
        alignItems="center"
        sx={{ fontSize: { sm: "24px", xs: "16px" } }}
      >
        {children}
      </Stack>
      <IconButton
        aria-label="close"
        onClick={() => onClose?.()}
        sx={{
          position: "absolute",
          right: 24,
          top: {
            sm: "24px",
            xs: "16px",
          },
          color: (theme) => theme.palette.grey[500],
        }}
      >
        {/* <Close /> */}
      </IconButton>
    </Stack>
  );
};
