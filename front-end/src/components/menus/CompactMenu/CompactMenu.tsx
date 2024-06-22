import { Fade, IconButton, Menu, MenuItem } from "@mui/material";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";

export type CompactMenuEntry = {
  display: React.ReactNode;
  action?: () => void;
  hideAfterAction?: boolean;
};

export type CompactMenuProps = {
  children: ReactNode;
  menuOptions: Array<CompactMenuEntry | undefined>;
};

export const CompactMenu: FC<CompactMenuProps> = (props) => {
  const { menuOptions, children } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      handleClose();
    });

    return () => {
      window.removeEventListener("scroll", () => { });
    };
  }, [handleClose]);

  return (
    <>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? "long-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        {children}
      </IconButton>
      {open && (
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          TransitionComponent={Fade}
        >
          {menuOptions.map((entry, index) => entry && <MenuEntry entry={entry} index={index} handleClose={handleClose} key={index} />)}
        </Menu>
      )}
    </>
  );
};

const MenuEntry: FC<{
  entry: CompactMenuEntry;
  index: number;
  handleClose: () => void;
}> = ({ entry, handleClose }) => {
  const { display, action, hideAfterAction = false } = entry;
  return (<MenuItem
    sx={{
      padding: {
        sm: "8px 0",
        xs: "2px 0",
      },
      minHeight: {
        sm: "48px",
        xs: "34px",
      },
    }}
    divider
    onClick={() => {
      action?.();
      if (hideAfterAction)
        handleClose();
    }}
  >
    {display}
  </MenuItem>
  )
}