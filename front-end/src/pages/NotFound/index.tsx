import { Stack } from "@mui/material";

const NotFound = () => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      component="section"
      sx={{
        p: 2,
        background: "#080c27",
        height: "100vh",
      }}
    >
      Page Not Found, or App Crashed -_-.
    </Stack>
  );
};

export default NotFound;
