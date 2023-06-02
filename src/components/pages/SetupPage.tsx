import { prospectDrawerIdState, prospectDrawerOpenState } from '@atoms/prospectAtoms';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import PageFrame from '@common/PageFrame';
import DemoFeedbackChart from '@common/charts/DemoFeedbackChart';
import AllContactsSection from '@common/home/AllContactsSection';
import DashboardSection from '@common/home/DashboardSection';
import RecentActivitySection from '@common/home/RecentActivitySection';
import {
  Accordion,
  Avatar,
  Badge,
  Text,
  Container,
  Group,
  Progress,
  ScrollArea,
  Select,
  Table,
  Title,
  createStyles,
  Button,
} from '@mantine/core';
import { IconActivity, IconAddressBook, IconCalendarEvent, IconCheckbox, IconClipboardData } from '@tabler/icons';
import { navigateToPage, setPageTitle } from '@utils/documentChange';
import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import BumpFrameworksPage from './BumpFrameworksPage';
import CalendarSection from '@common/home/CalendarSection';
import { getOnboardingCompletionReport } from '@utils/requests/getOnboardingCompletionReport';
import { useQuery } from '@tanstack/react-query';

const useStyles = createStyles((theme) => ({
  item: {
    fontSize: theme.fontSizes.sm,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1],
  },
}));

export default function SetupPage() {
  setPageTitle('Setup');
  const { classes } = useStyles();

  const userToken = useRecoilValue(userTokenState);

  const { data, isFetching, refetch } = useQuery({
    queryKey: [`query-sdr-onboarding-completion-report`],
    queryFn: async () => {
      const response = await getOnboardingCompletionReport(userToken);
      return response.status === 'success' ? response.data : null;
    },
  });
  
  if(!data){
    return (<></>);
  }

  // Get percentage from completed steps in report
  let stepsCount = 0;
  let completedStepsCount = 0;
  for(const key in data){
    stepsCount += Object.keys(data[key]).length;
    completedStepsCount += Object.values(data[key]).flat().filter((item: any) => item).length;
  }
  stepsCount -= 4; // TEMP: Remove the 4 coming soon steps that are always false

  const percentage = Math.round((completedStepsCount / stepsCount) * 100);

  return (
    <PageFrame>
      <Container mb='lg'>
        <Progress label={`${percentage}% Complete`} color='green' size={25} value={percentage} radius='lg' />
      </Container>

      <Accordion chevronPosition='right' defaultValue='general' variant='separated'>
        <Accordion.Item className={classes.item} value='general'>
          <Accordion.Control>
            <Title order={3}>General Onboarding</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <GeneralOnboarding data={data} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value='persona'>
          <Accordion.Control>
            <Title order={3}>Persona Onboarding</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <PersonaOnboarding data={data} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value='msg-gen'>
          <Accordion.Control>
            <Title order={3}>Message Generation Onboarding</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <MessageGenerationOnboarding data={data} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </PageFrame>
  );
}

function GeneralOnboarding(props: { data: any }) {
  return (
    <OnboardingTable
      data={[
        {
          title: 'Company Information',
          description: 'Collect general company information',
          link: '/settings/sellScaleBrain',
          complete: props.data.general.company_info,
        },
        {
          title: 'SDR Information',
          description: 'Collect general SDR information',
          link: '/settings/sellScaleBrain',
          complete: props.data.general.sdr_info,
        },
        {
          title: 'Scheduling Information',
          description: 'Connect to Calendly OR scheduling link',
          link: '/settings/calendarAndScheduling',
          complete: props.data.general.scheduling_info,
        },
        {
          title: 'Email Integration',
          description: 'Connect to SDRs email and calendar',
          link: '/settings/emailConnection',
          complete: props.data.general.email_integration,
        },
        {
          title: 'LinkedIn Integration',
          description: 'Connect to LinkedIn',
          link: '/settings/linkedinConnection',
          complete: props.data.general.linkedin_integration,
        },
      ]}
    />
  );
}

function PersonaOnboarding(props: { data: any }) {
  return (
    <OnboardingTable
      data={[
        {
          title: 'Create Personas',
          description: 'Create your first persona',
          link: '/personas',
          complete: props.data.persona.create_personas,
        },
        {
          title: 'Create Persona Linkedin Filters',
          description: 'Select filters we can apply on Linkedin to find targets',
          link: null,
          complete: props.data.persona.linkedin_filters,
        },
        {
          title: 'Add Do Not Contact List Filters',
          description: 'Customize who they do not want to target',
          link: '/settings/doNotContact',
          complete: props.data.persona.do_not_contact_filters,
        },
      ]}
    />
  );
}

function MessageGenerationOnboarding(props: { data: any }) {
  return (
    <OnboardingTable
      data={[
        {
          title: 'Create Linkedin CTAs',
          description: 'Customize which CTAs the AI uses to outbound',
          link: '/linkedin/ctas',
          complete: props.data.msg_gen.create_linkedin_ctas,
        },
        {
          title: 'Create Email Style',
          description: 'Customize the email prompt',
          link: null,
          complete: props.data.msg_gen.create_email_style,
        },
        {
          title: 'Voice Builder',
          description: 'Customize the AI voice for outbound',
          link: null,
          complete: props.data.msg_gen.voice_builder,
        },
        {
          title: 'Bump Frameworks for LinkedIn',
          description: 'Customize how the AI responses on LinkedIn',
          link: '/home/bump-frameworks',
          complete: props.data.msg_gen.bump_framework_linkedin,
        },
        {
          title: 'Bump Frameworks for Email',
          description: 'Customize how the AI responses on email',
          link: null,
          complete: props.data.msg_gen.bump_framework_email,
        },
      ]}
    />
  );
}

interface OnboardingTableProps {
  data: { title: string; description: string; link: string | null; complete: boolean }[];
}
export function OnboardingTable({ data }: OnboardingTableProps) {
  const navigate = useNavigate();

  const rows = data.map((item, index) => (
    <tr key={index}>
      <td>
        <Group spacing='sm'>
          <div>
            <Text fz='md' fw={500}>
              {item.title}
            </Text>
            <Text fz='sm' c='dimmed'>
              {item.description}
            </Text>
          </div>
        </Group>
      </td>

      <td>
        <Button
          variant='subtle'
          color='green'
          disabled={item.link === null}
          onClick={() => {
            if (item.link) {
              navigateToPage(navigate, item.link);
            }
          }}
        >
          {item.link === null ? 'Coming Soon!' : 'Open Section'}
        </Button>
      </td>
      <td>
        {item.complete ? (
          <Badge fullWidth color='green'>
            Complete
          </Badge>
        ) : (
          <Badge color='gray' fullWidth>
            Incomplete
          </Badge>
        )}
      </td>
    </tr>
  ));

  return (
    <ScrollArea>
      <Table miw={800} verticalSpacing='sm'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Section Link</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </ScrollArea>
  );
}
