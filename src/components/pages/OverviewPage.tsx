import React, { useEffect, useState } from 'react';
import { Container, Title, Image, Button, Tooltip, Text, Card, Flex, Box, Avatar, Group, Badge, Grid, Divider, SegmentedControl, Center, rem, Loader, Input, HoverCard, Table, useMantineTheme, Collapse } from '@mantine/core';
import { Bar, Line } from 'react-chartjs-2';
import { IconArrowDown, IconArrowUp, IconBook, IconBrandLinkedin, IconBrandSuperhuman, IconBriefcase, IconBuilding, IconBuildingFactory, IconChecks, IconChevronDown, IconChevronUp, IconClick, IconCode, IconEye, IconGlobe, IconInfoCircle, IconLetterA, IconList, IconMail, IconMan, IconPlane, IconSearch, IconSend, IconUser, IconWoman, IconWorld } from '@tabler/icons';
import { IconGrid3x3, IconMessageCheck, IconSunElectricity } from '@tabler/icons-react';
import { API_URL } from '@constants/data';
import { useRecoilState, useRecoilValue } from 'recoil';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import { showNotification } from '@mantine/notifications';
import OverallPipeline from '@common/campaigns/OverallPipeline';
import { getPersonasActivity, getPersonasCampaignView, getPersonasOverview } from '@utils/requests/getPersonas';
import { PersonaOverview } from 'src';
import { CampaignAnalyticsData } from '@common/campaigns/CampaignAnalytics';
import { isLoggedIn } from '@auth/core';
import { CampaignPersona } from '@common/campaigns/PersonaCampaigns';
import { TodayActivityData } from '@common/campaigns/OverallPipeline/TodayActivity';
import moment from 'moment';
import { deterministicMantineColor } from '@utils/requests/utils';
import { useDisclosure } from '@mantine/hooks';

