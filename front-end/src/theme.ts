import { red } from "@mui/material/colors";
import { alpha, createTheme } from "@mui/material/styles";

import {
  BACKGROUND_PRIMARY_COLOR,
  BACKGROUND_SECONDARY_COLOR,
  MAIN_FONT_FAMILY,
  TEXT_INVERTED_COLOR,
  TEXT_PRIMARY_COLOR,
  TEXT_SECONDARY_COLOR,
} from "./constants";

// // Augment the palette to include a violet color
declare module "@mui/material/styles" {
  interface Palette {
    violet: Palette["primary"];
  }

  interface PaletteOptions {
    violet?: PaletteOptions["primary"];
  }
}

// A custom theme for this app
const theme = createTheme({
  typography: {
    allVariants: {
      fontFamily: MAIN_FONT_FAMILY,
      textTransform: "none",
      fontSize: 16,
      color: "#FFFFFF"
    },
  },
  palette: {
    violet: {
      main: "#131732",
      light: "#080c27",
    },
    primary: {
      main: TEXT_PRIMARY_COLOR,
    },
    secondary: {
      main: TEXT_SECONDARY_COLOR,
    },
    error: {
      main: red.A400,
    },
    action: {
      disabled: "rgba(255, 255, 255, 0.2)",
      disabledBackground: "rgba(255, 255, 255, 0.2)",
    },
    text: {
      primary: "#fff",
      secondary: "#bec2da",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        sx: {
          borderRadius: "0.5rem",
        },
      },
    },
    MuiInputBase: {
      defaultProps: {
        sx: {
          borderRadius: "0.5rem",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
        disableFocusRipple: true
      },
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '4px 8px'
          },
          textTransform: "none",
          borderRadius: "0.5rem",
          //border: "1px solid rgba(255, 68, 132, 0.80)",
          fontWeight: "700",
          fontSize: "16px",
          "&.Mui-disabled": {
            border: "none",
          },
        },
        text: {
          border: "none",
          "&:hover": {
            background: "none",
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: true,
        disableFocusRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
        disableFocusRipple: true,
        sx: {
          fontSize: "inherit",
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: "inherit",
          color: alpha(TEXT_SECONDARY_COLOR, 0.54),
          cursor: "pointer",
          width: "16px",
          height: "16px",
          "&.MuiSelect-icon": {
            color: alpha(TEXT_SECONDARY_COLOR, 0.54)
          }
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          border: `1px solid ${alpha(BACKGROUND_PRIMARY_COLOR, 0.3)}`,
          background: "rgba(0,0,0,0.2)", // "#131732",
          marginBottom: "40px",
          overflow: 'hidden'
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          border: "none",
        },
        head: {
          color: alpha(TEXT_SECONDARY_COLOR, 0.87),
          borderBottom: `1px solid ${BACKGROUND_PRIMARY_COLOR}`,
          fontSize: "18px",
          fontWeight: 500,
          lineHeight: "24px",
          letterSpacing: "0.17px",
        },
        body: {
          color: "#fff",
        },
      },
    },
    MuiTableFooter: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0,0,0,0.2)", // "#0E1230",
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: alpha(TEXT_INVERTED_COLOR, 0.87),
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "166%",
          letterSpacing: "0.4px",
        },
        selectLabel: {
          color: alpha(TEXT_INVERTED_COLOR, 0.6),
        },
        selectIcon: {
          color: alpha(TEXT_INVERTED_COLOR, 0.54),
        },
        actions: {
          color: alpha(TEXT_INVERTED_COLOR, 0.54),
        },
      },
    },
    MuiList: {
      defaultProps: {
        sx: {
          color: TEXT_PRIMARY_COLOR,
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        sx: {
          color: TEXT_PRIMARY_COLOR,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(BACKGROUND_PRIMARY_COLOR, 1), //"#131732",
          border: "1px solid rgba(190, 194, 218, 0.30)",
          borderRadius: "16px",
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          color: TEXT_PRIMARY_COLOR,
          fontSize: " 24px",
          fontStyle: "normal",
          fontWeight: "700",
          lineHeight: "133.4%",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: BACKGROUND_PRIMARY_COLOR, // "#131732",
          padding: "4px 20px",
          borderRadius: "16px",
          border: "1px solid rgba(190, 194, 218, 0.30)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "rgba(190, 194, 218, 0.87)",
          padding: "8px 0",
          backgroundColor: "transparent",
          "&.Mui-selected": { color: BACKGROUND_SECONDARY_COLOR, backgroundColor: "transparent !important" },
          "&:hover": { color: `${BACKGROUND_SECONDARY_COLOR} !important` },
        },
        divider: {
          borderColor: "rgba(190, 194, 218, 0.12)",
          "&:last-child": {
            border: "none",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // height: "56px",
        },
        notchedOutline: {
          border: "2px solid rgba(190, 194, 218, 0.23)",
          borderRadius: "8px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: MAIN_FONT_FAMILY,
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { backgroundColor: BACKGROUND_SECONDARY_COLOR },
          "&.Mui-selected:hover": { backgroundColor: BACKGROUND_SECONDARY_COLOR },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: TEXT_SECONDARY_COLOR,
        },
        colorPrimary: {
          "&.Mui-checked": {
            color: TEXT_PRIMARY_COLOR,
          },
        },
        track: {
          opacity: 0.5,
          backgroundColor: TEXT_SECONDARY_COLOR,
          ".Mui-checked.Mui-checked + &": {
            opacity: 0.5,
            backgroundColor: TEXT_PRIMARY_COLOR,
          },
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        ul: {
          justifyContent: 'center'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          maxWidth: 'fit-content'
        }
      }
    }
  },
});

export default theme;
