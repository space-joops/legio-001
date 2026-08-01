import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4d6980", // --color-primary from original globals.css
    },
    secondary: {
      main: "#a3342c", // --color-danger from original globals.css
    },
    background: {
      default: "#fafaf5", // --color-background
      paper: "#efe8dc", // --color-surface
    },
    text: {
      primary: "#4a3a2a", // --color-text
      secondary: "#5c4a36", // --color-text-dim
    },
  },
  typography: {
    fontFamily: "var(--font-nanum), -apple-system, sans-serif",
  },
  shape: {
    borderRadius: 12, // Rounder corners for modern feel
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          padding: "12px 24px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
  },
});

export default theme;
