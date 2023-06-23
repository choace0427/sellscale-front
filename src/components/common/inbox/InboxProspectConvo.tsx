import { openedOutboundChannelState, openedProspectIdState } from '@atoms/inboxAtoms';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import TextWithNewlines from '@common/library/TextWithNewlines';
import loaderWithText from '@common/library/loaderWithText';
import {
  Button,
  Flex,
  Group,
  Paper,
  Title,
  Text,
  Textarea,
  useMantineTheme,
  Divider,
  Tabs,
  ActionIcon,
  Badge,
  Container,
  Avatar,
  Stack,
  ScrollArea,
  LoadingOverlay,
  Center,
} from '@mantine/core';
import { IconExternalLink, IconWriting, IconSend, IconBrandLinkedin, IconMail, IconDots } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { convertDateToCasualTime, convertDateToLocalTime } from '@utils/general';
import { getConversation } from '@utils/requests/getConversation';
import { getProspectByID } from '@utils/requests/getProspectByID';
import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { LinkedInMessage, Prospect } from 'src';
import { labelizeConvoSubstatus } from './utils';
import { readLiMessages } from '@utils/requests/readMessages';
import ProspectDetailsCalendarLink from '@common/prospectDetails/ProspectDetailsCalendarLink';
import ProspectDetailsOptionsMenu from '@common/prospectDetails/ProspectDetailsOptionsMenu';

export function ProspectConvoMessage(props: {
  img_url: string;
  name: string;
  message: string;
  timestamp: string;
  is_me: boolean;
}) {
  return (
    <Container py={5}>
      <Flex gap={0} wrap='nowrap'>
        <div style={{ flexBasis: '10%' }}>
          <Avatar size='md' radius='xl' m={5} src={props.img_url} />
        </div>
        <div style={{ flexBasis: '90%' }}>
          <Stack spacing={5}>
            <Group position='apart'>
              <Title order={6}>{props.name}</Title>
              <Text weight={400} size={11} c='dimmed' pr={10}>
                {props.timestamp /* Mar 21, 7:39 PM */}
              </Text>
            </Group>
            <TextWithNewlines style={{ fontSize: '0.875rem' }}>{props.message}</TextWithNewlines>
          </Stack>
        </div>
      </Flex>
    </Container>
  );
}

export const HEADER_HEIGHT = 102;

