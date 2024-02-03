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
  Collapse,
  DEFAULT_THEME,
  Divider,
  Flex,
  Group,
  HoverCard,
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
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks';
import {
  Icon24Hours,
  IconExternalLink,
  IconRefresh,
  IconReload,
  IconRobot,
  IconSend,
  IconWand,
} from '@tabler/icons';
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

export default function LinkedInConvoSimulator(props: {
  personaId: number;
  sequenceSetUpMode?: boolean;
}) {
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

  const [opened, { toggle }] = useDisclosure(false);

  const scrollToBottom = () =>
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startupSimulation = async () => {
    if (!prospect || prospect.id === -1) return;

    setLoading(true);
    setLoadingMsg('Spinning up simulation...');
    const createResponse = await createLiConvoSim(userToken, props.personaId, prospect.id);
    if (createResponse.status !== 'success') {
      setLoading(false);
      setLoadingMsg('');
      return;
    }
    const sim_id = createResponse.data;

    setLoadingMsg('Generating initial message...');
    const initMsgResponse = await generateInitialMessageForLiConvoSim(userToken, sim_id);
    if (initMsgResponse.status !== 'success') {
      setLoading(false);
      setLoadingMsg('');
      return;
    }

    setLoadingMsg('Updating state...');
    await refreshSimulation(sim_id);

    setLoadingMsg('Fetching messages...');
    const convoResponse = await getLiConvoSim(userToken, sim_id);
    if (convoResponse.status !== 'success') {
      setLoading(false);
      setLoadingMsg('');
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
    // if (generateResponse.status !== 'success') {
    //   return;
    // }

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

  if (!prospect) {
    return (
      <>
        <Paper withBorder p='lg' radius='md' shadow='md'>
          <Group position='apart' mb='xs'>
            <Text fz='xl' fw={500}>
              Select Prospect
            </Text>
          </Group>
          {!props.sequenceSetUpMode && (
            <>
              <Text c='dimmed' fz='xs'>
                This is a simulation of a potential conversation between you ({userData.sdr_name})
                and a prospect.
              </Text>
              <Text c='dimmed' fz='xs'>
                Select a prospect to start the simulation.
              </Text>
            </>
          )}
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
      <Paper withBorder p='lg' radius='md' shadow='md' mb='lg'>
        <Group position='apart' mb='xs'>
          <Text fz='xl' fw={500}>
            Select Prospect
          </Text>
        </Group>
        {!props.sequenceSetUpMode && (
          <>
            <Text c='dimmed' fz='xs'>
              This is a simulation of a potential conversation between you ({userData.sdr_name}) and{' '}
              {prospect.full_name} from {prospect.full_name}'s perspective.
            </Text>
            <br />
            <Text c='dimmed' fz='xs'>
              Send messages as if you were {prospect.full_name} and see how the AI responds on your
              behalf.
            </Text>
          </>
        )}

        <Group position='left' mt='md'>
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

      <ScrollArea viewportRef={viewport} my={5} h={'auto'}>
        <LoadingOverlay loader={loaderWithText(loadingMsg)} visible={loading} />

        {messages.length === 0 && (
          <Center h='400px'>
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
              notes: undefined as string[] | undefined,
              cta: undefined as string | undefined,
            };
            if (message.meta_data && message.meta_data.bump_framework_id) {
              metadata.bump_framework_id = message.meta_data.bump_framework_id;
              metadata.bump_framework_title = message.meta_data.bump_framework_title;
              metadata.bump_framework_description = message.meta_data.bump_framework_description;
              metadata.bump_framework_length = message.meta_data.bump_framework_length;
              metadata.account_research_points = message.meta_data.account_research_points;
              metadata.cta = message.meta_data.cta;
              metadata.notes = message.meta_data.notes;
            } else if (message.meta_data && message.meta_data.cta) {
              metadata.bump_framework_id = undefined;
              metadata.bump_framework_title = undefined;
              metadata.bump_framework_description = undefined;
              metadata.bump_framework_length = undefined;
              metadata.account_research_points = undefined;
              metadata.cta = message.meta_data.cta;
              metadata.notes = message.meta_data.notes;
            }
            return (
              <div
                key={index}
                style={{
                  maxWidth: 550,
                  marginLeft: message.connection_degree !== 'You' ? 'auto' : undefined,
                  marginRight: message.connection_degree === 'You' ? 'auto' : undefined,
                }}
              >
                {index == 1 && message.connection_degree === 'You' && (
                  <Divider
                    my={2}
                    label='Sent after prospect accepts invite'
                    labelPosition='center'
                    mt='sm'
                    mb='sm'
                  />
                )}
                <LinkedInConversationEntry
                  postedAt={convertDateToLocalTime(
                    new Date(message.date?.slice(0, -3).trim() || 0)
                  )}
                  body={message.message}
                  name={message.author}
                  image={message.connection_degree === 'You' ? userData.img_url : prospect.img_url}
                  aiGenerated={message.connection_degree === 'You'}
                  bumpFrameworkId={metadata.bump_framework_id}
                  bumpFrameworkTitle={metadata.bump_framework_title}
                  bumpFrameworkDescription={metadata.bump_framework_description}
                  bumpFrameworkLength={metadata.bump_framework_length}
                  accountResearchPoints={metadata.account_research_points}
                  initialMessageResearchPoints={metadata.notes}
                  cta={metadata.cta}
                  badgeBFTitle
                />
              </div>
            );
          })}
        {aiLoading && (
          <Card radius='md' shadow='md' style={{ maxWidth: 550, marginRight: 'auto' }} withBorder>
            <Loader variant='dots' />
          </Card>
        )}
      </ScrollArea>

      {simulation && (
        <Group w='100%'>
          {!props.sequenceSetUpMode && (
            <Textarea
              w='100%'
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
          )}
          <Flex w='100%'>
            <Button
              variant='light'
              radius='xl'
              size='xs'
              mr='xs'
              w='100%'
              color='violet'
              disabled={loading}
              rightIcon={<Icon24Hours size={14} />}
              onClick={() => {
                wait2Day(true);
              }}
            >
              Wait until next bump
            </Button>

            {!props.sequenceSetUpMode && (
              <Button
                variant='light'
                radius='xl'
                w='100%'
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
            )}
          </Flex>
        </Group>
      )}

      {simulation && (
        <Box maw={400} mx='auto'>
          <Group position='center' mb={5}>
            <Button variant='subtle' color='gray' mt='lg' size='xs' onClick={toggle}>
              Advanced
            </Button>
          </Group>

          <Collapse in={opened}>
            <Box
              mt='md'
              sx={(theme) => ({
                backgroundColor:
                  theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[4],
                textAlign: 'center',
                padding: theme.spacing.xl,
                borderRadius: theme.radius.md,
              })}
            >
              <Group position='apart'>
                <HoverCard>
                  <HoverCard.Target>
                    <Flex align='center' gap='xs'>
                      <Badge
                        color='blue'
                        variant='filled'
                        size='xs'
                        p='xs'
                        sx={{ cursor: 'pointer' }}
                      >
                        <Text fw={700} size='xs' color='white'>
                          Simulation State
                        </Text>
                      </Badge>
                    </Flex>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <Group>
                      <Text fw={700} size='xs'>
                        Overall Status:{' '}
                      </Text>
                      <Badge
                        color={valueToColor(
                          theme,
                          formatToLabel(simulation.meta_data?.overall_status)
                        )}
                        variant='filled'
                      >
                        {`${formatToLabel(simulation.meta_data?.overall_status)}`}
                      </Badge>
                      <Divider orientation='vertical' c='gray.0' />
                    </Group>
                    <br />
                    <Group>
                      <Text fw={700} size='xs'>
                        LinkedIn Status:{' '}
                      </Text>
                      <Badge
                        color={valueToColor(theme, formatToLabel(simulation.meta_data?.li_status))}
                        variant='filled'
                      >
                        {`${formatToLabel(simulation.meta_data?.li_status)}`}
                      </Badge>
                      <Divider orientation='vertical' c='gray.0' />
                    </Group>
                    <br />
                    <Group>
                      <Text fw={700} size='xs'>
                        Bump Count: {simulation.meta_data?.bump_count}
                      </Text>
                    </Group>
                  </HoverCard.Dropdown>
                </HoverCard>

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
          </Collapse>
        </Box>
      )}
    </>
  );
}
