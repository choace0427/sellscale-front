import { userDataState } from "@atoms/userAtoms";
import PageFrame from "@common/PageFrame";
import EmailAnalyticsTable from "@common/analytics/EmailAnalyticsTable";
import CampaignTable from "@common/campaigns/CampaignTable";
import EmailQueuedMessages from "@common/emails/EmailQueuedMessages";
import AllContactsSection from "@common/home/AllContactsSection";
import RecActionsSection from "@common/home/DashboardSection";
import RecentActivitySection from "@common/home/RecentActivitySection";
import PersonaDetailsCTAs from "@common/persona/details/PersonaDetailsCTAs";
import PersonaDetailsTransformers from "@common/persona/details/PersonaDetailsTransformers";
import SequenceSection from "@common/sequence/SequenceSection";
import { Tabs } from "@mantine/core";
import { IconAffiliate, IconHistory, IconListDetails, IconMailFast, IconReport } from "@tabler/icons";
import { setPageTitle } from "@utils/documentChange";
import { useLoaderData } from "react-router-dom";
import { useRecoilValue } from "recoil";

export default function EmailPage() {
  setPageTitle("Email");

  const userData = useRecoilValue(userDataState);
  const { tabId } = useLoaderData() as { tabId: string };

  return (
    <PageFrame>
      <Tabs value={tabId} px="xs" color="teal">
        <Tabs.List sx={{ display: 'none' }}>
          <Tabs.Tab value="scheduled-emails" icon={<IconMailFast size="1.1rem" />}>Scheduled Emails</Tabs.Tab>
          <Tabs.Tab value="sequences" icon={<IconListDetails size="1.1rem" />}>Sequences</Tabs.Tab>
          <Tabs.Tab value="personalizations" icon={<IconAffiliate size="1.1rem" />}>Personalizations</Tabs.Tab>
          <Tabs.Tab value="campaign-history" icon={<IconHistory size="1.1rem" />}>Campaign History</Tabs.Tab>
          <Tabs.Tab value="email-details" icon={<IconReport size="1.1rem" />}>Sequence Analysis</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="scheduled-emails" pt="xs">
          <EmailQueuedMessages />
        </Tabs.Panel>
        <Tabs.Panel value="sequences" pt="xs">
          <SequenceSection />
        </Tabs.Panel>
        <Tabs.Panel value="personalizations" pt="xs">
          <PersonaDetailsTransformers channel="EMAIL" />
        </Tabs.Panel>
        <Tabs.Panel value="campaign-history" pt="xs">
          <CampaignTable type="EMAIL" />
        </Tabs.Panel>
        <Tabs.Panel value="email-details" pt="xs">
          <EmailAnalyticsTable />
        </Tabs.Panel>
      </Tabs>
    </PageFrame>
  );

}
