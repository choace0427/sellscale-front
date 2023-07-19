import { prospectDrawerIdState, prospectDrawerOpenState } from '@atoms/prospectAtoms';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import ProspectSelect from '@common/library/ProspectSelect';
import loaderWithText from '@common/library/loaderWithText';
import { LinkedInConversationEntry } from '@common/persona/LinkedInConversationEntry';
import ProspectDetailsDrawer from '@drawers/ProspectDetailsDrawer';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Center,
  CloseButton,
  DEFAULT_THEME,
  Divider,
  Flex,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { Icon24Hours, IconExternalLink, IconRefresh, IconReload, IconRobot, IconSend } from '@tabler/icons';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { convertDateToLocalTime, formatToLabel, testDelay, valueToColor } from '@utils/general';
import {
  createLiConvoSim,
  generateInitialMessageForLiConvoSim,
  generateResponseForLiConvoSim,
  getLiConvoSim,
  sendMessageForLiConvoSim,
  updateLiConvoSim,
} from '@utils/requests/linkedinConvoSimulation';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ProspectShallow, Simulation } from 'src';

type LiSimMsg = {
  author: string;
  connection_degree: 'You' | '1st';
  li_id?: number;
  message: string;
  date?: string;
  meta_data?: Record<string, any>;
};