export default function ProspectConvo(props: { prospects: Prospect[] }) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);
  const openedProspectId = useRecoilValue(openedProspectIdState);
  const [openedOutboundChannel, setOpenedOutboundChannel] = useRecoilState(openedOutboundChannelState);

  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });

  const { data, isFetching } = useQuery({
    queryKey: [`query-get-dashboard-prospect-${openedProspectId}`],
    queryFn: async () => {
      const response = await getProspectByID(userToken, openedProspectId);
      return response.status === 'success' ? response.data : [];
    },
    enabled: openedProspectId !== -1,
  });

  const { data: messages, isFetching: isFetchingMessages } = useQuery({
    queryKey: [`query-get-dashboard-prospect-${openedProspectId}-convo-${openedOutboundChannel}`],
    queryFn: async () => {

      // TODO: We don't handle email messages yet
      if(openedOutboundChannel === 'email') {
        return [];
      }

      const result = await getConversation(userToken, openedProspectId);
      // Indicate messages as read
      const readLiResult = await readLiMessages(userToken, openedProspectId);
      if (readLiResult.status === 'success' && readLiResult.data.updated) {
        // Update the prospect list
        queryClient.invalidateQueries({
          queryKey: ['query-dash-get-prospects'],
        });
      }
      return result.status === 'success' ? (result.data.data.reverse() as LinkedInMessage[]) : [];
    },
    enabled: openedProspectId !== -1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    scrollToBottom();
  }, [isFetchingMessages]);

  console.log(data);
  const statusValue = data?.details?.linkedin_status || 'ACTIVE_CONVO';

  const linkedin_public_id = data?.li.li_profile?.split('/in/')[1]?.split('/')[0] ?? '';

  return (
    <Flex gap={0} direction='column' wrap='nowrap' h='100vh'>
      <div style={{ height: HEADER_HEIGHT, position: 'relative' }}>
        <Group position='apart' p={15} h={66} sx={{ flexWrap: 'nowrap' }}>
          <div style={{ overflow: 'hidden' }}>
            <Title order={3} truncate>
              {data?.details.full_name}
            </Title>
            <Text weight={300} fs='italic' size={10} c='dimmed' truncate>
              Last Updated: {convertDateToCasualTime(new Date())}
            </Text>
          </div>
          <Group sx={{ flexWrap: 'nowrap' }}>
            <Badge size='lg' color={'blue'}>
              {labelizeConvoSubstatus(statusValue)}
            </Badge>
            <ProspectDetailsOptionsMenu
              prospectId={openedProspectId}
            />
          </Group>
        </Group>
        <Tabs
          variant='outline'
          defaultValue='linkedin'
          radius={theme.radius.md}
          h={36}
          value={openedOutboundChannel}
          onTabChange={(value) => {
            if (value) {
              setOpenedOutboundChannel(value);
            }
          }}
        >
          <Tabs.List px={20}>
            <Tabs.Tab value='linkedin' icon={<IconBrandLinkedin size='0.8rem' />}>
              LinkedIn
            </Tabs.Tab>
            <Tabs.Tab value='email' icon={<IconMail size='0.8rem' />}>
              Email
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
        {statusValue === 'ACTIVE_CONVO_SCHEDULING' && (
          <div style={{ position: 'absolute', bottom: 7, right: 15 }}>
            <ProspectDetailsCalendarLink calendarLink={userData.scheduling_link} width='250px' />
          </div>
        )}
      </div>
      <div
        style={{
          height: `calc((100vh - ${HEADER_HEIGHT}px)*0.75)`,
          alignItems: 'stretch',
        }}
      >
        <ScrollArea h={`calc((100vh - ${HEADER_HEIGHT}px)*0.75)`} viewportRef={viewport}>
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <LoadingOverlay loader={loaderWithText('')} visible={isFetchingMessages} />
            {messages &&
              messages.map((msg, i) => (
                <ProspectConvoMessage
                  key={i}
                  img_url={msg.img_url}
                  name={`${msg.first_name} ${msg.last_name}`}
                  message={msg.message}
                  timestamp={convertDateToCasualTime(new Date(msg.date))}
                  is_me={msg.connection_degree === 'You'}
                />
              ))}
            {messages && messages.length === 0 && (
              <Center h={400}>
                <Text fz='sm' fs='italic' c='dimmed'>
                  No conversation history found.
                </Text>
              </Center>
            )}
          </div>
        </ScrollArea>
      </div>
      <div style={{ height: `calc((100vh - ${HEADER_HEIGHT}px)*0.25)` }}>
        <Paper
          shadow='sm'
          withBorder
          radius={theme.radius.lg}
          sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap' }}
          mx={10}
          mb={10}
          h={'calc(100% - 10px)'}
        >
          <div
            style={{
              flexBasis: '20%',
              backgroundColor: theme.colors.dark[6],
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            }}
          >
            <Flex wrap='nowrap' align='center'>
              <Text color='white' fz={14} fw={500} pl={15} pt={5}>
                Message via LinkedIn
              </Text>
              <Text
                pl={10}
                pt={5}
                size='xs'
                fs='italic'
                color='gray.3'
                component='a'
                target='_blank'
                rel='noopener noreferrer'
                href={`https://www.linkedin.com/in/${linkedin_public_id}`}
                /* TODO: Message convo link instead */
              >
                linkedin.com/in/{linkedin_public_id} <IconExternalLink size='0.65rem' />
              </Text>
            </Flex>
          </div>
          <div
            style={{
              flexBasis: '80%',
              position: 'relative',
              paddingLeft: 10,
              paddingRight: 10,
            }}
          >
            <Textarea minRows={3} maxRows={3} placeholder='Your message...' variant='unstyled' />
            <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
              <Button
                leftIcon={<IconWriting size='1rem' />}
                variant='light'
                color='gray'
                radius={theme.radius.lg}
                size='xs'
              >
                Generate Message
              </Button>
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
              <Button leftIcon={<IconSend size='1rem' />} radius={theme.radius.lg} size='xs'>
                Send
              </Button>
            </div>
          </div>
        </Paper>
      </div>
    </Flex>
  );
}
