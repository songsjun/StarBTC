import { ErrorOutline } from "@mui/icons-material";
import {
  ClickAwayListener,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FC, ReactNode, useState } from "react";
import Web3 from "web3";

/**
 * Shows a question mark icon.
 * When hovered, that icon shows a tooltip.
 */
export const IconTip: FC<{
  title?: string;
  content: string;
}> = ({ title, content }) => {
  const theme = useTheme();
  const matchSmallMedia = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false)
  };

  const handleTooltipOpen = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation();
    setOpen(true);
  };

  const TitleEl: ReactNode = (
    <>
      {title && <Typography fontWeight={600}>{title}</Typography>}
      <Typography>{content}</Typography>
    </>
  );

  return matchSmallMedia ? (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip placement="top" open={open} arrow
        PopperProps={{
          disablePortal: true,
        }}
        title={TitleEl}>
        <ErrorOutline onClick={handleTooltipOpen} />
      </Tooltip>
    </ClickAwayListener>
  ) : (
    <Tooltip placement="top" title={TitleEl} arrow>
      <ErrorOutline />
    </Tooltip>
  );
}

export const ErrorTip: FC<{ value: string }> = (props) => {
  const { value } = props;
  const match = /^[0-9a-zA-Z_\-\p{Emoji_Presentation}]+$/u.test(value);
  const hexString = Web3.utils.stringToHex(value).replace(/^0x/, "");
  const spacedHexString = "0x " + hexString.match(/.{1,2}/g)?.join(" ");

  if (match)
    return null;

  return <IconTip
    title="This token name contains special or invisible characters."
    content={`Ticker Hex: ${spacedHexString}`} />
};
