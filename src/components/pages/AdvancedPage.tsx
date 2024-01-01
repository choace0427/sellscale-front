import PageFrame from "@common/PageFrame";
import { Stack, Tabs, rem } from "@mantine/core";
import FindContactsPage from "./FindContactsPage";
import CustomResearchPointCard from "@common/persona/CustomResearchPointCard";
import { PullProspectEmailsCardPage } from "@common/credits/PullProspectEmailsCardPage";
import PersonaFilters from "@common/persona/PersonaFilters";
import CleanContactsPage from "./CleanContactsPage";
import { currentProjectState } from "@atoms/personaAtoms";
import { useRecoilState } from "recoil";
import { PersonaOverview } from "src";
import { ProjectSelect } from "@common/library/ProjectSelect";
import DomainSection from "@common/domains/DomainSection";
import DemoFeedbackChart from "@common/charts/DemoFeedbackChart";

export default function AdvancedPage(props: {}) {
  const [_, setCurrentProject] = useRecoilState(currentProjectState);

  return (
    <PageFrame>
      <Stack>
        <ProjectSelect
          onClick={(persona: PersonaOverview) => {
            setCurrentProject(persona);
          }}
        />
        <Tabs
          defaultValue="find-contacts"
          styles={(theme) => ({
            tab: {
              borderBottom: `2px solid transparent`,
              "&[data-active]": {
                borderBottom: `2px solid ${
                  theme.colors.blue[theme.fn.primaryShade()]
                }`,
                color: theme.colors.blue[theme.fn.primaryShade()],
              },
              paddingTop: rem(16),
              paddingBottom: rem(16),

              color: theme.colors.gray[6],
            },
            panel: {
              marginTop: rem(16),
              paddingLeft: `${rem(0)} !important`,
            },
            tabLabel: {
              fontWeight: 600,
            },
          })}
        >
          <Tabs.List>
            <Tabs.Tab value="find-contacts">Find Contacts</Tabs.Tab>
            <Tabs.Tab value="custom-data-importer">
              Custom Data Point Importer
            </Tabs.Tab>
            <Tabs.Tab value="demo-feedback">Demo Feedback Repo</Tabs.Tab>

            <Tabs.Tab value="email-scraper">Email Scraper</Tabs.Tab>
            <Tabs.Tab value="domains">Domains</Tabs.Tab>
            {/* <Tabs.Tab value="filters">Filters</Tabs.Tab> */}
            {/* <Tabs.Tab value="clean-contacts">Clean Contacts</Tabs.Tab> */}
          </Tabs.List>

          <Tabs.Panel value="find-contacts" pl="xs">
            <FindContactsPage />
          </Tabs.Panel>
          <Tabs.Panel value="custom-data-importer" pl="xs">
            <CustomResearchPointCard />
          </Tabs.Panel>

          <Tabs.Panel value="demo-feedback" pl="xs">
            <DemoFeedbackChart />
          </Tabs.Panel>
          <Tabs.Panel value="email-scraper" pl="xs">
            <PullProspectEmailsCardPage />
          </Tabs.Panel>
          <Tabs.Panel value="domains" pl="xs">
            <DomainSection />
          </Tabs.Panel>
          <Tabs.Panel value="filters" pl="xs">
            <PersonaFilters />
          </Tabs.Panel>
          <Tabs.Panel value="clean-contacts" pl="xs">
            <CleanContactsPage />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PageFrame>
  );
}