const options = {
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

function BarChart() {
  const [currentMode, setCurrentMode] = useState('month');
  const [modes, setModes]: any = useState({});
  const [fetchedModes, setFetchedModes] = useState(false);

  const userToken = useRecoilState(userTokenState)

  useEffect(() => {
    if (!fetchedModes) {
      fetch(`${API_URL}/analytics/outreach_over_time`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken[0]}`
        },
      })
      .then(response => response.json())
      .then(data => {
        setModes(data.outreach_over_time || {});
      })

      setFetchedModes(true);
    }
  }, [fetchedModes]);

  const sumOutbounds = modes[currentMode]?.data.outbound.reduce((a: any, b: any) => a + b, 0);
  const sumAcceptances = modes[currentMode]?.data.acceptances.reduce((a: any, b: any) => a + b, 0);
  const sumReplies = modes[currentMode]?.data.replies.reduce((a: any, b: any) => a + b, 0);
  const sumDemos = modes[currentMode]?.data.demos?.reduce((a: any, b: any) => a + b, 0);
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(true);

  const totalTouchpoints = sumOutbounds + sumAcceptances + sumReplies + sumDemos;

  const chartData = {
    labels: modes[currentMode]?.labels,
    datasets: [
      {
        label: 'Total Outbound Volume',
        data: modes[currentMode]?.data.outbound,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        label: 'Total Acceptances',
        data: modes[currentMode]?.data.acceptances,
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        label: 'Total Replies',
        data: modes[currentMode]?.data.replies,
        backgroundColor: 'rgba(255,206,86,0.2)',
        borderColor: 'rgba(255,206,86,1)',
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        label: 'Total Demos',
        data: modes[currentMode]?.data.demos,
        backgroundColor: 'rgba(54,162,235,0.2)',
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 1,
        stack: 'Stack 0',
      }
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
      },
      x: {
        stacked: true,
      },
    },
  };

  return (
    <Card withBorder mt='md' p='0'>
      <Flex mb='md' pl='md' pr='md' p='xs' sx={{backgroundColor: theme.colors.blue[6]}}>
        <Title order={3} mt='0' sx={{flexDirection: 'row', display: 'flex', color: 'white'}}>Volume</Title>
        {
          opened ?
            <IconChevronDown color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/> : 
            <IconChevronUp color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/>
        }
      </Flex>
      <Collapse in={opened}>
        <Card pt='0'>
          <Flex direction='row' mb='xs'>
            <Box>
              <Text color='gray'>TOTAL OUTBOUND TOUCHPOINTS</Text>
              <Title>{totalTouchpoints.toLocaleString()}</Title>
            </Box>
            <Box sx={{justifyContent: 'right', textAlign: 'right', width: '300px'}} ml='auto' mt='md'>
              {['week', 'month', 'year'].map(mode => (
                <Button 
                  onClick={() => setCurrentMode(mode)} 
                    mr='xs' 
                    size='xs'
                    color={currentMode === mode ? 'green' : 'gray'}
                    variant={currentMode === mode ? 'outline' : 'subtle'}
                    key={mode}
                >
                  {mode}
                </Button>
              ))}
            </Box>
          </Flex>
          <Bar data={chartData} options={options} />
        </Card>
      </Collapse>
    </Card>
  );
}


const WarmupChart = () => {
  const theme = useMantineTheme();
  const data = {
    labels: [
      "Month 1",
      "Month 2",
      "Month 3",
      "Month 4",
      "Month 5",
    ],
    datasets: [
      {
        label: 'LinkedIn',
        data: [7, 11, 32, 46, 48, 48],
        fill: false,
        borderColor: theme.colors.blue[6],
        tension: 0.1
      },
      {
        label: 'Email',
        data: [20, 36, 48, 69, 140],
        fill: false,
        borderColor: theme.colors.orange[6],
        tension: 0.1
      },
      {
        label: 'Total',
        data: [27, 47, 80, 115, 188],
        fill: false,
        borderColor: theme.colors.gray[6],
        tension: 0.1
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        // show at bottom
        position: 'bottom',
      },
      title: {
        display: true,
        text: '🔥 Warming Volume'
      }
    },
    scales: {
      y: {
        ticks: {
          display: false, // This will hide the y-axis ticks
        },
        grid: {
          drawBorder: false, // This will hide the y-axis line if you also want that
        },
      },
    },
  };

  return <div style={{width: '100%', height: '400px'}}>
     <Line data={data} options={options} />
  </div>
};


export function ActiveChannels() {
  const [sdrs, setSDRs] = useState([]);
  const [fetchedChannels, setFetchedChannels] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(true);

  const userToken = useRecoilState(userTokenState)

  useEffect(() => {
    if (!fetchedChannels) {
      setLoading(true)
      fetch(`${API_URL}/email/warmup/channel_warmups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken[0]}`
        },
      })
        .then(response => response.json())
        .then(data => {
          setSDRs(data.sdrs || []);
        }).finally(() => {
          setFetchedChannels(true);
          setLoading(false);
        });
    }
  }, [setFetchedChannels]);

  if (loading) { 
    return <Card withBorder mt='md'>
      <Flex>
        <Box>
          <Loader />
        </Box>
      </Flex>
    </Card>
  }

  // Across every SDR count the total linkedin and email volume for their org
  let totalLinkedInWarmup = 0;
  let totalEmailWarmup = 0;
  for (const x of sdrs) {
    const sdr: any = x
    if (sdr.channels) {
      for (const channel of sdr.channels) {
        if (channel.channel_type == 'LINKEDIN') {
          totalLinkedInWarmup += channel.daily_limit
        } else if (channel.channel_type == 'EMAIL') {
          totalEmailWarmup += channel.daily_limit
        }
      }
    }
  }

  return <>
    <Card withBorder mt='xs' p={0} pt={0} >
      <Flex mb='md' pl='md' pr='md' p='xs' sx={{backgroundColor: theme.colors.blue[6]}}>
        <Title order={3} mt='0' sx={{flexDirection: 'row', display: 'flex', color: 'white'}}>Infrastructure</Title>
        <Badge color='red' variant='outline' size='lg' sx={{backgroundColor: 'white'}} ml='md' mt='2px'>
          🔥 Warmup ENABLED
        </Badge>
        
        {
          opened ?
            <IconChevronDown color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/> : 
            <IconChevronUp color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/>
        }
      </Flex>
      <Collapse in={opened}>
        <Card mt='0' pt='0'>
          <Flex>
            <Box w='100%'>
              <Flex>
                <Flex pl='xs' mb='xs'>
                  <Text mt='4px'>
                    <IconSend size='1.2rem' color={'gray'} />
                  </Text>
                  <Text ml='4px' fz='14px' color='gray' fw='500' mt='2px'>
                    Daily Send Volume:
                  </Text>
                  <Flex color='gray' pt='4px' pl='16px' pr='16px' ml='xs' sx={{border: 'solid 1px #ddd; border-radius: 20px;'}} mah={30}>
                    <IconBrandLinkedin size='1rem' color={theme.colors.blue[6]} />
                    <Text ml='4px' fz='12px' color='gray' fw='bold'>
                      <span style={{color: theme.colors.blue[6], fontWeight: 'bold'}}>LinkedIn:</span> {totalLinkedInWarmup} / day
                    </Text>
                  </Flex>
                  <Flex color='gray' pt='4px' pl='16px' pr='16px' ml='xs' sx={{border: 'solid 1px #ddd; border-radius: 20px;'}}  mah={26}>
                    <IconMail size='1rem' color={theme.colors.orange[6]} />
                    <Text ml='4px' fz='12px' color='gray' fw='bold'>
                      <span style={{color: theme.colors.orange[6], fontWeight: 'bold'}}>Email:</span> {totalEmailWarmup} / day
                    </Text>
                  </Flex>
                </Flex>
                <Text ml='auto' align='right' h={39}><IconUser size='1rem' color={theme.colors.blue[6]}/> <b>{sdrs.filter((x: any) => x.active).length}</b> Active Seats</Text>
              </Flex>
              <Grid>
                {
                  sdrs.sort((a: any, b: any) => -(a.active - b.active)).filter((x: any) => x.active).map((x: any) => {
                    // reduce `x.channels` based on daily_limit
                    let totalSendVolume = 0
                    let totalSentVolume = 0;
                    if (x.channels) {
                      for (const channel of x.channels) {
                        totalSendVolume += channel.daily_limit
                        totalSentVolume += channel.daily_sent_count
                      }
                    }

                    let emails = x.channels?.filter((x: any) => x.channel_type == 'EMAIL').map((x: any) => x.account_name)

                    return <Grid.Col span={4} mb='xs'>
                        <Card  withBorder mt='0' pt='4'>
                          <Flex w='100%' mt='0'>
                            <Box sx={{borderRadius: 10}} pt='0'>
                              <Image 
                                src={x.img_url ? x.img_url : 'https://images.squarespace-cdn.com/content/v1/56031d09e4b0dc68f6197723/1469030770980-URDU63CK3Q4RODZYH0S1/Grey+Box.jpg?format=1500w'} 
                                width={40} height={40} radius="sm" />
                            </Box>
                            <Box ml='xs' mt='0'>
                              <Badge size='xs' color={x.active ? 'green' : 'gray'} >
                                {x.active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Text fw={500} fz={16}>{x.sdr_name}</Text>
                            </Box>
                          </Flex>
                          <Divider mt='xs' mb='xs' />
                          <Box w='100%'>
                          {
                            ["LINKEDIN", "EMAIL"].map((channel) => {
                              let label = 'LinkedIn'
                              if (channel == 'EMAIL') {
                                label = 'Email'
                              } 

                              let icon = <IconBrandLinkedin size='1.4rem'  color={theme.colors.blue[6]}/>
                              if (channel == 'EMAIL') {
                                icon = <IconMail size='1.4rem' color={theme.colors.blue[6]} />
                              }

                              let unit = 'seat'
                              if (channel == 'EMAIL') {
                                unit = 'inboxes'
                              }

                              const numUnits = x.channels?.filter((x: any) => x.channel_type == channel).length

                              return <Flex>
                                        <Group w='100%'>
                                          <HoverCard shadow="md" withinPortal>
                                            <HoverCard.Target>
                                              <Box w='100%'>
                                                <Box w='100%' sx={{cursor: 'pointer'}} mt='xs'>
                                                  <Flex w='100%'>
                                                    {icon}
                                                    <Text color='blue' fw='bold' w='40%' ml='xs'>
                                                      {label}
                                                    </Text>
                                                    <Badge color='gray' w='60%'  ml='xs' fw='700' size='sm' variant='outline' mr='md' mt='4px'>
                                                      {numUnits} {unit}
                                                    </Badge>
                                                  </Flex>
                                                </Box>
                                              </Box>
                                            </HoverCard.Target>
                                            <HoverCard.Dropdown w={400}>
                                              <Table>
                                                <thead>
                                                  <tr>
                                                    <th>Channel</th>
                                                    <th>Volume</th>
                                                    <th>Warmup</th>
                                                    <th>Reputation</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {
                                                    x.channels?.filter((x: any) => x.channel_type == channel).map((channel: any) => {
                                                      return <tr> 
                                                        <td>{channel.channel_type == 'LINKEDIN' ? <IconBrandLinkedin size='0.9rem'/> : <IconMail size='0.9rem'/>} {channel.account_name}</td>
                                                        <td>{channel.daily_sent_count} / {channel.daily_limit}</td>
                                                        <td><Badge size='xs' color={channel.warmup_enabled ? 'green' : 'blue'}>{channel.warmup_enabled ? 'In progress' : 'Done'}</Badge></td>
                                                        <td><Badge size='xs' color={channel.reputation > 80 ? 'green' : 'yellow'}>{channel.reputation}%</Badge></td>
                                                      </tr>
                                                    })
                                                  }
                                                </tbody>
                                              </Table>
                                            </HoverCard.Dropdown>
                                          </HoverCard>
                                        </Group>
                                      </Flex>
                            })
                          }
                          </Box>
                          
                          {emails.length > 0 && <Divider mt='md' />}

                          {
                            emails.map((email: any) => {
                              return <Badge size='xs' color='yellow' variant='dot'> WARMING - <span style={{textTransform: 'lowercase'}}>{email}</span></Badge>
                            })
                          }
                        </Card>
                      </Grid.Col>
                  })
                }
              </Grid>
            </Box>
          </Flex>
        </Card>
      </Collapse>
    </Card>
  </>
}

export function ActiveCampaigns() {
  const [activeCampaigns, setActiveCampaigns] = React.useState([]);
  const [fetchedActiveCampaigns, setFetchActiveCampaigns] = React.useState(false);
  const userData = useRecoilValue(userDataState)
  const [mode, setMode] = useState('list');
  const [campaignsShown, setCampaignsShown] = useState([true]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [query, setQuery] = useState('');
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(true);

  const userToken = useRecoilState(userTokenState)

  useEffect(() => {
    if (!fetchedActiveCampaigns) {
      setLoadingCampaigns(true);
      fetch(`${API_URL}/analytics/all_campaign_analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken[0]}`
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.pipeline_data)
          setActiveCampaigns(data.pipeline_data || []);
        }).finally(() => {
          setFetchActiveCampaigns(true);
          setLoadingCampaigns(false);
        });
    }
  }, [fetchedActiveCampaigns]);

  if (loadingCampaigns) {
    return <Card withBorder mt='md'>
      <Flex>
        <Box>
          <Loader />
        </Box>
      </Flex>
    </Card>
  }

  return <Card withBorder mt='md' p='0'>
    <Flex mb='md' pl='md' pr='md' p='xs' color='white' sx={{backgroundColor: theme.colors.blue[6]}}>
        <Title order={3} color='white'>{campaignsShown.length == 1 ? 'Active' : 'All'} Campaigns {query.length > 0 ? `with "${query}"` : ''}</Title>
        {
          opened ?
            <IconChevronDown color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/> : 
            <IconChevronUp color='white' size='2rem' style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => toggle()}/>
        }
    </Flex>
    <Collapse in={opened}>
      <Card>
        <Flex>
          <Box>
            <Text color='gray'>These are the active campaigns running from across all of {userData.client?.company}'s users</Text>
            <Text color='gray'>There are {activeCampaigns.filter((x: any) => x.active).length} <Badge size='sm' color='green'>Active</Badge> campaigns and {activeCampaigns.filter((x: any) => !x.active).length} <Badge size='sm' color='gray'>Inactive</Badge> campaigns</Text>
          </Box>
          
          <Box ml='auto' w='30%' sx={{textAlign: 'right'}}>
            <SegmentedControl 
              size='xs'
              onChange={
                (value) => {
                  setMode(value);
                }
              }
              data={[
                {
                value: 'list',
                label: (
                  <Center>
                    <IconList style={{ width: rem(16), height: rem(16) }} />
                    <Box ml={10}>List</Box>
                  </Center>
                ),
              },
              {
                value: 'grid',
                label: (
                  <Center>
                    <IconGrid3x3 style={{ width: rem(16), height: rem(16) }} />
                    <Box ml={10}>Grid</Box>
                  </Center>
                ),
              }]} 
            />
            <Input
              icon={<IconSearch size='0.75rem'/>}
              placeholder='Search Campaigns'
              mt='xs'
              onChange={
                (e) => {
                  setQuery(e.currentTarget.value);
                  setCampaignsShown([true, false]);

                  if (e.currentTarget.value.length === 0) {
                    setCampaignsShown([true]);
                  }
                }
              }
            >
            </Input>
          </Box>
        </Flex>
        
        <Grid mt='md'>
          {activeCampaigns
            .sort((a: any,b: any) => b.open_percent - a.open_percent)
            .sort((a: any, b:any) => -(a.active - b.active))
            .filter((x: any) => campaignsShown.includes(x.active))
            .filter((x: any) => x.name.toLowerCase().includes(query.toLowerCase()) || x.archetype.toLowerCase().includes(query.toLowerCase()))
            .map((x: any) => {
            return (
              <Grid.Col span={mode === 'grid' ? 6 : 12}>
                <Card withBorder padding={mode === 'grid' ? 'lg' : 'xs'} radius="md" style={mode === 'grid' ? {} : {display: 'flex', flexDirection: 'row', width: '100%'}}>
                  
                    <Group mb={mode === 'grid' ? "xs" : '0px'} sx={{cursor: 'pointer'}} w='100%'>
                      <Tooltip label={x.name} withinPortal>
                        <Image src={x.img_url} width={40} height={40} radius="sm" />
                      </Tooltip>
                      <Box>
                        <Badge color={x.active ? 'green' : 'gray'} variant="light" size='sm' mb='xs'>
                          {x.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Tooltip label={x.archetype} withinPortal>
                          <Text fw={500}>{x.emoji} {x.archetype.substring(0, mode === 'grid' ? 34 : 44)}{x.archetype.length > (mode === 'grid' ? 34 : 44) ? '...' : ''}</Text>
                        </Tooltip>
                      </Box>
                    </Group>
                  

                  {mode === 'grid' && 
                  <>
                    <Text c="dimmed" size='xs' mah='110px' mb='xs' sx={{overflowY: 'scroll'}}> 
                      {x.included_individual_title_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Job Titles" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconBriefcase size="0.75rem" color="#868E96" /> {x.included_individual_title_keywords.join(", ").substring(0, 60)}{x.included_individual_title_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_individual_locations_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Locations" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconWorld size="0.75rem" color="#868E96" /> {x.included_individual_locations_keywords.join(", ").substring(0, 60)}{x.included_individual_locations_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_individual_industry_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Industries" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconBuildingFactory size="0.75rem" color="#868E96" /> {x.included_individual_industry_keywords.join(", ").substring(0, 60)}{x.included_individual_industry_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_individual_generalized_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Keywords" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconBook size="0.75rem" color="#868E96" /> {x.included_individual_generalized_keywords.join(", ").substring(0, 60)}{x.included_individual_generalized_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_individual_skills_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Skills" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconSunElectricity size="0.75rem" color="#868E96" /> {x.included_individual_skills_keywords.join(", ").substring(0, 60)}{x.included_individual_skills_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_company_name_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Companies" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconBuilding size="0.75rem" color="#868E96" /> {x.included_company_name_keywords.join(", ").substring(0, 60)}{x.included_company_name_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_company_locations_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Company Locations" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconGlobe size="0.75rem" color="#868E96" /> {x.included_company_locations_keywords.join(", ").substring(0, 60)}{x.included_company_locations_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_company_generalized_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Company Keywords" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconInfoCircle size="0.75rem" color="#868E96" /> {x.included_company_generalized_keywords.join(", ").substring(0, 60)}{x.included_company_generalized_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {x.included_company_industries_keywords?.length > 0 && (
                        <Tooltip label="Prioritized Prospect Company Industries" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconBuildingFactory size="0.75rem" color="#868E96" /> {x.included_company_industries_keywords.join(", ").substring(0, 60)}{x.included_company_industries_keywords.join(", ").length > 60 ? '...' : ''}
                          </p>
                        </Tooltip>
                      )}

                      {(x.company_size_start && x.company_size_end) ? (
                        <Tooltip label="Prioritized Prospect Company Size" withinPortal>
                          <p style={{margin: 0, marginBottom: 4}}>
                            <IconMan size="0.75rem" color="#868E96" /> {x.company_size_start.toLocaleString()} - {x.company_size_end.toLocaleString()} Employees
                          </p>
                        </Tooltip>
                      ) : ''}
                    </Text> 
                  </>}

                  <Divider mt='md'/>

                  <Flex
                    align={"center"}
                    justify={"space-between"}
                    gap={"0.1rem"}
                    mt='md'
                    mb='md'
                    ml='md'
                    mr='md'
                  >
                    <Tooltip label={x.num_sent.toLocaleString() + " Sent / " + x.num_sent.toLocaleString() + " Sent"} withinPortal>
                      <Flex gap={"0.25rem"} align={"center"} sx={{cursor: 'pointer'}}>
                        <IconSend size="0.75rem" color="#868E96" />
                        <Text fw={"600"} fz={"0.7rem"} color="gray.6">
                          Send:
                        </Text>
                        <Text fw={"600"} fz={"0.7rem"} color="gray.8">
                          {x.sent_percent}%
                        </Text>
                      </Flex>
                    </Tooltip>

                    <Divider orientation="vertical" size='xs' m='4px' />

                    <Tooltip label={x.num_opens.toLocaleString() + " Opens / " + x.num_sent.toLocaleString() + " Sent"} withinPortal>
                      <Flex gap={"0.25rem"} align={"center"} sx={{cursor: 'pointer'}}>
                        <IconChecks size="0.75rem" color="#868E96" />
                        <Text fw={"600"} fz={"0.7rem"} color="gray.6">
                          Opens:
                        </Text>
                        <Text fw={"600"} fz={"0.7rem"} color="gray.8">
                          {Math.round(x.open_percent * 100)}%
                        </Text>
                      </Flex>
                    </Tooltip>

                    <Divider orientation="vertical" size='xs' m='4px'/>

                    <Tooltip label={x.num_replies.toLocaleString() + " Replies / " + x.num_sent.toLocaleString() + " Sent"} withinPortal>
                      <Flex gap={"0.25rem"} align={"center"} sx={{cursor: 'pointer'}}>
                        <IconMessageCheck size="0.75rem" color="#868E96" />
                        <Text fw={"600"} fz={"0.7rem"} color="gray.6">
                          Replies:
                        </Text>
                        <Text fw={"600"} fz={"0.7rem"} color="gray.8">
                          {Math.round(x.reply_percent * 100)}%
                        </Text>
                      </Flex>
                    </Tooltip>

                    <Divider orientation="vertical" size='xs' m='4px' />

                    <Tooltip label={x.num_demos.toLocaleString() + " Demos / " + x.num_sent.toLocaleString() + " Sent"} withinPortal>
                      <Flex gap={"0.25rem"} align={"center"} sx={{cursor: 'pointer'}}>
                        <IconMessageCheck size="0.75rem" color="#868E96" />
                        <Text fw={"600"} fz={"0.7rem"} color="gray.6">
                          Demos:
                        </Text>
                        <Text fw={"600"} fz={"0.7rem"} color="gray.8">
                          {Math.round(x.demo_percent * 100)}%
                        </Text>
                      </Flex>
                    </Tooltip>
                  </Flex>
                </Card>
            </Grid.Col>
          )
          })}
          <Button 
            variant='subtle'
            leftIcon={campaignsShown.length === 1 ? <IconArrowDown size='0.8rem'/> : <IconArrowUp size='0.8rem'/>}
            onClick={
              () => {
                if (campaignsShown.length === 1) {
                  setCampaignsShown([true, false]);
                } else {
                  setCampaignsShown([true]);
                }
              }
            }
            color='gray'>
            Show {campaignsShown.length === 1 ? 'All' : 'Active'} Campaigns
          </Button>
        </Grid>
      </Card>
    </Collapse>
  </Card>
}


export default function OverviewPage() {

  const userData = useRecoilValue(userDataState)
  const userToken = useRecoilValue(userTokenState);

  const [campaignAnalyticData, setCampaignAnalyticData] =
    useState<CampaignAnalyticsData>({
      sentOutreach: 0,
      accepted: 0,
      activeConvos: 0,
      demos: 0,
    });

  const [aiActivityData, setAiActivityData] = useState<TodayActivityData>({
    totalActivity: 0,
    newOutreach: 0,
    newBumps: 0,
    newReplies: 0,
  });

    const fetchCampaignPersonas = async () => {
    if (!isLoggedIn()) return;

    // Get AI Activity
    const response3 = await getPersonasActivity(userToken);
    const result3 = response3.status === "success" ? response3.data : [];
    if (result3.activities && result3.activities.length > 0) {
      const newOutreach = result3.activities[0].messages_sent;
      const newBumps = result3.activities[0].bumps_sent;
      const newReplies = result3.activities[0].replies_sent;
      const totalActivity = newOutreach + newBumps + newReplies;
      const activity_data = {
        totalActivity: totalActivity,
        newOutreach: newOutreach,
        newBumps: newBumps,
        newReplies: newReplies,
      };
      setAiActivityData(activity_data);
    }

    if (result3.overall_activity && result3.overall_activity.length > 0) {
      const sentOutreach = result3.overall_activity[0].sent_outreach;
      const emailOpened = result3.overall_activity[0].email_opened;
      const activeConvo = result3.overall_activity[0].active_convo;
      const demoSet = result3.overall_activity[0].demo_set;
      const analytics_data = {
        sentOutreach: sentOutreach,
        accepted: emailOpened,
        activeConvos: activeConvo,
        demos: demoSet,
      };
      setCampaignAnalyticData(analytics_data);
    }

  };

  useEffect(() => {
    fetchCampaignPersonas()
  }, []);

  return (
    <Box p="xl" maw='1000px' ml='auto' mr='auto'>
      <Title order={2} mb='0px'>Overview</Title>
      <Text mb='md' color='gray'>
        View analytics from across all of {userData.client?.company}'s users
      </Text>
      <Box mb='xs'>
        <OverallPipeline
          campaignData={campaignAnalyticData}
          aiActivityData={aiActivityData}
        />
      </Box>  
      <BarChart />
      <ActiveChannels />
      <ActiveCampaigns />
    </Box>
  );
}
