import {
  Avatar,
  Center,
  Title,
  Flex,
  Stack,
  Text,
  useMantineTheme,
  Paper,
  ScrollArea,
  Select,
  Group,
  createStyles,
  Divider,
  Textarea,
  Tabs,
  Button,
  Box,
  UnstyledButton,
  Card,
  Skeleton,
  ActionIcon,
  Modal,
  rem,
  Accordion,
} from '@mantine/core';
import {
  IconBriefcase,
  IconBuildingStore,
  IconBrandLinkedin,
  IconMap2,
  IconWriting,
  IconCalendarEvent,
  IconTrash,
  IconExternalLink,
  IconPencil,
  IconUserEdit,
} from '@tabler/icons-react';
import { openedProspectIdState, currentConvoChannelState } from '@atoms/inboxAtoms';
import { userTokenState } from '@atoms/userAtoms';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRecoilValue, useRecoilState } from 'recoil';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { getProspectByID } from '@utils/requests/getProspectByID';

import { Channel, DemoFeedback, ProspectDetails, ProspectShallow } from 'src';
import { ProspectDetailsResearchTabs } from '@common/prospectDetails/ProspectDetailsResearch';
import { updateProspectNote } from '@utils/requests/prospectNotes';
import { updateChannelStatus } from '@common/prospectDetails/ProspectDetailsChangeStatus';
import ICPFitPill from '@common/pipeline/ICPFitAndReason';
import { useDisclosure, useHover } from '@mantine/hooks';
import { DatePicker } from '@mantine/dates';
import ProspectDemoDateSelector from '@common/prospectDetails/ProspectDemoDateSelector';
import DemoFeedbackDrawer from '@drawers/DemoFeedbackDrawer';
import { demosDrawerOpenState, demosDrawerProspectIdState } from '@atoms/dashboardAtoms';
import _ from 'lodash';
import { INBOX_PAGE_HEIGHT } from '@pages/InboxPage';
import ProspectDetailsHistory from '@common/prospectDetails/ProspectDetailsHistory';
import EditProspectModal from '@modals/EditProspectModal';
import { proxyURL, valueToColor, nameToInitials } from '@utils/general';
import { IconAlarm, IconEdit, IconHomeHeart, IconSeeding, IconX } from '@tabler/icons';
import { showNotification } from '@mantine/notifications';
import getDemoFeedback from '@utils/requests/getDemoFeedback';
import DemoFeedbackCard from '@common/demo_feedback/DemoFeedbackCard';
import displayNotification from '@utils/notificationFlow';
import { snoozeProspect, snoozeProspectEmail } from '@utils/requests/snoozeProspect';
import EmailStoreView from '@common/prospectDetails/EmailStoreView';
import { prospectEmailStatuses, prospectStatuses } from '@common/inbox/utils';

const useStyles = createStyles((theme) => ({
  icon: {
    color: theme.colors.gray[6],
  },

  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: theme.radius.md,
    height: 40,
    gap: rem(4),
    width: '100%',
    backgroundColor: theme.white,
    border: `solid 1px ${theme.colors.gray[4]}`,
    transition: 'box-shadow 150ms ease, transform 100ms ease',

    '&:hover': {
      boxShadow: `${theme.shadows.md} !important`,
      transform: 'scale(1.05)',
    },
  },
}));

