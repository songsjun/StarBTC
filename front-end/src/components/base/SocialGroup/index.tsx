import Github from "@assets/github.svg";
import Telegram from "@assets/telegram.svg";
import Twitter from "@assets/twitter.svg";
import {
  IconButton,
  Stack,
  StackOwnProps,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FC } from "react";

const socials = [
  {
    iconUrl: `url(${Github})`,
    link: "https://github.com/orgs/BeL2Labs",
  },
  {
    iconUrl: `url(${Twitter})`,
    link: "https://twitter.com/Be_Layer2",
  },
  /* {
    iconUrl: `url(${Document})`,
    link: "https://docs.bel2xxxxx.io",
  }, */
  {
    iconUrl: `url(${Telegram})`,
    link: "https://t.me/elastosgroup/1",
  },
];

const Icon = styled("div")<{ iconUrl: string }>(({ iconUrl }) => ({
  height: "42px",
  width: "42px",
  backgroundSize: "42px",
  backgroundImage: `${iconUrl}`,
}));

const fixedStyle = `
  .fixed-social {
    position: fixed;
    bottom: 40px;
    right: 40px;
  }
`;

export const SocialGroup: FC<{ direction?: StackOwnProps["direction"] }> = (
  props
) => {
  const { direction = "row" } = props;
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <style>{fixedStyle}</style>
      <Stack
        direction={matches ? "row" : direction}
        alignItems="center"
        justifyContent="center"
        className={direction === "column" && !matches ? "fixed-social" : ""}
        marginTop="40px"
      >
        {socials.map(({ iconUrl, link }) => (
          <IconButton
            key={link}
            sx={{ padding: 0 }}
            href={link}
            target="_blank"
          >
            <Icon iconUrl={iconUrl} />
          </IconButton>
        ))}
      </Stack>
    </>
  );
};
