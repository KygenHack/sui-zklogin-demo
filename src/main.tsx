import React from 'react';
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import i18n from "i18next";
import ReactDOM from "react-dom/client";
import { initReactI18next } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import { StyledSnackbarProvider } from "./components/StyledSnackbarProvider.tsx";
import "./index.css";
import ThemeConfig from "./theme/index.ts";
import { resources } from "./lang/resources.ts";
import '@telegram-apps/telegram-ui/dist/styles.css';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { retrieveLaunchParams, backButton } from '@telegram-apps/sdk-react';
import { init } from './init.ts';
import './mockEnv.ts';
import { EnvUnsupported } from './components/EnvUnsupported.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import {
  DEVNET_COUNTER_PACKAGE_ID,
  TESTNET_COUNTER_PACKAGE_ID,
  MAINNET_COUNTER_PACKAGE_ID,
} from "./constant.ts";

const { networkConfig } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
    }
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      counterPackageId: TESTNET_COUNTER_PACKAGE_ID,
    }
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      counterPackageId: MAINNET_COUNTER_PACKAGE_ID,
    }
  }
});

const queryClient = new QueryClient();

i18n
  .use(initReactI18next)
  .init({
    resources: resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

const root = ReactDOM.createRoot(document.getElementById("root")!);

const Root = () => (
  <BrowserRouter>
    <AppRoot>
      <ErrorBoundary>
        <ThemeProvider theme={createTheme(ThemeConfig)}>
          <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
              <StyledSnackbarProvider maxSnack={4} autoHideDuration={3000} />
              <Routes>
                <Route path="/" element={<App />}></Route>
              </Routes>
              <Analytics />
            </SuiClientProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </AppRoot>
  </BrowserRouter>
);

try {
  // Configure all application dependencies
  init(retrieveLaunchParams().startParam === 'debug' || import.meta.env.DEV);
  
  // Setup back button handler
  backButton.onClick(() => {
    window.history.back();
  });

  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} catch (e) {
  console.error('Failed to initialize Telegram environment:', e);
  root.render(<EnvUnsupported />);
}
