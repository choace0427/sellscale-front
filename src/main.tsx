import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";
import reportWebVitals from "./reportWebVitals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  RouterProvider,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import ErrorPage from "./components/pages/ErrorPage";
import PersonaPage from "./components/pages/PersonaPage";
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
import SetupPage, { OnboardingTable } from "@pages/SetupPage";
import InboxPage from "@pages/InboxPage";
import AllContactsSection from "@common/home/AllContactsSection";
import { Box } from "@mantine/core";
import RecentActivitySection from "@common/home/RecentActivitySection";
import LinkedinQueuedMessages from "@common/messages/LinkedinQueuedMessages";
import EmailQueuedMessages from "@common/emails/EmailQueuedMessages";
import ContactsPage from "@pages/ContactsPage";
import ToolsPage from "@pages/ToolsPage";
import SetupPersonaCard from "@common/persona/SetupPersonaCard";
import PersonaBrain from "@common/persona/PersonaBrain";
import { PulseWrapper } from "@common/persona/PulseWrapper";
import { LinkedinConvoSimulatorPage } from "@common/simulators/linkedin/LinkedinConvoSimulatorPage";
import { PullProspectEmailsCardPage } from "@common/credits/PullProspectEmailsCardPage";
import EmailBlocksPage from "@pages/EmailBlocksPage";
import FindContactsPage from "@pages/FindContactsPage";
import { PersonaSplitPage } from "@common/persona/PersonaSplitPage";
import CleanContactsPage from "@pages/CleanContactsPage";
import PersonaSettingsPage from "@pages/PersonaSettingsPage";
import EmailSimulatePage from "@pages/EmailSimulatePage";
import PipelineSection from "@common/home/PipelineSection";
import PersonaCampaigns from "@common/campaigns/PersonaCampaigns";
import AdvancedPage from "@pages/AdvancedPage";
import ChannelSetupPage from "@pages/ChannelSetupPage";
import PulseTabSelector from "@common/persona/PulseTabSelector";
import PersonaOnboarding from "@pages/PreOnboarding";
import AnalyticPage from "@pages/AnalyticPage";
import OverviewPage from "@pages/OverviewPage";
import ContactOverview from "@common/persona/ContactOverview";
import TriggersPage from "@pages/TriggersPage";
import TriggersList from "@pages/TriggersList";
import EmailHome from "@common/resend_email/resend_email";
import ProspectDetailPage from "@pages/ProspectDetail";
import ComingSoonCard from "@common/library/ComingSoonCard";
import AnalyticsPageNew from "@pages/AnalyticsPageNew";
import AdjustPage from "@pages/AdjustAIPage";
import SlackAuthPage from "@pages/SlackAuthPage";
import EmailGrader from "@pages/EmailGrader/EmailGrader";
import { CampaignDetail } from "@pages/CampaignDetail";
import InboxRestructurePage from "@pages/InboxRestructurePage";
import CampaignReview from "@pages/CampaignReview/CampaignReviewLinkedin";
import CompanyOverview from "@common/company/CompanyOverview";
import OperatorDashTaskRouter from "@pages/Overview/OperatorDash/OperatorDashTaskRouter";
import TaskEmailTemplate from "@common/resend_email/task_resend_email";
import ExtractPdfPage from "@pages/ExtractPdfPage";
import AssetLibraryV2 from "@pages/AssetLibraryV2";
import ClientCampaignView from "@pages/ClientCampaignView/ClientCampaignView";
import { CampaignAGI } from "@pages/CampaignAGI/CampaignAGI";

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
        element: <RestrictedRoute page={<OverviewPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { prospectId: "" };
        },
      },
      {
        path: "dashboard",
        element: <RestrictedRoute page={<InboxPage />} />,
      },
      {
        path: "inbox_old",
        element: <RestrictedRoute page={<InboxPage />} />,
      },
      {
        path: "inbox",
        element: <RestrictedRoute page={<InboxRestructurePage />} />,
      },
      {
        path: "/task/:id",
        element: <RestrictedRoute page={<OperatorDashTaskRouter />} />,
      },
      {
        path: "Overview",
        element: <RestrictedRoute page={<OverviewPage />} />,
      },
      {
        path: "teach",
        element: <RestrictedRoute page={<PersonaBrain />} />,
      },
      {
        path: "prioritize/:archetypeId?",
        element: (
          <RestrictedRoute
            page={
              <Box bg={"white"}>
                <PulseTabSelector />
              </Box>
            }
          />
        ),
        loader: async ({ params }: { params: any }) => {
          return { archetypeId: params.archetypeId };
        },
      },
      {
        path: "contacts/overview",
        element: <RestrictedRoute page={<ContactOverview />} />,
      },
      {
        path: "contacts/find",
        element: <RestrictedRoute page={<FindContactsPage />} />,
      },
      {
        path: "tools/contacts-clean",
        element: <RestrictedRoute page={<CleanContactsPage />} />,
      },
      {
        path: "persona/settings",
        element: <RestrictedRoute page={<PersonaSettingsPage />} />,
      },
      {
        path: "contacts/view/:prospectId?",
        element: (
          <RestrictedRoute
            page={
              <Box bg={"white"}>
                <PulseTabSelector />
              </Box>
            }
          />
        ),
        loader: async ({ params }: { params: any }) => {
          return { prospectId: params.prospectId };
        },
      },
      {
        path: "/linkedin/simulate",
        element: <RestrictedRoute page={<LinkedinConvoSimulatorPage />} />,
      },
      {
        path: "setup/:channelType?/:tabId?",
        element: <RestrictedRoute page={<ChannelSetupPage />} />,
        loader: async ({ params }: { params: any }) => {
          return { channelType: params.channelType, tabId: params.tabId };
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
        path: "email/blocks",
        element: <RestrictedRoute page={<EmailBlocksPage />} />,
      },
      {
        path: "email/simulate",
        element: <RestrictedRoute page={<EmailSimulatePage />} />,
      },
      {
        path: "tools/email-scraper",
        element: <RestrictedRoute page={<PullProspectEmailsCardPage />} />,
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
        path: "extract-pdf",
        element: <RestrictedRoute page={<ExtractPdfPage />} />,
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
        element: <RestrictedRoute page={<PersonaOnboarding />} />,
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
        element: <RestrictedRoute page={<InboxPage all />} />,
      },
      {
        path: "prospects/:prospectId",
        element: <RestrictedRoute page={<ProspectDetailPage />} />,
      },
      {
        path: "all/contacts/:prospectId?",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <AllContactsSection all />
              </Box>
            }
          />
        ),
        loader: async ({ params }: { params: any }) => {
          return { prospectId: params.prospectId };
        },
      },
      {
        path: "contacts/:prospectId?",
        element: (
          <RestrictedRoute
            page={
              <Box bg={"white"}>
                <PulseTabSelector />
              </Box>
            }
          />
        ),
        loader: async ({ params }: { params: any }) => {
          return { prospectId: params.prospectId };
        },
      },
      {
        path: "all/recent-activity",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <RecentActivitySection all />
              </Box>
            }
          />
        ),
      },
      {
        path: "notifications",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <RecentActivitySection all />
              </Box>
            }
          />
        ),
      },
      {
        path: "all/pipeline",
        element: (
          <RestrictedRoute
            page={
              <Box p="md" bg={"white"}>
                <PipelineSection />
              </Box>
            }
          />
        ),
      },
      {
        path: "analytics-old",
        element: (
          <RestrictedRoute
            page={
              <Box p="md" bg={"gray.1"}>
                <AnalyticPage />
              </Box>
            }
          />
        ),
      },
      {
        path: "analytics",
        element: (
          <RestrictedRoute
            page={
              <Box p="md" bg={"gray.1"}>
                <AnalyticsPageNew />
              </Box>
            }
          />
        ),
      },
      {
        path: "all/email-messages",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <EmailQueuedMessages all />
              </Box>
            }
          />
        ),
      },
      {
        path: "all/campaigns",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <PersonaCampaigns />
              </Box>
            }
          />
        ),
      },
      {
        path: "campaigns",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <PersonaCampaigns />
              </Box>
            }
          />
        ),
      },
      {
        path: "campaigns/:id",
        element: (
          <RestrictedRoute
            page={
              <Box>
                <CampaignDetail />
              </Box>
            }
          />
        ),
      },
      {
        path: "all/linkedin-messages",
        element: (
          <RestrictedRoute
            page={
              <Box p="md">
                <LinkedinQueuedMessages all />
              </Box>
            }
          />
        ),
      },
      {
        path: "/split/contacts",
        element: <RestrictedRoute page={<PersonaSplitPage />} />,
      },
      {
        path: "/advanced",
        element: <RestrictedRoute page={<AdvancedPage />} />,
      },
      {
        path: "/create-trigger",
        element: <RestrictedRoute page={<TriggersPage />} />,
      },
      {
        path: "/triggers",
        element: <RestrictedRoute page={<TriggersList />} />,
      },
      {
        path: "/weekly-update",
        element: <RestrictedRoute page={<EmailHome />} />,
      },
      {
        path: "/task-update",
        element: <RestrictedRoute page={<TaskEmailTemplate />} />,
      },
      {
        path: "/slack-auth",
        element: <SlackAuthPage />,
      },

      {
        path: "/emailgrader",
        element: <EmailGrader />,
      },
      {
        path: "*",
        element: <MissingPage />,
      },
      {
        path: "/ai-request",
        element: <AdjustPage />,
      },
      {
        path: "/company/:id",
        element: <CompanyOverview />,
      },
      {
        path: "/assetLibrary",
        element: <AssetLibraryV2 />,
      },
      {
        path: "/clientCampaignView",
        element: <ClientCampaignView />,
      },
      {
        path: "/campaign-agi",
        element: <CampaignAGI />,
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
