import { userTokenState } from '@atoms/userAtoms';
import PersonaSelect from '@common/persona/PersonaSplitSelect';
import {
  Flex,
  Title,
  Text,
  Card,
  LoadingOverlay,
  useMantineTheme,
  Button,
  Grid,
  Tabs,
  Divider,
  ActionIcon,
  Tooltip,
  Switch,
  Loader,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { openContextModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import CreateBumpFrameworkModal from '@modals/CreateBumpFrameworkModal';
import CloneBumpFrameworkModal from '@modals/CloneBumpFrameworkModal';
import { IconBook, IconCheck, IconEdit, IconFolders, IconList, IconPlus, IconTransferIn, IconX } from '@tabler/icons';
import { useQuery } from '@tanstack/react-query';
import { formatToLabel, valueToColor } from '@utils/general';
import { getBumpFrameworks } from '@utils/requests/getBumpFrameworks';
import getChannels from '@utils/requests/getChannels';
import getPersonas from '@utils/requests/getPersonas';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { BumpFramework, MsgResponse } from 'src';
import { set } from 'lodash';
import { currentProjectState } from '@atoms/personaAtoms';


type BumpFrameworkBuckets = {
  ACCEPTED: {
    total: number;
    frameworks: BumpFramework[];
  };
  BUMPED: Record<
    string,
    {
      total: number;
      frameworks: BumpFramework[];
    }
  >;
  ACTIVE_CONVO: {
    total: number;
    frameworks: BumpFramework[];
  };
};

function BumpBucketView(props: {
  bumpBucket: {
    total: number;
    frameworks: BumpFramework[];
  };
  bucketViewTitle: string;
  bucketViewDescription: string;
  status: string;
  dataChannels: MsgResponse | undefined;
  archetypeID: number | null;
  afterCreate: () => void;
  afterClone: () => void;
  afterEdit: () => void;
  bumpedCount?: number;
}) {
  const theme = useMantineTheme();

  const [createBFModalOpened, { open, close }] = useDisclosure();
  const [cloneBFModalOpened, { open: openClone, close: closeClone }] = useDisclosure();
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <Card shadow='sm' padding='sm' withBorder w='100%'>
        {/* Header */}
        <Flex justify='space-between' align='center'>
          <Flex align='center'>
            <Title order={5}>{props.bucketViewTitle}</Title>
            <Text ml='sm' size='xs'>
              {props.bucketViewDescription}
            </Text>
          </Flex>
          <Flex>
            <Tooltip label='Clone an existing Bump Framework' withinPortal>
              <ActionIcon onClick={openClone}>
                <IconFolders size='1.25rem' />
              </ActionIcon>
            </Tooltip>
            <Tooltip label='Create a new Bump Framework' withinPortal>
              <ActionIcon onClick={open}>
                <IconPlus size='1.25rem' />
              </ActionIcon>
            </Tooltip>
          </Flex>
          <CreateBumpFrameworkModal
            modalOpened={createBFModalOpened}
            openModal={open}
            closeModal={close}
            backFunction={props.afterCreate}
            dataChannels={props.dataChannels}
            status={props.status}
            archetypeID={props.archetypeID}
            bumpedCount={props.bumpedCount}
          />
          <CloneBumpFrameworkModal
            modalOpened={cloneBFModalOpened}
            openModal={openClone}
            closeModal={closeClone}
            backFunction={props.afterClone}
            archetypeID={props.archetypeID as number}
            status={props.status}
            bumpedCount={props.bumpedCount}
          />
        </Flex>
        <Card.Section>
          <Divider mt='sm' />
        </Card.Section>

        {/* Bump Frameworks */}
        <Card.Section px='xs'>
          {props.bumpBucket && props.bumpBucket.total === 0 ? (
            // No Bump Frameworks
            <Flex justify='center' align='center'>
              <Text my='md'>Please create a Bump Framework using the + button above.</Text>
            </Flex>
          ) : (
            <>
              {props.bumpBucket.frameworks.map((framework, index) => {
                // Show only the first Bump Framework of not showing all
                if (index > 0 && !showAll) {
                  return <></>;
                }

                return (
                  <>
                    <Flex justify='space-between' align='center' pt='xs'>
                      <Flex direction='row' align='center'>
                        <Switch
                          ml='md'
                          onLabel='Default'
                          offLabel='Default'
                          checked={framework.default === true}
                          thumbIcon={
                            framework.default === true ? (
                              <IconCheck size='0.8rem' color={theme.colors.teal[theme.fn.primaryShade()]} stroke={3} />
                            ) : (
                              <IconX size='0.8rem' color={theme.colors.red[theme.fn.primaryShade()]} stroke={3} />
                            )
                          }
                          disabled={true}
                          styles={{
                            label: {
                              backgroundColor: framework.default === true
                                ? theme.colors.teal[theme.fn.primaryShade()]
                                : theme.colors.red[theme.fn.primaryShade()],
                            },
                          }}
                        />
                        <Flex direction='column' ml='xl'>
                          <Text fw='bold' fz='lg'>
                            {framework.title}
                          </Text>
                          <Text maw='50rem'>{framework.description}</Text>
                        </Flex>
                      </Flex>
                      <Tooltip label='Edit Bump Framework' withinPortal>
                        <ActionIcon
                          onClick={() => {
                            openContextModal({
                              modal: 'editBumpFramework',
                              title: <Title order={3}>Edit: {framework.title}</Title>,
                              innerProps: {
                                bumpFrameworkID: framework.id,
                                overallStatus: framework.overall_status,
                                title: framework.title,
                                description: framework.description,
                                bumpLength: framework.bump_length,
                                default: framework.default,
                                onSave: props.afterEdit,
                                bumpedCount: framework.bumped_count,
                                bumpDelayDays: framework.bump_delay_days,
                              },
                            });
                          }}
                        >
                          <IconEdit size='1.25rem' />
                        </ActionIcon>
                      </Tooltip>
                    </Flex>
                    <Card.Section>
                      <Flex align={'center'} justify={'center'} w='100%'>
                        <Tooltip
                          label={`Prospect will be snoozed for ${framework.bump_delay_days} days after bump is sent`}
                          withinPortal
                        >
                          <Badge
                            mt='12px'
                            size='md'
                            color={valueToColor(theme, formatToLabel(framework.bump_delay_days + ''))}
                            variant='filled'
                          >
                            {framework.bump_delay_days} day snooze
                          </Badge>
                        </Tooltip>
                      </Flex>
                    </Card.Section>
                    <Card.Section>
                      <Divider mt='sm' />
                    </Card.Section>
                  </>
                );
              })}
              {props.bumpBucket.frameworks.length > 1 && (
                <Card.Section>
                  <Flex justify='center'>
                    <Button
                      variant='subtle'
                      styles={{
                        root: {
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        },
                      }}
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Hide' : `Show all ${props.bumpBucket.total} frameworks...`}
                    </Button>
                  </Flex>
                </Card.Section>
              )}
            </>
          )}
        </Card.Section>
      </Card>
    </>
  );
}

function QuestionObjectionLibraryCard(props: {
  archetypeID: number | null;
  bumpFramework: BumpFramework;
  afterEdit: () => void;
}) {
  const theme = useMantineTheme();

  const splitted_substatus = props.bumpFramework?.substatus?.replace('ACTIVE_CONVO_', '');

  return (
    <>
      <Card withBorder p='sm' radius='md'>
        <Card.Section px='md' pt='md'>
          <Flex justify='space-between' align='center'>
            <Title order={5}>{props.bumpFramework.title}</Title>
            <ActionIcon
              onClick={() => {
                openContextModal({
                  modal: 'editBumpFramework',
                  title: <Title order={3}>Edit: {props.bumpFramework.title}</Title>,
                  innerProps: {
                    bumpFrameworkID: props.bumpFramework.id,
                    overallStatus: props.bumpFramework.overall_status,
                    title: props.bumpFramework.title,
                    description: props.bumpFramework.description,
                    bumpLength: props.bumpFramework.bump_length,
                    default: props.bumpFramework.default,
                    onSave: props.afterEdit,
                    bumpedCount: props.bumpFramework.bumped_count,
                    bumpDelayDays: props.bumpFramework.bump_delay_days,
                  },
                });
              }}
            >
              <IconEdit size='1.25rem' />
            </ActionIcon>
          </Flex>
        </Card.Section>

        <Card.Section>
          <Divider my='xs' />
        </Card.Section>
        <Flex mih='100px' align='center'>
          <Text>{props.bumpFramework.description}</Text>
        </Flex>

        <Card.Section>
          <Divider my='xs' />
        </Card.Section>
        <Badge color={valueToColor(theme, splitted_substatus || "ACTIVE_CONVO")}>{splitted_substatus || "ACTIVE_CONVO"}</Badge>
      </Card>
    </>
  );
}

export default function BumpFrameworksPage(props: {
  predefinedPersonaId?: number;
  onPopulateBumpFrameworks?: (buckets: BumpFrameworkBuckets) => void;
}) {
  const userToken = useRecoilValue(userTokenState);

  const [loading, setLoading] = useState(false);
  const [archetypeID, setArchetypeID] = useState<number | null>(
    props.predefinedPersonaId !== undefined ? props.predefinedPersonaId : null
  );
  const [addNewSequenceStepOpened, { open: openSequenceStep, close: closeSequenceStep }] = useDisclosure();
  const [addNewQuestionObjectionOpened, { open: openQuestionObjection, close: closeQuestionObjection }] =
    useDisclosure();
  const [maximumBumpSoftLock, setMaximumBumpSoftLock] = useState(false);
  const [currentProject, setCurrentProject] = useRecoilState(currentProjectState);

  const bumpBuckets = useRef<BumpFrameworkBuckets>({
    ACCEPTED: {
      total: 0,
      frameworks: [],
    },
    BUMPED: {},
    ACTIVE_CONVO: {
      total: 0,
      frameworks: [],
    },
  } as BumpFrameworkBuckets);

  const { data: dataChannels } = useQuery({
    queryKey: [`query-get-channels-campaign-prospects`],
    queryFn: async () => {
      return await getChannels(userToken);
    },
    refetchOnWindowFocus: false,
  });

  const triggerGetPersonas = async () => {
    const result = await getPersonas(userToken);

    if (result.status !== 'success') {
      showNotification({
        title: 'Error',
        message: 'Could not get personas',
        color: 'red',
      });
      return;
    }

    const personas = result.data;
    for (const persona of personas) {
      if (currentProject?.id) {
        setArchetypeID(currentProject?.id)
        break
      }
      if (persona.active && !props.predefinedPersonaId) {
        setArchetypeID(persona.id);
        break;
      }
    }

    return;
  };

  const triggerGetBumpFrameworks = async () => {
    setLoading(true);

    const result = await getBumpFrameworks(userToken, [], [], [archetypeID as number]);

    if (result.status !== 'success') {
      setLoading(false);
      showNotification({
        title: 'Error',
        message: 'Could not get bump frameworks.',
        color: 'red',
        autoClose: false,
      });
      return;
    }

    // Populate bump buckets
    let newBumpBuckets = {
      ACCEPTED: {
        total: 0,
        frameworks: [],
      },
      BUMPED: {
        1: {
          total: 0,
          frameworks: [],
        },
        2: {
          total: 0,
          frameworks: [],
        },
        3: {
          total: 0,
          frameworks: [],
        },
      },
      ACTIVE_CONVO: {
        total: 0,
        frameworks: [],
      },
    } as BumpFrameworkBuckets;
    for (const bumpFramework of result.data.bump_frameworks as BumpFramework[]) {
      const status = bumpFramework.overall_status;
      if (status === 'ACCEPTED') {
        newBumpBuckets.ACCEPTED.total += 1;
        if (bumpFramework.default) {
          newBumpBuckets.ACCEPTED.frameworks.unshift(bumpFramework);
        } else {
          newBumpBuckets.ACCEPTED.frameworks.push(bumpFramework);
        }
      } else if (status === 'BUMPED') {
        const bumpCount = bumpFramework.bumped_count as number;
        if (!(bumpCount in newBumpBuckets.BUMPED)) {
          continue;
        }
        newBumpBuckets.BUMPED[bumpCount].total += 1;
        if (bumpCount >= 3) {
          setMaximumBumpSoftLock(true);
        }
        if (bumpFramework.default) {
          newBumpBuckets.BUMPED[bumpCount].frameworks.unshift(bumpFramework);
        } else {
          newBumpBuckets.BUMPED[bumpCount].frameworks.push(bumpFramework);
        }
      } else if (status === 'ACTIVE_CONVO') {
        newBumpBuckets.ACTIVE_CONVO.total += 1;
        if (bumpFramework.default) {
          newBumpBuckets.ACTIVE_CONVO.frameworks.unshift(bumpFramework);
        } else {
          newBumpBuckets.ACTIVE_CONVO.frameworks.push(bumpFramework);
        }
      }
    }
    bumpBuckets.current = newBumpBuckets;

    // BumpFrameworks have been updated, submit event to parent
    if (props.onPopulateBumpFrameworks) {
      props.onPopulateBumpFrameworks(newBumpBuckets);
    }

    setLoading(false);
  };

  useEffect(() => {
    triggerGetPersonas();
  }, []);

  useEffect(() => {
    triggerGetBumpFrameworks();
  }, [archetypeID]);

  return (
    <>
      <Flex direction='column'>
        <LoadingOverlay visible={loading} />
        <Title>LinkedIn Bump Frameworks</Title>
        {props.predefinedPersonaId === undefined && (
          <Flex mt='md'>
            <PersonaSelect
              disabled={false}
              onChange={(archetype) => {
                if (archetype.length == 0) {
                  return;
                }
                if (currentProject?.id) {
                  setArchetypeID(currentProject?.id)
                  return
                }
                setArchetypeID(archetype[0].archetype_id);
              }}
              defaultValues={archetypeID ? [archetypeID] : []}
              selectMultiple={false}
              label='Select Persona'
              description='Select the persona whose bump frameworks you want to view.'
            />
          </Flex>
        )}

        <Tabs color='blue' variant='outline' defaultValue='sequence' my='lg' orientation='vertical'>
          <Tabs.List>
            <Tabs.Tab value='sequence' icon={<IconList size='0.8rem' />}>
              Sequence
            </Tabs.Tab>
            <Tabs.Tab value='qnolibrary' icon={<IconBook size='0.8rem' />}>
              Questions & Objections Library
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value='sequence'>
            {!loading ? (
              <ScrollArea>
                <Flex direction='column' ml='md'>
                  {/* Accepted */}
                  <BumpBucketView
                    bumpBucket={bumpBuckets.current?.ACCEPTED}
                    bucketViewTitle={'First / Initial Followup'}
                    bucketViewDescription={'Prospects who have accepted your connection request.'}
                    status={'ACCEPTED'}
                    dataChannels={dataChannels}
                    archetypeID={archetypeID}
                    afterCreate={triggerGetBumpFrameworks}
                    afterEdit={triggerGetBumpFrameworks}
                    afterClone={triggerGetBumpFrameworks}
                  />

                  {/* Bumped (map) */}
                  {Object.keys(bumpBuckets.current?.BUMPED).map((bumpCount) => {
                    const bumpCountInt = parseInt(bumpCount);
                    const bumpBucket = bumpBuckets.current?.BUMPED[bumpCountInt];

                    const bumpToFollowupMap: Record<string, string> = {
                      '1': 'Second',
                      '2': 'Third',
                      '3': 'Fourth',
                      '4': 'Fifth',
                      '5': 'Sixth',
                    }
                    const followupString = bumpToFollowupMap[bumpCount];
                    if (followupString == undefined) {
                      return;
                    }
                    return (
                      <Flex mt='md' w='100%'>
                        <BumpBucketView
                          bumpBucket={bumpBucket}
                          bucketViewTitle={`${followupString} Followup`}
                          bucketViewDescription={`This is followup #${bumpCountInt + 1}`}
                          status={'BUMPED'}
                          dataChannels={dataChannels}
                          archetypeID={archetypeID}
                          afterCreate={triggerGetBumpFrameworks}
                          afterEdit={triggerGetBumpFrameworks}
                          bumpedCount={bumpCountInt}
                          afterClone={triggerGetBumpFrameworks}
                        />
                      </Flex>
                    );
                  })}

                  {/* Add another to sequence */}
                  {/* <Flex justify='center' align='center' w='100%' direction="column">
                    <Button variant='outline' mt='md' w='50%' onClick={openSequenceStep} disabled={maximumBumpSoftLock}>
                      Add another sequence step
                    </Button>
                    {maximumBumpSoftLock && (
                      <Text color='grey' fz='sm'>
                        We strongly recommend no more than 4 followups.
                      </Text>
                    )}
                    <CreateBumpFrameworkModal
                      modalOpened={addNewSequenceStepOpened}
                      openModal={openSequenceStep}
                      closeModal={closeSequenceStep}
                      backFunction={triggerGetBumpFrameworks}
                      dataChannels={dataChannels}
                      status={'BUMPED'}
                      archetypeID={archetypeID}
                      bumpedCount={Object.keys(bumpBuckets.current?.BUMPED).length + 1}
                    />
                  </Flex> */}
                </Flex>
              </ScrollArea>
            ) : (
              <Flex justify='center' mt='xl'>
                <Loader />
              </Flex>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='qnolibrary'>
            {!loading ? (
              <Flex direction='column' ml='xs'>
                <Flex align='center' w='100%' justify='center'>
                  <Button variant='outline' mb='md' w='50%' onClick={openQuestionObjection}>
                    Add another question/objection
                  </Button>
                </Flex>

                <CreateBumpFrameworkModal
                  modalOpened={addNewQuestionObjectionOpened}
                  openModal={openQuestionObjection}
                  closeModal={closeQuestionObjection}
                  backFunction={triggerGetBumpFrameworks}
                  status='ACTIVE_CONVO'
                  dataChannels={dataChannels}
                  archetypeID={archetypeID}
                />
                <Grid>
                  {Object.keys(bumpBuckets.current?.ACTIVE_CONVO.frameworks).map((qno, index) => {
                    return (
                      <Grid.Col span={6}>
                        <QuestionObjectionLibraryCard
                          bumpFramework={bumpBuckets.current?.ACTIVE_CONVO.frameworks[index]}
                          archetypeID={archetypeID}
                          afterEdit={triggerGetBumpFrameworks}
                        />
                      </Grid.Col>
                    );
                  })}
                </Grid>
              </Flex>
            ) : (
              <Flex justify='center'>
                <Loader />
              </Flex>
            )}
          </Tabs.Panel>
        </Tabs>
      </Flex>
    </>
  );
}