export default function ProjectDetails(props: {
  prospects: ProspectShallow[];
  snoozeProspectEmail?: boolean;
  emailStatuses?: boolean;
  currentEmailStatus?: string;
  refetchSmartleadProspects?: () => void;
}) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const { classes } = useStyles();
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [forcedHistoryRefresh, setForcedHistoryRefresh] = useState(false);

  const [openedSnoozeModal, setOpenedSnoozeModal] = useState(false);

  const { hovered: icpHovered, ref: icpRef } = useHover();

  const userToken = useRecoilValue(userTokenState);
  const [openedProspectId, setOpenedProspectId] = useRecoilState(openedProspectIdState);
  const openedOutboundChannel = useRecoilValue(currentConvoChannelState);

  const [demosDrawerOpened, setDemosDrawerOpened] = useRecoilState(demosDrawerOpenState);
  const [drawerProspectId, setDrawerProspectId] = useRecoilState(demosDrawerProspectIdState);

  const { data, isFetching, refetch } = useQuery({
    queryKey: [`query-get-dashboard-prospect-${openedProspectId}`],
    queryFn: async () => {
      const response = await getProspectByID(userToken, openedProspectId);
      return response.status === 'success' ? (response.data as ProspectDetails) : undefined;
    },
    enabled: openedProspectId !== -1,
  });

  const { data: demoFeedbacks, refetch: refreshDemoFeedback } = useQuery({
    queryKey: [`query-get-prospect-demo-feedback-${openedProspectId}`],
    queryFn: async () => {
      const response = await getDemoFeedback(userToken, openedProspectId);
      return response.status === 'success' ? (response.data as DemoFeedback[]) : null;
    },
    enabled: openedProspectId !== -1,
  });

  let statusValue = data?.details?.linkedin_status || 'ACCEPTED';
  if (props.emailStatuses) {
    statusValue = props.currentEmailStatus || 'ACTIVE_CONVO';
  }

  const [editProspectModalOpened, { open: openProspectModal, close: closeProspectModal }] =
    useDisclosure();

  const linkedin_public_id = data?.li.li_profile?.split('/in/')[1]?.split('/')[0] ?? '';

  // Set the notes in the input box when the data is loaded in
  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.value = data?.details.notes[data?.details.notes.length - 1]?.note ?? '';
    }
  }, [data]);

  const triggerUpdateProspectNote = async () => {
    setNoteLoading(true);

    if (notesRef.current?.value === '') {
      showNotification({
        title: 'Error',
        message: 'Please enter a note',
        color: 'red',
        autoClose: 5000,
      });
      setNoteLoading(false);
      return;
    }

    if (notesRef.current) {
      const result = await updateProspectNote(userToken, openedProspectId, notesRef.current.value);
      if (result.status === 'success') {
        showNotification({
          title: 'Note saved',
          message: 'The note has been added successfully',
          color: 'green',
          autoClose: 5000,
        });
      } else {
        showNotification({
          title: 'Error',
          message: 'There was an error saving the note',
          color: 'red',
          autoClose: 5000,
        });
      }
    }

    setForcedHistoryRefresh(!forcedHistoryRefresh); // Hacky way to force refresh
    setNoteLoading(false);
  };

  // For changing the status of the prospect
  const changeStatus = async (status: string, changeProspect?: boolean) => {
    if (props.emailStatuses) {
      // HARD CODE IN THE EMAIL FOR NOW
      const response = await updateChannelStatus(openedProspectId, userToken, 'EMAIL', status);
      if (response.status !== 'success') {
        showNotification({
          title: 'Error',
          message: 'There was an error changing the status',
          color: 'red',
          autoClose: 5000,
        });
        return;
      } else {
        const formatted_status = status
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, function (c) {
            return c.toUpperCase();
          });
        showNotification({
          title: 'Status changed',
          message: `Prospect's status has been changed to ${formatted_status}`,
          color: 'green',
          autoClose: 5000,
        });
      }
      if (props.refetchSmartleadProspects) {
        props.refetchSmartleadProspects();
      }
    } else {
      await updateChannelStatus(
        openedProspectId,
        userToken,
        openedOutboundChannel.toUpperCase() as Channel,
        status
      );
    }
    // queryClient.invalidateQueries({
    //   queryKey: ['query-dash-get-prospects'],
    // });
    // if (changeProspect || changeProspect === undefined) {
    //   setOpenedProspectId(-1);
    // }

    // Refetch and set to the next prospect
    queryClient.refetchQueries({
      queryKey: ['query-prospects-list'],
    });
    if (changeProspect || changeProspect === undefined) {
      setOpenedProspectId(-2);
    }

    refetch();
  };

  if (!openedProspectId || openedProspectId == -1) {
    return (
      <Flex direction='column' align='left' p='sm' mt='lg' h={`calc(${INBOX_PAGE_HEIGHT} - 100px)`}>
        <Skeleton height={50} circle mb='xl' />
        <Skeleton height={8} radius='xl' />
        <Skeleton height={8} mt={6} radius='xl' />
        <Skeleton height={8} mt={6} width='70%' radius='xl' />
        <Skeleton height={50} mt={6} width='70%' radius='xl' />
      </Flex>
    );
  }
  return (
    <Flex
      gap={0}
      wrap='nowrap'
      direction='column'
      h={'100%'}
      bg={'white'}
      sx={{ borderLeft: '0.0625rem solid #dee2e6' }}
    >
      <Stack spacing={0} mt={'md'} px={'md'}>
        <Flex align={'center'} gap={'sm'}>
          <Avatar
            size='xl'
            src={proxyURL(data?.details.profile_pic)}
            color={valueToColor(theme, data?.details.full_name)}
          >
            {nameToInitials(data?.details.full_name)}
          </Avatar>

          <Box>
            <Flex gap={'sm'}>
              <Box>
                <Title order={4}>{data?.details.full_name}</Title>
              </Box>
              <Divider orientation='vertical' />
              <Flex gap={'xs'} align={'center'}>
                <Text fw={700} fz={'sm'} color='gray.6'>
                  ICP Score:
                </Text>
                <ICPFitPill
                  icp_fit_score={data?.details.icp_fit_score || 0}
                  icp_fit_reason={data?.details.icp_fit_reason || ''}
                  archetype={data?.details.persona || ''}
                />
              </Flex>
            </Flex>

            {data?.details.title && (
              <Group noWrap spacing={10} mt={3}>
                <IconBriefcase stroke={1.5} size={18} className={classes.icon} />
                <Text size='xs'>{data.details.title}</Text>
              </Group>
            )}

            {data?.data.location && (
              <Group noWrap spacing={10} mt={5}>
                <IconHomeHeart stroke={1.5} size={16} className={classes.icon} />
                <Text size='xs' color='dimmed'>
                  {data.data.location}
                </Text>
              </Group>
            )}

            {data?.details.company && (
              <Group noWrap spacing={10} mt={5}>
                <IconBuildingStore stroke={1.5} size={18} className={classes.icon} />
                <Text
                  size='xs'
                  component='a'
                  target='_blank'
                  rel='noopener noreferrer'
                  href={data.company?.url || undefined}
                >
                  {data.details.company} {data.company?.url && <IconExternalLink size='0.55rem' />}
                </Text>
              </Group>
            )}

            {data?.data.company_hq && (
              <Group noWrap spacing={10} mt={5}>
                <IconBuildingStore stroke={1.5} size={16} className={classes.icon} />
                <Text size='xs' color='dimmed'>
                  {data.data.company_hq}
                </Text>
              </Group>
            )}

            {linkedin_public_id && (
              <Group noWrap spacing={10} mt={5}>
                <IconBrandLinkedin stroke={1.5} size={18} className={classes.icon} />
                <Text
                  size='xs'
                  component='a'
                  target='_blank'
                  rel='noopener noreferrer'
                  href={`https://www.linkedin.com/in/${linkedin_public_id}`}
                >
                  linkedin.com/in/{linkedin_public_id} <IconExternalLink size='0.55rem' />
                </Text>
              </Group>
            )}

            {data?.email.email && (
              <EmailStoreView email={data.email.email} emailStore={data.data.email_store} isValid />
              // <Group noWrap spacing={10} mt={5}>
              //   <IconMail stroke={1.5} size={18} className={classes.icon} />
              //   <Text
              //     size="xs"
              //     component="a"
              //     href={`mailto:${data.email.email}`}
              //   >
              //     {data.email.email} <IconExternalLink size="0.55rem" />
              //   </Text>
              // </Group>
            )}

            {data?.details.address && (
              <Group noWrap spacing={10} mt={5}>
                <IconMap2 stroke={1.5} size={18} className={classes.icon} />
                <Text size='xs'>{data.details.address}</Text>
              </Group>
            )}
          </Box>
        </Flex>

        <Divider variant='dashed' my={'sm'} />

        <Button
          radius={'xl'}
          onClick={openProspectModal}
          variant='light'
          leftIcon={<IconUserEdit size={'1rem'} />}
        >
          Edit Contact Details
        </Button>

        <EditProspectModal
          modalOpened={editProspectModalOpened}
          openModal={openProspectModal}
          closeModal={closeProspectModal}
          backFunction={refetch}
          prospectID={openedProspectId}
        />
      </Stack>
      <Divider mt={'sm'} />
      <ScrollArea h='60vh'>
        {!statusValue.startsWith('DEMO_') &&
          statusValue !== 'ACCEPTED' &&
          statusValue !== 'RESPONDED' && (
            <>
              <Box style={{ flexBasis: '10%' }} my={10}>
                <Flex gap={'md'} align={'center'} px={'md'}>
                  <div>
                    <Text fw={700} fz={'sm'}>
                      Reply Label
                    </Text>
                  </div>
                  <Select
                    size='xs'
                    styles={{
                      root: { flex: 1 },
                      input: {
                        backgroundColor: theme.colors['blue'][0],
                        borderColor: theme.colors['blue'][4],
                        color: theme.colors.blue[6],
                        fontWeight: 700,
                        '&:focus': {
                          borderColor: theme.colors['blue'][4],
                        },
                      },
                      rightSection: {
                        svg: {
                          color: `${theme.colors.gray[6]}!important`,
                        },
                      },
                      item: {
                        '&[data-selected], &[data-selected]:hover': {
                          backgroundColor: theme.colors['blue'][6],
                        },
                      },
                    }}
                    data={props.emailStatuses ? prospectEmailStatuses : prospectStatuses}
                    value={statusValue}
                    onChange={async (value) => {
                      if (!value) {
                        return;
                      }
                      await changeStatus(value);
                    }}
                  />
                </Flex>
              </Box>

              <Divider />
            </>
          )}

        <div>
          <Box style={{ flexBasis: '15%' }} p={10} px={'md'}>
            <Accordion
              defaultValue='customization'
              styles={(theme) => ({
                content: {
                  padding: 0,
                  '&[data-active]': {
                    backgroundColor: 'transparent',
                  },
                },
                chevron: {
                  margin: 0,
                },
                label: {
                  fontSize: theme.fontSizes.sm,

                  padding: 0,
                },
                item: {
                  border: '0px',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                },
                panel: {
                  paddingTop: '8px',
                },
                control: {
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  padding: `0 !important`,
                  backgroundColor: 'transparent',
                  paddingLeft: theme.spacing.sm,
                  paddingRight: theme.spacing.sm,
                },
              })}
            >
              <Accordion.Item value='customization'>
                <Accordion.Control>
                  <Flex gap={5} align='end' wrap='nowrap'>
                    <Text fw={700} fz={'sm'}>
                      Lead Status:
                    </Text>
                  </Flex>
                </Accordion.Control>
                <Accordion.Panel>
                  {!statusValue.startsWith('DEMO_') ? (
                    <Flex direction={'column'} gap={'sm'}>
                      <StatusBlockButton
                        title='Snooze'
                        icon={<IconAlarm color={theme.colors.yellow[6]} size={24} />}
                        onClick={async () => {
                          setOpenedSnoozeModal(true);
                        }}
                      />
                      <StatusBlockButton
                        title='Demo Set'
                        icon={<IconCalendarEvent color={theme.colors.green[6]} size={24} />}
                        onClick={async () => {
                          await changeStatus('DEMO_SET', false);
                        }}
                      />
                      <StatusBlockButton
                        title='Not Interested'
                        icon={<IconX color={theme.colors.red[6]} size={24} />}
                        onClick={async () => {
                          await changeStatus('NOT_INTERESTED');
                        }}
                      />
                      <StatusBlockButton
                        title='Not Qualified'
                        icon={<IconTrash color={theme.colors.red[6]} size={24} />}
                        onClick={async () => {
                          await changeStatus('NOT_QUALIFIED');
                        }}
                      />
                    </Flex>
                  ) : (
                    <Stack spacing={10}>
                      <Box>
                        {(!demoFeedbacks || demoFeedbacks.length === 0) && (
                          <Box mb={10} mt={10}>
                            <ProspectDemoDateSelector prospectId={openedProspectId} />
                          </Box>
                        )}
                        {data && demoFeedbacks && demoFeedbacks.length > 0 && (
                          <ScrollArea h='250px'>
                            {demoFeedbacks?.map((feedback, index) => (
                              <div style={{ marginBottom: 10 }}>
                                <DemoFeedbackCard
                                  prospect={data.data}
                                  index={index + 1}
                                  demoFeedback={feedback}
                                  refreshDemoFeedback={refreshDemoFeedback}
                                />
                              </div>
                            ))}
                          </ScrollArea>
                        )}
                        <Button
                          variant='light'
                          radius='md'
                          fullWidth
                          onClick={() => {
                            setDrawerProspectId(openedProspectId);
                            setDemosDrawerOpened(true);
                          }}
                        >
                          {demoFeedbacks && demoFeedbacks.length > 0 ? 'Add' : 'Give'} Demo Feedback
                        </Button>
                        <DemoFeedbackDrawer refetch={refetch} />
                      </Box>
                    </Stack>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Box>

          <div style={{ flexBasis: '55%' }}>
            <Divider />
            <Tabs variant='pills' defaultValue='history' radius={theme.radius.lg} m={10}>
              <Tabs.List>
                <Tabs.Tab value='history' icon={<IconWriting size='0.8rem' />}>
                  AI History
                </Tabs.Tab>
                {/* <Tabs.Tab value="notes" icon={<IconWriting size="0.8rem" />}>
                  Notes
                </Tabs.Tab> */}
              </Tabs.List>

              <Tabs.Panel value='research' pt='xs' h={`calc(${INBOX_PAGE_HEIGHT} - 400px)`}>
                <ScrollArea h={'100%'}>
                  {openedProspectId !== -1 && (
                    <ProspectDetailsResearchTabs prospectId={openedProspectId} />
                  )}
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value='history' pt='xs' h={`calc(${INBOX_PAGE_HEIGHT} - 400px)`}>
                <ScrollArea h={'100%'}>
                  <Card withBorder pb='100px'>
                    {openedProspectId !== -1 && (
                      <ProspectDetailsHistory
                        prospectId={openedProspectId}
                        forceRefresh={forcedHistoryRefresh}
                      />
                    )}
                  </Card>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value='notes' pt='xs' h={`calc(${INBOX_PAGE_HEIGHT} - 400px)`}>
                <Textarea
                  ref={notesRef}
                  autosize
                  minRows={5}
                  radius={theme.radius.sm}
                  placeholder='Write notes here...'
                  onChange={(e) => {
                    notesRef.current!.value = e.target.value;
                  }}
                />
                <Flex mt='md'>
                  <Button size='xs' onClick={triggerUpdateProspectNote} loading={noteLoading}>
                    Save Note
                  </Button>
                </Flex>
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
      <Modal
        opened={openedSnoozeModal}
        onClose={() => setOpenedSnoozeModal(false)}
        title='Snooze Prospect'
      >
        <Center>
          <DatePicker
            minDate={new Date()}
            onChange={async (date) => {
              if (!date) {
                return;
              }
              let timeDiff = date.getTime() - new Date().getTime();
              let daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

              if (props.snoozeProspectEmail) {
                await displayNotification(
                  'snooze-prospect-email',
                  async () => {
                    let result = await snoozeProspectEmail(userToken, openedProspectId, daysDiff);
                    return result;
                  },
                  {
                    title: `Snoozing prospect for ${daysDiff} days...`,
                    message: `Working with servers...`,
                    color: 'teal',
                  },
                  {
                    title: `Snoozed!`,
                    message: `Your prospect has been snoozed from outreach for ${daysDiff} days.`,
                    color: 'green',
                  },
                  {
                    title: `Error while snoozing your prospect.`,
                    message: `Please try again later.`,
                    color: 'red',
                  }
                );
                setOpenedSnoozeModal(false);
                setOpenedProspectId(-1);
                if (props.refetchSmartleadProspects) {
                  props.refetchSmartleadProspects();
                }
                return;
              }

              await displayNotification(
                'snooze-prospect',
                async () => {
                  let result = await snoozeProspect(userToken, openedProspectId, daysDiff);
                  return result;
                },
                {
                  title: `Snoozing prospect for ${daysDiff} days...`,
                  message: `Working with servers...`,
                  color: 'teal',
                },
                {
                  title: `Snoozed!`,
                  message: `Your prospect has been snoozed from outreach for ${daysDiff} days.`,
                  color: 'teal',
                },
                {
                  title: `Error while snoozing your prospect.`,
                  message: `Please try again later.`,
                  color: 'red',
                }
              );
              setOpenedSnoozeModal(false);
              setOpenedProspectId(-1);
              queryClient.refetchQueries({
                queryKey: [`query-dash-get-prospects`],
              });
              queryClient.refetchQueries({
                queryKey: [`query-get-dashboard-prospect-${openedProspectId}`],
              });
              // location.reload();
            }}
          />
        </Center>
      </Modal>
    </Flex>
  );
}

function StatusBlockButton(props: { title: string; icon: ReactNode; onClick: () => void }) {
  const { classes, theme } = useStyles();

  return (
    <UnstyledButton
      className={classes.item}
      onClick={async () => {
        props.onClick();
      }}
    >
      {props.icon}
      <Text size='sm' mt={3} fw={600}>
        {props.title}
      </Text>
    </UnstyledButton>
  );
}
