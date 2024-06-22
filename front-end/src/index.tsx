window.Buffer = window.Buffer || require("buffer").Buffer;

import { BitcoinWalletChooserProvider } from "@components/modals/BitcoinWalletChooser/BitcoinWalletChooser";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import * as Sentry from "@sentry/react";
import { SnackbarProvider } from "notistack";
import * as ReactDOM from "react-dom/client";
import { ErrorHandlerProvider, WalletProvider } from "./contexts";
import { Routing } from "./routes/Routing";
import theme from "./theme";

// Sentry account: proctar.elastos@gmail.com
Sentry.init({
  dsn: "https://5e7f86dd07e6eaa8d9c3ba4a051b6e09@o4507416524816384.ingest.de.sentry.io/4507416533794896",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/lending\.bel2\.org/, /^https:\/\/lending-staging\.bel2\.org/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement!);

root.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    <SnackbarProvider
      maxSnack={1}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      autoHideDuration={1000}
    >
      <ErrorHandlerProvider>
        <WalletProvider>
          <BitcoinWalletChooserProvider>
            <Routing />
          </BitcoinWalletChooserProvider>
        </WalletProvider>
      </ErrorHandlerProvider>
    </SnackbarProvider>
  </ThemeProvider>
);