export default function LinkedInConvoSimulator(props: { personaId: number }) {
  const theme = useMantineTheme();
  const viewport = useRef<HTMLDivElement>(null);

  const [prospectDrawerOpened, setProspectDrawerOpened] = useRecoilState(prospectDrawerOpenState);
  const [prospectDrawerId, setProspectDrawerId] = useRecoilState(prospectDrawerIdState);

  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);
  const [prospect, setProspect] = useState<ProspectShallow>();

  const [simulation, setSimulation] = useState<Simulation>();
  const [messages, setMessages] = useState<LiSimMsg[]>([]);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [messageDraft, setMessageDraft] = useState('');

  const scrollToBottom = () => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startupSimulation = async () => {
    if (!prospect) return;

    setLoading(true);
    setLoadingMsg('Spinning up simulation...');
    const createResponse = await createLiConvoSim(userToken, props.personaId, prospect.id);
    if (createResponse.status !== 'success') {
      return;
    }
    const sim_id = createResponse.data;

    setLoadingMsg('Generating initial message...');
    const initMsgResponse = await generateInitialMessageForLiConvoSim(userToken, sim_id);
    if (initMsgResponse.status !== 'success') {
      return;
    }

    setLoadingMsg('Updating state...');
    await refreshSimulation(sim_id);

    setLoadingMsg('Fetching messages...');
    const convoResponse = await getLiConvoSim(userToken, sim_id);
    if (convoResponse.status !== 'success') {
      return;
    }

    setLoading(false);
    setLoadingMsg('');
    setSimulation(convoResponse.data.simulation);
    setMessages(convoResponse.data.messages.reverse());
  };

  const refreshSimulation = async (simulation_id?: number) => {
    const sim_id = simulation ? simulation.id : simulation_id;
    if (!sim_id) return false;

    const updateResponse = await updateLiConvoSim(userToken, sim_id);
    return updateResponse.status === 'success';
  };

  const resetSimulation = async () => {

    const oldProspect = _.cloneDeep(prospect);
    clearSimulation();
    setProspect(oldProspect);
    startupSimulation();
  };

  const clearSimulation = () => {
    setProspect(undefined);
    setSimulation(undefined);
    setMessages([]);
    setMessageDraft('');
    setLoading(false);
    setAiLoading(false);
    setLoadingMsg('');
  };

  const sendMessage = async () => {
    if (messageDraft.trim() === '' || !simulation) return;

    setLoading(true);
    setLoadingMsg('Sending message...');
    const sendResponse = await sendMessageForLiConvoSim(userToken, simulation.id, messageDraft);
    setMessageDraft('');
    if (sendResponse.status !== 'success') {
      return;
    }

    setLoadingMsg('Updating state...');
    await refreshSimulation();

    setLoadingMsg('Fetching messages...');
    const convoResponse = await getLiConvoSim(userToken, simulation.id);
    if (convoResponse.status !== 'success') {
      return;
    }

    // Add a fake delay to slow things down a bit for loader
    await testDelay(300);

    setLoading(false);
    setLoadingMsg('');
    setSimulation(convoResponse.data.simulation);
    setMessages(convoResponse.data.messages.reverse());

    // A hacky way to check if we're currently in the middle of a msg generation
    if (loadingMsg === '') {
      wait2Day(true);
    }
  };

  const wait2Day = async (invisible = false) => {
    if (!simulation) return;

    if (!invisible) {
      setLoading(true);
    }
    if (invisible) {
      setAiLoading(true);
      scrollToBottom();
    }
    setLoadingMsg('Generating response...');
    const generateResponse = await generateResponseForLiConvoSim(userToken, simulation.id);
    if (generateResponse.status !== 'success') {
      return;
    }

    setLoadingMsg('Updating state...');
    await refreshSimulation();

    setLoadingMsg('Fetching messages...');
    const convoResponse = await getLiConvoSim(userToken, simulation.id);
    if (convoResponse.status !== 'success') {
      return;
    }

    setLoading(false);
    setAiLoading(false);
    setLoadingMsg('');
    setSimulation(convoResponse.data.simulation);
    setMessages(convoResponse.data.messages.reverse());
  };


  let convoHeight = (messages.length || 1) * 150 + 150;
  if (convoHeight > 800) { convoHeight = 800; }

  if (!prospect) {
    return (
      <>
        <Paper withBorder p='lg' radius='md' shadow='md'>
          <Group position='apart' mb='xs'>
            <Text fz='xl' fw={500}>
              LinkedIn Conversation Simulator
            </Text>
          </Group>
          <Text c='dimmed' fz='sm'>
            This is a simulation of a potential conversation between you ({userData.sdr_name}) and a prospect.
          </Text>
          <Text c='dimmed' fz='sm'>
            Select a prospect to start the simulation.
          </Text>
          <ProspectSelect
            personaId={props.personaId}
            onChange={(prospect) => {
              setProspect(prospect);
            }}
          />
        </Paper>
      </>
    );
  }

  return (
    <>
      {prospectDrawerOpened && <ProspectDetailsDrawer />}
      <Paper withBorder p='lg' radius='md' shadow='md'>
        <Group position='apart' mb='xs'>
          <Text fz='xl' fw={500}>
            LinkedIn Conversation Simulator
          </Text>
        </Group>
        <Text c='dimmed' fz='sm'>
          This is a simulation of a potential conversation between you ({userData.sdr_name}) and {prospect.full_name}{' '}
          from {prospect.full_name}'s perspective.
        </Text>
        <Text c='dimmed' fz='sm'>
          Send messages as if you were {prospect.full_name} and see how the AI responds on your behalf.
        </Text>
        <Group position='right' mt='md'>
          <Button
            variant='outline'
            size='xs'
            rightIcon={<IconExternalLink size='0.9rem' />}
            onClick={() => {
              setProspectDrawerId(prospect.id);
              setProspectDrawerOpened(true);
            }}
          >
            {prospect.full_name}
          </Button>
          <Button
            variant='default'
            size='xs'
            onClick={() => {
              clearSimulation();
            }}
          >
            Change Prospect
          </Button>
        </Group>
      </Paper>

      {simulation && (
        <Box
          mt='md'
          sx={(theme) => ({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[4],
            textAlign: 'center',
            padding: theme.spacing.xl,
            borderRadius: theme.radius.md,
          })}
        >
          <Group position='apart'>
            <Group>
              <Group>
                <Text c='gray.0' fw={700}>
                  Overall Status:{' '}
                </Text>
                <Badge
                  color={valueToColor(theme, formatToLabel(simulation.meta_data?.overall_status))}
                  variant='filled'
                >
                  {`${formatToLabel(simulation.meta_data?.overall_status)}`}
                </Badge>
                <Divider orientation='vertical' c='gray.0' />
              </Group>
              <Group>
                <Text c='gray.0' fw={700}>
                  LinkedIn Status:{' '}
                </Text>
                <Badge color={valueToColor(theme, formatToLabel(simulation.meta_data?.li_status))} variant='filled'>
                  {`${formatToLabel(simulation.meta_data?.li_status)}`}
                </Badge>
                <Divider orientation='vertical' c='gray.0' />
              </Group>
              <Group>
                <Text c='gray.0' fw={700}>
                  Bump Count: {simulation.meta_data?.bump_count}
                </Text>
              </Group>
            </Group>
            <div>
              <Tooltip label='Reset Simulation' withArrow>
                <ActionIcon
                  color='gray.0'
                  variant='transparent'
                  onClick={() => {
                    resetSimulation();
                  }}
                >
                  <IconReload size='1.3rem' />
                </ActionIcon>
              </Tooltip>
            </div>
          </Group>
        </Box>
      )}

      <ScrollArea viewportRef={viewport} my={5} h={convoHeight}>
        <LoadingOverlay loader={loaderWithText(loadingMsg)} visible={loading} />

        {messages.length === 0 && (
          <Center h={convoHeight - 100}>
            <Button
              radius='xl'
              size='md'
              onClick={() => {
                startupSimulation();
              }}
              rightIcon={<IconPlayerPlayFilled size='1.2rem' />}
            >
              Start Simulation
            </Button>
          </Center>
        )}

        {messages.length > 0 &&
          messages.map((message, index) => {
            let metadata = {
              bump_framework_id: undefined as number | undefined,
              bump_framework_title: undefined as string | undefined,
              bump_framework_description: undefined as string | undefined,
              bump_framework_length: undefined as string | undefined,
              account_research_points: undefined as string[] | undefined,
              cta: undefined as string | undefined,
            };
            if (message.meta_data && message.meta_data.bump_framework_id) {
              metadata.bump_framework_id = message.meta_data.bump_framework_id;
              metadata.bump_framework_title = message.meta_data.bump_framework_title;
              metadata.bump_framework_description = message.meta_data.bump_framework_description;
              metadata.bump_framework_length = message.meta_data.bump_framework_length;
              metadata.account_research_points = message.meta_data.account_research_points;
              metadata.cta = message.meta_data.cta;
            } else if (message.meta_data && message.meta_data.cta) {
              metadata.bump_framework_id = undefined;
              metadata.bump_framework_title = undefined;
              metadata.bump_framework_description = undefined;
              metadata.bump_framework_length = undefined;
              metadata.account_research_points = undefined;
              metadata.cta = message.meta_data.cta;
            }
            return (
              <div
                key={index}
                style={{
                  maxWidth: 550,
                  marginLeft: message.connection_degree !== 'You' ? 'auto' : undefined,
                  marginRight: message.connection_degree === 'You' ? 'auto' : undefined,
                }}
              >{
                  index == 1 && message.connection_degree === 'You' && (
                    <Divider my={2} label="Sent after prospect accepts invite" labelPosition="center" mt='sm' mb='sm' />
                  )
                }
                <LinkedInConversationEntry
                  postedAt={convertDateToLocalTime(new Date(message.date?.slice(0, -3).trim() || 0))}
                  body={message.message}
                  name={message.author}
                  image={message.connection_degree === 'You' ? userData.img_url : prospect.img_url}
                  aiGenerated={message.connection_degree === 'You'}
                  bumpFrameworkId={metadata.bump_framework_id}
                  bumpFrameworkTitle={metadata.bump_framework_title}
                  bumpFrameworkDescription={metadata.bump_framework_description}
                  bumpFrameworkLength={metadata.bump_framework_length}
                  accountResearchPoints={metadata.account_research_points}
                  cta={metadata.cta}
                  badgeBFTitle
                />
                
              </div>
            )
          })}
        {
          aiLoading && (
            <Card radius="md" shadow="md" style={{ maxWidth: 550, marginRight: 'auto' }} withBorder>
              <Loader variant="dots" />
            </Card>
          )
        }
      </ScrollArea>

      {simulation && (
        <Group sx={{ maxWidth: 550, marginLeft: 'auto' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Textarea
              minRows={2}
              autosize
              disabled={loading}
              placeholder={`Write a message as ${prospect.full_name}...`}
              onChange={(e) => {
                setMessageDraft(e.target?.value);
              }}
              value={messageDraft}
              onKeyDown={getHotkeyHandler([
                [
                  'mod+Enter',
                  () => {
                    sendMessage();
                  },
                ],
              ])}
            />
          </div>
          <Stack spacing={5}>
            <Button
              variant='light'
              radius='xl'
              size='xs'
              color='blue'
              disabled={loading}
              rightIcon={<IconSend size={14} />}
              onClick={() => {
                sendMessage();
              }}
            >
              Send
            </Button>
            <Button
              variant='light'
              radius='xl'
              size='xs'
              color='violet'
              disabled={loading}
              rightIcon={<Icon24Hours size={14} />}
              onClick={() => {
                wait2Day(true);
              }}
            >
              Wait until next bump
            </Button>
          </Stack>
        </Group>
      )}
    </>
  );
}
