import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";
import reportWebVitals from "./reportWebVitals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  json,
  matchRoutes,
  RouterProvider,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import ErrorPage from "./components/pages/ErrorPage";
import HomePage from "./components/pages/old/HomePage";
import PersonaPage from "./components/pages/PersonaPage";
import PipelinePage from "./components/pages/old/PipelinePage";
import MissingPage from "./components/pages/MissingPage";
import { RecoilRoot } from "recoil";
import AuthPage from "@pages/AuthPage";
import RestrictedRoute from "./auth/RestrictedRoute";
import SettingsPage from "@pages/SettingsPage";
import LoginPage from "@pages/LoginPage";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import LinkedInPage from "@pages/LinkedInPage";
import EmailPage from "@pages/EmailPage";
import OnboardingModalPage from "@pages/OnboardingModalPage";
import AuthCalendlyPage from "@pages/AuthCalendlyPage";
import SetupPage from "@pages/SetupPage";
import DashboardSection from "@pages/DashboardPage";
import InboxPage from "@pages/InboxPage";
import AllContactsSection from "@common/home/AllContactsSection";
import { Box } from "@mantine/core";
import RecentActivitySection from "@common/home/RecentActivitySection";
import LinkedinQueuedMessages from "@common/messages/LinkedinQueuedMessages";
import EmailQueuedMessages from "@common/emails/EmailQueuedMessages";
import ContactsPage from "@pages/ContactsPage";
import ToolsPage from "@pages/ToolsPage";
import SetupPersonaCard from "@common/persona/SetupPersonaCard";

const queryClient = new QueryClient();

// Set Sentry up and wrap the router
if (import.meta.env.PROD) {
  Sentry.init({
    dsn:
      "https://562db49ea9174f5c9f9c75921f664755@o4504749544767488.ingest.sentry.io/4504776732901376",
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });
}
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
  createBrowserRouter
);

// Fixes cache issues on refresh
(async () => {
  // Clear the cache on startup
  const keys = await caches.keys();
  for (const key of keys) {
    caches.delete(key);
  }

  // Unregister our service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(async (registration) => {
      const result = await registration.unregister();
    });
  }
})();

// The DOM router for determining what pages are rendered at which paths
const router = sentryCreateBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <RestrictedRoute page={<InboxPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { prospectId: "" };
        },
      },
      {
        path: "dashboard",
        element: <RestrictedRoute page={<InboxPage />} />,
      },
      {
        path: "inbox",
        element: <RestrictedRoute page={<InboxPage />} />,
      },
      {
        path: "contacts/:prospectId?",
        element: <RestrictedRoute page={<ContactsPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { prospectId: params.prospectId };
        },
      },
      {
        path: "linkedin/:tabId?",
        element: <RestrictedRoute page={<LinkedInPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { tabId: params.tabId };
        },
      },
      {
        path: "email/:tabId?",
        element: <RestrictedRoute page={<EmailPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { tabId: params.tabId };
        },
      },
      {
        path: "tools/:tabId?",
        element: <RestrictedRoute page={<ToolsPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { tabId: params.tabId };
        },
      },
      {
        path: "personas",
        element: <RestrictedRoute page={<PersonaPage />} />,
      },
      {
        path: "personas/:personaId?",
        element: <RestrictedRoute page={<PersonaPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { personaId: params.personaId };
        },
      },
      /*
      {
        path: "campaigns/:campaignId?",
        element: <RestrictedRoute page={<CampaignPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { campaignId: params.campaignId };
        },
      },
      */
      {
        path: "settings/:tabId?",
        element: <RestrictedRoute page={<SettingsPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { tabId: params.tabId };
        },
      },
      {
        path: "onboarding",
        element: <RestrictedRoute page={<OnboardingModalPage />} />,
      },
      {
        path: "setup",
        element: <RestrictedRoute page={<SetupPage />} />,
      },
      {
        path: "authenticate",
        element: <AuthPage />,
      },
      {
        path: "authcalendly",
        element: <AuthCalendlyPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "projectsetup",
        element: <SetupPersonaCard />,
      },

      {
        path: "all/inboxes",
        element: <RestrictedRoute page={<InboxPage all/>} />,
      },
      {
        path: "all/contacts/:prospectId?",
        element: <RestrictedRoute page={<Box p='md'><AllContactsSection all /></Box>} />,
        loader: async ({ params }: { params: any }) => {
          return { prospectId: params.prospectId };
        },
      },
      {
        path: "all/recent-activity",
        element: <RestrictedRoute page={<Box p='md'><RecentActivitySection all /></Box>} />,
      },
      {
        path: "all/email-messages",
        element: <RestrictedRoute page={<Box p='md'><EmailQueuedMessages all /></Box>} />,
      },
      {
        path: "all/linkedin-messages",
        element: <RestrictedRoute page={<Box p='md'><LinkedinQueuedMessages all /></Box>} />,
      },

      {
        path: "*",
        element: <MissingPage />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <RecoilRoot>
      <Sentry.ErrorBoundary
        fallback={<div>An error has occurred</div>}
        showDialog
      >
        <RouterProvider router={router} />
      </Sentry.ErrorBoundary>
    </RecoilRoot>
  </QueryClientProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
