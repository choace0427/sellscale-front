import { openedProspectIdState } from "@atoms/inboxAtoms";
import { currentProjectState } from "@atoms/personaAtoms";
import { userDataState, userTokenState } from "@atoms/userAtoms";
import { isLoggedIn } from "@auth/core";
import PageFrame from "@common/PageFrame";
import EmailQueuedMessages from "@common/emails/EmailQueuedMessages";
import LinkedinQueuedMessages from "@common/messages/LinkedinQueuedMessages";
import EmojiPicker from "emoji-picker-react";
import {
  IconFlagCancel,
  IconMessage,
  IconPencil,
  IconPointerCancel,
} from "@tabler/icons-react";

import {
  Tooltip,
  Stack,
  Group,
  Avatar,
  Title,
  Button,
  Divider,
  Box,
  Popover,
  Text,
  Paper,
  ActionIcon,
  Center,
  Switch,
  useMantineTheme,
  ScrollArea,
  Tabs,
  Loader,
  Collapse,
  Flex,
  RingProgress,
  MantineColor,
  Badge,
  Modal,
  CloseButton,
  Anchor,
} from "@mantine/core";
import { useDisclosure, useHover } from "@mantine/hooks";
import { openContextModal } from "@mantine/modals";
import {
  IconBrandLinkedin,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconChecks,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconExternalLink,
  IconMail,
  IconMan,
  IconPlus,
  IconRefresh,
  IconSeeding,
  IconSend,
  IconTarget,
  IconX,
} from "@tabler/icons";
import {
  IconArrowDown,
  IconArrowUp,
  IconClipboard,
  IconMessageCheck,
} from "@tabler/icons-react";
import { navigateToPage } from "@utils/documentChange";
import {
  convertDateToShortFormatWithoutTime,
  formatToLabel,
} from "@utils/general";
import {
  getPersonasActivity,
  getPersonasCampaignView,
  getPersonasOverview,
} from "@utils/requests/getPersonas";
import _, { orderBy, sortBy } from "lodash";
import moment from "moment";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { PersonaOverview } from "src";
import { API_URL } from "@constants/data";
import CampaignGraph from "./campaigngraph";
import { showNotification } from "@mantine/notifications";
import { CampaignAnalyticsData } from "./CampaignAnalytics";
// import { CampaignAnalyticChart } from "./CampaignAnalyticsV2";
import { TodayActivityData } from "./OverallPipeline/TodayActivity";
import UserStatusToggle from "./UserStatusToggle";
import AllCampaign from "../../PersonaCampaigns/AllCampaign";
import postSyncSmartleadCampaigns from "@utils/requests/postSyncSmartleadCampaigns";
import TriggersList from "@pages/TriggersList";

export type CampaignPersona = {
  id: number;
  name: string;
  email_sent: number;
  email_opened: number;
  email_replied: number;
  li_sent: number;
  li_opened: number;
  li_replied: number;
  active: boolean;
  linkedin_active: boolean;
  email_active: boolean;
  created_at: string;
  emoji: string;
  total_sent: number;
  total_opened: number;
  total_replied: number;
  total_pos_replied: number;
  total_demo: number;
  total_prospects: number;
  sdr_name: string;
  sdr_img_url: string;
  sdr_id: number;
  smartlead_campaign_id?: number;
  meta_data?: Record<string, any>;
  first_message_delay_days?: number;
};

export default function PersonaCampaigns() {
  const navigate = useNavigate();

  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);

  const [projects, setProjects] = useState<PersonaOverview[]>([]);
  const [personas, setPersonas] = useState<CampaignPersona[]>([]);

  const [search, setSearch] = useState<string>("");

  let filteredProjects = personas.filter((personas) =>
    personas.name.toLowerCase().includes(search.toLowerCase())
  );
  let allProjects = personas;

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
  const [currentEmailSla, setCurrentEmailSla] = useState<number>(0);
  const [currentLinkedInSLA, setCurrentLinkedInSLA] = useState<number>(0);
  const [showInactivePersonas, setShowInactivePersonas] =
    useState<boolean>(false);

  let [loadingPersonas, setLoadingPersonas] = useState<boolean>(true);

  const [campaignViewMode, setCampaignViewMode] = useState<
    "node-view" | "list-view"
  >("node-view");

  const fetchCampaignPersonas = async () => {
    if (!isLoggedIn()) return;
    setLoadingPersonas(true);

    // Get Personas Campaign View
    const response = await getPersonasCampaignView(userToken);
    const result =
      response.status === "success" ? (response.data as CampaignPersona[]) : [];

    // Aggregate campaign analytics
    let analytics = {
      sentOutreach: 0,
      accepted: 0,
      activeConvos: 0,
      demos: 0,
    };
    for (const campaign of response.data) {
      analytics.sentOutreach += campaign.li_sent;
      analytics.accepted += campaign.li_opened;
      analytics.activeConvos += campaign.li_replied;
      analytics.demos += campaign.li_demo;
    }
    setCampaignAnalyticData(analytics);

    // Get LinkedIn SLA
    if (userData.sla_schedules) {
      for (const schedule of userData.sla_schedules) {
        if (
          moment(schedule.start_date) < moment() &&
          moment() <= moment(schedule.start_date).add(7, "days")
        ) {
          setCurrentEmailSla(schedule.email_volume)
          setCurrentLinkedInSLA(schedule.linkedin_volume);
        }
      }
    }

    // Set the Personas
    setPersonas(result);
    setLoadingPersonas(false);

    // Get Personas Overview
    const response2 = await getPersonasOverview(userToken);
    const result2 =
      response2.status === "success"
        ? (response2.data as PersonaOverview[])
        : [];
    setProjects(result2);

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
  };

  useEffect(() => {
    fetchCampaignPersonas();
  }, []);

  // sort personas by persona.active then persona.created_at in desc order
  filteredProjects.sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    if (moment(a.created_at).isAfter(moment(b.created_at))) return -1;
    if (moment(a.created_at).isBefore(moment(b.created_at))) return 1;
    return 0;
  });

  const campaignsSectionHeader = (
    <>
      <Group position="apart" mb="xs">
        <Group>
          <Button
            radius="md"
            leftIcon={<IconPlus size="1rem" />}
            onClick={() => {
              openContextModal({
                modal: "uploadProspects",
                title: <Title order={3}>Create Campaign</Title>,
                innerProps: { mode: "CREATE-ONLY" },
              });
            }}
          >
            Create New Campaign
          </Button>
        </Group>

        <Group>
        
          <Button
              leftIcon={<IconMail size="0.8rem" />}
              color='orange'
              variant="outline"
              radius="md"
              onClick={() => {
                navigateToPage(navigate, `/settings`);
              }}
            >
              {`Email Send Rate (per week): ${currentEmailSla * 5}`}
            </Button>

          {userData?.warmup_linkedin_complete ? (
            <Button
              leftIcon={<IconBrandLinkedin size="0.8rem" />}
              variant="outline"
              radius="md"
              onClick={() => {
                navigateToPage(navigate, `/settings/linkedinConnection`);
              }}
            >
              {`LinkedIn Send Rate (per week): ${currentLinkedInSLA}`}
            </Button>
          ) : (
            <Tooltip
              label="Your LinkedIn account is in a warmup phase. Explore more."
              withArrow
              withinPortal
            >
              <Button
                variant="outline"
                radius="md"
                onClick={() => {
                  navigateToPage(navigate, `/settings/linkedinConnection`);
                }}
              >
                {`LinkedIn Warming Up (per week): ${currentLinkedInSLA}`}
              </Button>
            </Tooltip>
          )}
        </Group>
      </Group>
    </>
  );

  return (
    <PageFrame>
      <Stack>
        <Tabs defaultValue="overview">
          <Tabs.List mb="md">
            <Tabs.Tab value="overview" icon={<IconClipboard size="0.8rem" />}>
              {userData?.sdr_name.split(" ")[0]}'s Campaigns
            </Tabs.Tab>
            <Tabs.Tab
              value="all-campaigns"
              icon={<IconClipboard size="0.8rem" />}
            >
              {userData?.client?.company}'s Campaigns
            </Tabs.Tab>
            <Tabs.Tab value="triggers" icon={<IconTarget size="0.8rem" />}>
              Triggers
            </Tabs.Tab>
            <Tabs.Tab
              value="linkedin"
              icon={<IconBrandLinkedin size="0.8rem" />}
              ml="auto"
            >
              Queued LinkedIns
            </Tabs.Tab>
            <Tabs.Tab value="email" icon={<IconMail size="0.8rem" />}>
              Queued Emails
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="triggers" pt="xs">
            <TriggersList />
          </Tabs.Panel>

          <Tabs.Panel value="all-campaigns" pt="xs">
            {campaignsSectionHeader}
            <AllCampaign campaigns={allProjects} />
          </Tabs.Panel>

          <Tabs.Panel value="overview" pt="xs">
            <Stack>
              {campaignsSectionHeader}

              <Title color="gray.6" order={3}>
                {userData?.sdr_name.split(" ")[0]}'s Campaigns
              </Title>

              <ScrollArea h={"78vh"}>
                <Stack spacing={0}>
                  {loadingPersonas && (
                    <Center h={200}>
                      <Loader />
                    </Center>
                  )}
                  {!loadingPersonas && (
                    <PersonCampaignTable
                      campaignViewMode={campaignViewMode}
                      projects={projects}
                      filteredProjects={filteredProjects
                        .filter(
                          (persona: CampaignPersona) =>
                            persona.sdr_id === userData?.id
                        )
                        .filter((persona) => persona.active)}
                      onPersonaActiveStatusUpdate={async (
                        id: number,
                        active: boolean
                      ) => {
                        setProjects((cur) => {
                          const temp = [...cur].map((e) => {
                            if (e.id === id) {
                              e.active = active;
                              return e;
                            }
                            return e;
                          });
                          return temp;
                        });
                        await fetchCampaignPersonas();
                      }}
                    />
                  )}
                  {showInactivePersonas && !loadingPersonas && (
                    <>
                      <PersonCampaignTable
                        hideHeader
                        campaignViewMode={campaignViewMode}
                        projects={projects}
                        filteredProjects={filteredProjects
                          .filter((persona) => !persona.active)
                          .filter(
                            (persona: CampaignPersona) =>
                              persona.sdr_id === userData?.id
                          )}
                        onPersonaActiveStatusUpdate={async (
                          id: number,
                          active: boolean
                        ) => {
                          setProjects((cur) => {
                            const temp = [...cur].map((e) => {
                              if (e.id === id) {
                                e.active = active;
                                return e;
                              }
                              return e;
                            });
                            return temp;
                          });
                          await fetchCampaignPersonas();
                        }}
                      />
                    </>
                  )}

                  {filteredProjects
                    .filter((persona) => !persona.active)
                    .filter(
                      (persona: CampaignPersona) =>
                        persona.sdr_id === userData?.id
                    ).length > 0 && (
                    <Button
                      color="gray"
                      leftIcon={
                        <IconCalendar color="gray" size="0.8rem"></IconCalendar>
                      }
                      variant="outline"
                      size="xs"
                      w="300px"
                      ml="auto"
                      mr="auto"
                      sx={{ borderRadius: "0.5rem" }}
                      onClick={() =>
                        setShowInactivePersonas(!showInactivePersonas)
                      }
                      mt="md"
                      mb="md"
                    >
                      {showInactivePersonas ? "Hide" : "Show"}{" "}
                      {
                        filteredProjects
                          .filter((persona) => !persona.active)
                          .filter(
                            (persona: CampaignPersona) =>
                              persona.sdr_id === userData?.id
                          ).length
                      }{" "}
                      Inactive Campaign
                      {filteredProjects
                        .filter((persona) => !persona.active)
                        .filter(
                          (persona: CampaignPersona) =>
                            persona.sdr_id === userData?.id
                        ).length > 1
                        ? "s"
                        : ""}
                    </Button>
                  )}

                  {!loadingPersonas && filteredProjects.length === 0 && (
                    <Center h={200}>
                      <Text fs="italic" c="dimmed">
                        No campaigns found.
                      </Text>
                    </Center>
                  )}
                </Stack>
              </ScrollArea>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="linkedin" pt="xs">
            <Group position="center" noWrap>
              <LinkedinQueuedMessages all />
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="email" pt="xs">
            <Group position="center" noWrap>
              <EmailQueuedMessages all />
            </Group>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PageFrame>
  );
}

type ChannelSection = {
  id: number;
  type: string;
  active: boolean;
  icon: ReactNode;
  sends: number;
  opens: number;
  replies: number;
  date: string;
};

export function PersonCampaignCard(props: {
  persona: CampaignPersona;
  project?: PersonaOverview;
  viewMode: "node-view" | "list-view";
  onPersonaActiveStatusUpdate?: (id: number, active: boolean) => void;
}) {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [openedProspectId, setOpenedProspectId] = useRecoilState(
    openedProspectIdState
  );
  const [opened, { open, close, toggle }] = useDisclosure(false); //props.persona.active
  const [inactiveChannelsOpened, setInactiveChannelsOpened] = useState(false);
  const [emoji, setEmojiState] = useState<string>(props.persona.emoji || "⬜️");
  const { hovered, ref } = useHover();
  const theme = useMantineTheme();

  const userToken = useRecoilValue(userTokenState);

  const [personaActive, setPersonaActive] = useState<boolean>(
    props.persona.active
  );

  let total_replied = props.persona.total_replied;
  let total_pos_replied = props.persona.total_pos_replied;
  let total_opened = props.persona.total_opened;
  let total_sent = props.persona.total_sent;

  const userData = useRecoilValue(userDataState);

  const [value, setValue] = useState<string>("");
  const [campaignList, setCampaignList] = useState([]);
  const [campaignName, setCampaignName] = useState("");

  const setEmoji = (emoji: string) => {
    setEmojiState(emoji);
    fetch(`${API_URL}/client/persona/update_emoji`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        persona_id: props.persona.id,
        emoji: emoji,
      }),
    });
  };

  const types: ChannelSection[] = [
    {
      id: 1,
      type: "LinkedIn",
      active: props.persona.linkedin_active,
      icon: <IconBrandLinkedin size="0.925rem" />,
      sends: props.persona.li_sent,
      opens: props.persona.li_opened,
      replies: props.persona.li_replied,
      date: props.persona.created_at,
    },
    {
      id: 2,
      type: "Email",
      active: props.persona.email_active,
      icon: <IconMail size="0.925rem" />,
      sends: props.persona.email_sent,
      opens: props.persona.email_opened,
      replies: props.persona.email_replied,
      date: props.persona.created_at,
    },
    {
      id: 3,
      type: "Not Interested",
      active: false,
      icon: <IconSeeding size="0.925rem" />,
      sends: 0,
      opens: 0,
      replies: 0,
      date: props.persona.created_at,
    },
  ];
  const [popoverOpened, { close: closePopover, open: openPopover }] =
    useDisclosure(false);

  const [channelOpened, { open: channelOpen, close: channelClose }] =
    useDisclosure(false);

  const ChannelModal = () => {
    return (
      <Modal
        opened={channelOpened}
        onClose={channelClose}
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        centered
        size="70rem"
        withCloseButton={false}
        padding={0}
        radius={"md"}
      >
        <Modal.Header
          bg={
            value === "sent"
              ? "#228be6"
              : value === "open"
              ? "#fd4efe"
              : value === "reply"
              ? "orange"
              : value === "demo"
              ? "green"
              : value === "pos_reply"
              ? "purple"
              : ""
          }
        >
          <Flex
            justify={"space-between"}
            w={"100%"}
            align={"center"}
            px={43}
            py={25}
          >
            <Text size={"lg"} color="white">
              Outreach for:{" "}
              <span className=" font-semibold text-[20px]">
                {" "}
                {campaignName
                  ? campaignName
                  : "Coming soon! ⚠️ - This is all mock data..."}
              </span>
            </Text>
            <CloseButton
              aria-label="Close modal"
              onClick={channelClose}
              variant="outline"
              radius="xl"
              style={{
                borderColor: "white",
                color: "white",
              }}
            />
          </Flex>
        </Modal.Header>
        <Modal.Body mt={20} px={20}>
          <Group
            grow
            style={{
              justifyContent: "center",
              gap: "0px",
            }}
          >
            <Box
              w={"100%"}
              onClick={() => {
                setValue("sent");
              }}
            >
              <StatModalDisplay
                color="#228be6"
                icon={<IconSend color={theme.colors.blue[6]} size="20" />}
                label="Sent"
                percentcolor="#e7f5ff"
                total={total_sent ?? 0}
                border={value === "sent" ? "#228be6" : ""}
                percentage={Math.floor(
                  ((total_sent ?? 0) / (total_sent || 1)) * 100
                )}
              />
            </Box>
            <Box
              w={"100%"}
              onClick={() => {
                setValue("open");
              }}
            >
              <StatModalDisplay
                color="#fd4efe"
                icon={<IconChecks color={"#fd4efe"} size="20" />}
                label="Open"
                percentcolor="#ffedff"
                border={value === "open" ? "#fd4efe" : ""}
                total={total_opened ?? 0}
                percentage={Math.floor(
                  ((total_opened ?? 0) / (total_sent || 1)) * 100
                )}
              />
            </Box>
            <Box
              w={"100%"}
              onClick={() => {
                setValue("reply");
              }}
            >
              <StatModalDisplay
                color="#fd7e14"
                icon={<IconMessage color={theme.colors.orange[6]} size="20" />}
                label="Reply"
                percentcolor="#fff5ee"
                border={value === "reply" ? "#fd7e14" : ""}
                total={total_replied ?? 0}
                percentage={Math.floor(
                  ((total_replied ?? 0) / (total_opened || 1)) * 100
                )}
              />
            </Box>
            <Box
              w={"100%"}
              onClick={() => {
                setValue("pos_reply");
              }}
            >
              <StatModalDisplay
                color="#14B887"
                icon={<IconMessage color={theme.colors.teal[6]} size="20" />}
                label="(+)Reply"
                percentcolor="#E8F6F2"
                border={value === "total_pos_replied" ? "#CFF1E7" : ""}
                total={total_pos_replied ?? 0}
                percentage={Math.floor(
                  ((total_pos_replied ?? 0) / (total_replied || 1)) * 100
                )}
              />
            </Box>
            <Box
              w={"100%"}
              onClick={() => {
                setValue("demo");
              }}
            >
              <StatModalDisplay
                color="#40c057"
                icon={<IconCalendar color={theme.colors.green[6]} size="20" />}
                label="Demo"
                percentcolor="#e2f6e7"
                border={value === "demo" ? "#40c057" : ""}
                total={props.persona.total_demo ?? 0}
                percentage={Math.floor(
                  ((props.persona.total_demo ?? 0) / (total_pos_replied || 1)) * 100
                )}
              />
            </Box>
          </Group>
          <ScrollArea h={600} scrollbarSize={6}>
            <Flex direction={"column"} gap={20} my={20}>
              {filteredCampaignList?.map((item: any, index) => {
                return (
                  <Group
                    grow
                    style={{
                      justifyContent: "start",
                      gap: "0px",
                    }}
                    key={index}
                  >
                    <Flex
                      mx={25}
                      w={"100%"}
                      style={{
                        borderRadius: "10px",
                        border: "3px solid #e9ecef",
                      }}
                    >
                      <Box
                        px={15}
                        py={12}
                        style={{
                          borderRight: "3px solid #e9ecef",
                        }}
                        w={"30rem"}
                      >
                        <Flex align={"center"} gap={10} mb={8}>
                          <Avatar src={item.img_url} radius="xl" size="lg" />
                          <Box>
                            <Flex align={"center"} gap={10}>
                              <Text fw={600}>{item.prospect_name}</Text>
                            </Flex>
                            <Flex align={"center"} gap={10} w={"100%"} mt={3}>
                              <Text>ICP Score: </Text>
                              <Badge
                                color={
                                  item.prospect_icp_fit_score == "VERY HIGH"
                                    ? "green"
                                    : item.prospect_icp_fit_score == "HIGH"
                                    ? "blue"
                                    : item.prospect_icp_fit_score == "MEDIUM"
                                    ? "yellow"
                                    : item.prospect_icp_fit_score == "LOW"
                                    ? "orange"
                                    : item.prospect_icp_fit_score == "VERY LOW"
                                    ? "red"
                                    : "gray"
                                }
                                fw={600}
                              >
                                {item.prospect_icp_fit_score}
                              </Badge>
                            </Flex>
                          </Box>
                        </Flex>
                        <Flex gap={6}>
                          <div className="mt-1">
                            <IconMan size={20} color="#817e7e" />
                          </div>
                          <Text color="#817e7e" mt={3}>
                            {campaignName}
                          </Text>
                        </Flex>
                        <Flex gap={6}>
                          <div className="mt-1">
                            <IconBriefcase size={20} color="#817e7e" />
                          </div>
                          <Text color="#817e7e" mt={3}>
                            {item.prospect_title}
                          </Text>
                        </Flex>
                        <Flex gap={6}>
                          <div className="mt-1">
                            <IconBuilding size={20} color="#817e7e" />
                          </div>
                          <Text color="#817e7e" mt={3}>
                            {item.prospect_company}
                          </Text>
                        </Flex>
                      </Box>
                      <Box px={15} py={12} w={"100%"}>
                        <Flex justify={"space-between"}>
                          <Text color="#817e7e" fw={600}>
                            Last Message From Prospect:
                          </Text>
                          <Text color="#817e7e">
                            {item.li_last_message_timestamp}
                          </Text>
                        </Flex>
                        <Box
                          bg={
                            value === "sent"
                              ? "#e7f5ff"
                              : value === "open"
                              ? "#ffedff"
                              : value === "reply"
                              ? "#fff5ee"
                              : value === "pos_reply"
                              ? "#F6E4FF"
                              : "#e2f6e7"
                          }
                          p={20}
                          mt={15}
                          style={{
                            borderRadius: "10px",
                          }}
                        >
                          <Text fw={500}>
                            {item?.li_last_message_from_prospect}
                          </Text>
                        </Box>
                      </Box>
                    </Flex>
                  </Group>
                );
              })}
            </Flex>
          </ScrollArea>
        </Modal.Body>
      </Modal>
    );
  };

  const handleChannelOpen = async (
    type: string,
    id: number,
    campaign_name: string
  ) => {
    setValue(type);
    setCampaignName(campaign_name);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);

    var requestOptions: any = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    await fetch(
      `${API_URL}/analytics/get_campaign_drilldown/${id}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        channelOpen();
        setCampaignList(JSON.parse(result).analytics);
      })
      .catch((error) => console.log("error", error));
  };

  const filteredCampaignList = useMemo(() => {
    if (value === "sent") {
      return campaignList?.filter(
        (item: any) => item.to_status === "SENT_OUTREACH"
      );
    } else if (value === "open") {
      return campaignList?.filter((item: any) => item.to_status === "ACCEPTED");
    } else if (value === "reply") {
      return campaignList?.filter(
        (item: any) => item.to_status === "ACTIVE_CONVO"
      );
    } else if (value === "demo") {
      return campaignList?.filter((item: any) => item.to_status === "DEMO_SET");
    } else if (value === "pos_reply") {
      return campaignList?.filter(
        (item: any) => ["ACTIVE_CONVO_SCHEDULING", "ACTIVE_CONVO_NEXT_STEPS", "ACTIVE_CONVO_QUESTION"].includes(item.to_status)
      );
    }
  }, [value, campaignList]);

  return (
    <Paper radius="md" ref={ref}>
      <ChannelModal />
      <Stack
        spacing={0}
        sx={{
          cursor: "pointer",
        }}
      >
        <Group
          // position="apart"
          sx={(theme) => ({
            backgroundColor: "white", //props.persona.active ? theme.colors.blue[6] : 'white',
            borderRadius: "0.5rem 0.5rem 0 0",
            border: "solid 1px " + theme.colors.gray[2],
            position: "relative",
          })}
          p={"4px"}
          pl="xs"
          pr="xs"
          spacing={0}
        >
          <Group sx={{ flex: "8%" }}>
            <Box
              onClick={() => {
                navigateToPage(
                  navigate,
                  `/contacts`,
                  new URLSearchParams(`?campaign_id=${props.persona.id}`)
                );
              }}
            >
              <Popover
                width={200}
                position="bottom"
                withArrow
                shadow="md"
                opened={popoverOpened}
              >
                <Popover.Target>
                  <Button
                    variant="outline"
                    radius="xl"
                    size="sm"
                    h={55}
                    color="gray"
                    sx={{ border: "solid 1px #f1f1f1" }}
                  >
                    <RingProgress
                      onMouseEnter={openPopover}
                      onMouseLeave={closePopover}
                      size={55}
                      thickness={5}
                      label={
                        <Text size="xs" align="center">
                          {Math.min(
                            100,
                            Math.floor(
                              ((total_sent ?? 0) /
                                (props.persona.total_prospects || 1)) *
                                100
                            )
                          )}
                          %
                        </Text>
                      }
                      variant="animated"
                      sections={[
                        {
                          value: Math.floor(
                            ((total_sent ?? 0) /
                              (props.persona.total_prospects || 1)) *
                              100
                          ),
                          color:
                            Math.round(
                              ((total_sent ?? 0) /
                                (props.persona.total_prospects || 1)) *
                                100
                            ) >= 100
                              ? "green"
                              : "blue",
                        },
                      ]}
                    />
                  </Button>
                </Popover.Target>
                <Popover.Dropdown sx={{ pointerEvents: "none" }} bg={"blue"}>
                  <Flex direction="column">
                    <Box>
                      <Text size={"sm"} color="white">
                        {Math.floor(
                          ((total_sent ?? 0) /
                            (props.persona.total_prospects || 1)) *
                            100
                        )}{" "}
                        % of campaign is pending
                      </Text>
                    </Box>

                    <Divider my={"sm"} />

                    <Box>
                      <Text color="white" size={"sm"} fw={600}>
                        SUMMARY
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Total # Sourced: </Text>{" "}
                          <Text ml="auto">
                            {props.persona.total_prospects || 0}
                          </Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Total # Contacted: </Text>{" "}
                          <Text ml="auto">{total_sent ?? 0}</Text>
                        </Flex>
                      </Text>
                    </Box>

                    <Divider my={"sm"} />

                    <Box>
                      <Text color="white" size={"sm"}>
                        BY STATUS
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Prospected: </Text>{" "}
                          <Text ml="auto">{props.persona.total_prospects}</Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Sending: </Text>{" "}
                          <Text ml="auto">{total_sent}</Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Opened: </Text>{" "}
                          <Text ml="auto">{total_opened}</Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Replies: </Text>{" "}
                          <Text ml="auto">{total_replied}</Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Demo Set: </Text>{" "}
                          <Text ml="auto">{props.persona.total_demo}</Text>
                        </Flex>
                      </Text>

                      <Text color="white" size={"sm"} fw={600}>
                        <Flex>
                          <Text fw="bold">Removed: </Text>{" "}
                          <Text ml="auto">-</Text>
                        </Flex>
                      </Text>
                    </Box>
                  </Flex>
                </Popover.Dropdown>
              </Popover>
            </Box>
          </Group>
          <Divider orientation="vertical" ml="xs" mr="xs" color="white" />
          <Group sx={{ flex: "27%" }}>
            <Flex direction={"column"}>
              <Flex gap={"xs"}>
                <Popover position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Avatar
                      variant="transparent"
                      color={"gray"}
                      radius="xl"
                      size="sm"
                      sx={{
                        backgroundColor: "#ffffff22",
                        marginTop: "auto",
                        marginBottom: "auto",
                      }}
                    >
                      <Text fz="lg">{emoji}</Text>
                    </Avatar>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <EmojiPicker
                      onEmojiClick={(event: any, _: any) => {
                        const emoji = event.emoji;
                        setEmoji(emoji);
                      }}
                    />
                  </Popover.Dropdown>
                </Popover>
                <Box>
                  <Flex>
                    {props.persona.li_sent > 0 && (
                      <ActionIcon
                        variant="subtle"
                        radius="md"
                        color={props.persona.active ? "bliue" : "gray"}
                        onClick={() => {
                          if (props.project == undefined) return;
                          setOpenedProspectId(-1);
                          setCurrentProject(props.project);
                          navigateToPage(
                            navigate,
                            `/setup/linkedin`,
                            new URLSearchParams(
                              `?campaign_id=${props.persona.id}`
                            )
                          );
                        }}
                      >
                        <IconBrandLinkedin
                          size="1rem"
                          color={
                            props.persona.active ? theme.colors.blue[6] : "gray"
                          }
                        />
                      </ActionIcon>
                    )}
                    {props.persona.email_sent > 0 && (
                      <ActionIcon
                        variant="subtle"
                        radius="md"
                        color={props.persona.active ? "yellow" : "gray"}
                        onClick={() => {
                          if (props.project == undefined) return;
                          setOpenedProspectId(-1);
                          setCurrentProject(props.project);
                          navigateToPage(
                            navigate,
                            `/setup/email`,
                            new URLSearchParams(
                              `?campaign_id=${props.persona.id}`
                            )
                          );
                        }}
                      >
                        <IconMail
                          size="1rem"
                          color={
                            props.persona.active
                              ? theme.colors.yellow[6]
                              : "gray"
                          }
                        />
                      </ActionIcon>
                    )}
                  </Flex>

                  <Flex>
                    <Tooltip
                      label={
                        props.persona.name +
                        " - " +
                        +total_sent +
                        " / " +
                        props.persona.total_prospects +
                        " prospects sent"
                      }
                      withArrow
                    >
                      <Text
                        fz={"sm"}
                        c={"gray.7"}
                        fw={700}
                        onClick={() => {
                          if (props.persona.sdr_id != userData?.id) return;

                          if (
                            props.persona.email_sent > props.persona.li_sent
                          ) {
                            window.location.href = `/setup/email?campaign_id=${props.persona.id}`;
                          } else {
                            window.location.href = `/setup/linkedin?campaign_id=${props.persona.id}`;
                          }
                        }}
                      >
                        {props.persona.name}
                      </Text>
                    </Tooltip>
                    {props.persona.sdr_id == userData?.id && (
                      <Box
                        ml="xs"
                        onClick={() => {
                          if (props.project == undefined) return;
                          setOpenedProspectId(-1);
                          setCurrentProject(props.project);
                          window.location.href = `/persona/settings?campaign_id=${props.persona.id}`;
                        }}
                      >
                        <IconPencil size="0.9rem" color="gray" />
                      </Box>
                    )}
                    {
                      <Anchor 
                        href={`/campaigns/${props.persona.id}`}
                        sx={{
                          fontSize: '10px',
                          marginLeft: '8px'
                        }}
                      >
                        🔎
                      </Anchor>
                    }
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Group>
          <Divider orientation="vertical" ml="xs" mr="xs" color="white" />
          <Group sx={{ flex: "6%" }}>
            <Flex>
              <Avatar src={props.persona.sdr_img_url} radius="xl" size="sm" />
              <Text size="xs" fw="450" mt="2px" ml="xs">
                {props.persona.sdr_name.split(" ")[0]}
              </Text>
            </Flex>
          </Group>
          <Divider orientation="vertical" ml="xs" mr="xs" color="white" />
          <Group sx={{ flex: "37%" }}>
            <Box
              w={"15%"}
              onClick={() => {
                handleChannelOpen("sent", props.persona.id, props.persona.name);
              }}
            >
              <StatDisplay
                color="blue"
                icon={<IconSend color={theme.colors.blue[6]} size="0.9rem" />}
                label="Sent"
                total={total_sent ?? 0}
                percentage={Math.floor(
                  ((total_sent ?? 0) / (total_sent || 1)) * 100
                )}
                percentColor="#eaf3ff"
                hoverColor="hover:bg-[#cadef9]"
              />
            </Box>

            <Box
              w={"15%"}
              onClick={() => {
                handleChannelOpen("open", props.persona.id, props.persona.name);
              }}
            >
              <StatDisplay
                color="pink"
                icon={<IconChecks color={theme.colors.pink[6]} size="0.9rem" />}
                label="Open"
                total={total_opened ?? 0}
                percentage={Math.floor(
                  ((total_opened ?? 0) / (total_sent || 1)) * 100
                )}
                percentColor="#ffeeff"
                hoverColor="hover:bg-[#fbdefb]"
              />
            </Box>
            
            <Box
              w={"15%"}
              onClick={() => {
                handleChannelOpen(
                  "reply",
                  props.persona.id,
                  props.persona.name
                );
              }}
            >
              <StatDisplay
                color="orange"
                icon={
                  <IconMessage color={theme.colors.orange[6]} size="0.9rem" />
                }
                label="Reply"
                total={total_replied ?? 0}
                percentage={Math.floor(
                  ((total_replied ?? 0) / (total_opened || 1)) * 100
                )}
                percentColor="#f9e7dc"
                hoverColor="hover:bg-[#f8f3f0]"
              />
            </Box>

            <Box
              w={"15%"}
              onClick={() => {
                handleChannelOpen(
                  "pos_reply",
                  props.persona.id,
                  props.persona.name
                );
              }}
            >
              <StatDisplay
                color="#14B887"
                icon={
                  <IconMessage color={theme.colors.teal[6]} size="0.9rem" />
                }
                label="(+)Reply"
                total={total_pos_replied ?? 0}
                percentage={Math.floor(
                  ((total_pos_replied ?? 0) / (total_replied || 1)) * 100
                )}
                percentColor="#CFF1E7"
                hoverColor="hover:bg-[#E8F6F2]"
              />
            </Box>

            <Box
              w={"15%"}
              onClick={() => {
                handleChannelOpen("demo", props.persona.id, props.persona.name);
              }}
            >
              <StatDisplay
                color="green"
                icon={
                  <IconCalendar color={theme.colors.green[6]} size="0.9rem" />
                }
                label="Demo"
                total={props.persona.total_demo ?? 0}
                percentage={Math.floor(
                  ((props.persona.total_demo ?? 0) / (total_pos_replied || 1)) * 100
                )}
                percentColor="#e2f6e7"
                hoverColor="hover:bg-[#d9f5e0]"
              />
            </Box>
          </Group>
          <Divider orientation="vertical" ml="xs" mr="xs" color="white" />
          <Group
            sx={{
              flex: "11%",
            }}
          >
            <Flex gap={"sm"}>
              {/* <Button
                w={60}
                radius="xl"
                size="xs"
                compact
                mt={"auto"}
                sx={(theme) => ({
                  color: theme.colors.blue[6],
                  backgroundColor: theme.colors.blue[0],
                })}
                onClick={() => {
                  if (props.project == undefined) return;
                  setOpenedProspectId(-1);
                  setCurrentProject(props.project);
                  window.location.href = `/persona/settings?campaign_id=${props.persona.id}`;
                }}
              >
                Edit
              </Button> */}

              <Box>
                <Flex justify={"end"}>
                  <Badge
                    mb={"xs"}
                    size="xs"
                    color={
                      props.persona.active && total_sent > 0
                        ? "blue"
                        : !props.persona.active && total_sent > 0
                        ? "green"
                        : "yellow"
                    }
                  >
                    {props.persona.active && total_sent > 0
                      ? "Active"
                      : !props.persona.active && total_sent > 0
                      ? "Complete"
                      : "Setup"}
                  </Badge>
                  {!!props.persona.smartlead_campaign_id && (
                    <Tooltip label="Synced with SmartLead" withArrow>
                      <Badge size="xs" color={"violet"}>
                        {"Synced"}
                      </Badge>
                    </Tooltip>
                  )}
                </Flex>
                <Tooltip
                  withArrow
                  position="bottom"
                  label={
                    personaActive
                      ? "Click to disable this campaign on settings page"
                      : "Click to enable this campaign on settings page"
                  }
                >
                  <span>
                    <UserStatusToggle
                      projectId={props.persona.id}
                      isActive={personaActive}
                      onChangeUserStatusSuccess={(status: boolean) => {
                        setPersonaActive(status);
                        props.onPersonaActiveStatusUpdate?.(
                          props.persona?.id ?? 0,
                          status
                        );
                      }}
                    />
                  </span>
                </Tooltip>
              </Box>
            </Flex>
          </Group>
          <Box
            sx={{
              position: "absolute",
              right: 15,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <ActionIcon
              color={props.persona?.sdr_id === userData?.id ? "blue" : "gray"}
              sx={{ opacity: props.persona?.sdr_id === userData?.id ? 1 : 0.5 }}
              variant="filled"
              radius="lg"
              onClick={() => {
                if (props.persona?.sdr_id === userData?.id) {
                  toggle();
                } else {
                  showNotification({
                    title: "You cannot edit this campaign",
                    message: "You are not the owner of this campaign",
                    color: "gray",
                    autoClose: 5000,
                  });
                }
              }}
            >
              {opened ? (
                <IconChevronUp size="1.1rem" />
              ) : (
                <IconChevronDown size="1.1rem" />
              )}
            </ActionIcon>
          </Box>
        </Group>
        <Collapse in={opened}>
          {props.viewMode === "node-view" && (
            <Box>
              <CampaignGraph
                personaId={props.persona.id}
                unusedProspects={Math.min(
                  props.project?.num_unused_li_prospects ?? 0
                )}
                sections={types}
                onChannelClick={(sectionType: string) => {
                  if (props.project == undefined) return;
                  setOpenedProspectId(-1);
                  setCurrentProject(props.project);
                  navigateToPage(
                    navigate,
                    `/setup/${sectionType.toLowerCase()}`,
                    new URLSearchParams(`?campaign_id=${props.persona.id}`)
                  );
                }}
              />
            </Box>
          )}
          {props.viewMode === "list-view" && (
            <Box>
              {types.map((section, index) => {
                if (!section.active && props.persona.active) return null;

                return (
                  <Box key={index}>
                    {index > 0 && <Divider mb="xs" />}
                    <PersonCampaignCardSection
                      section={section}
                      onClick={() => {
                        if (props.project == undefined) return;
                        setOpenedProspectId(-1);
                        setCurrentProject(props.project);
                        navigateToPage(
                          navigate,
                          `/setup/${section.type.toLowerCase()}`,
                          new URLSearchParams(
                            `?campaign_id=${props.persona.id}`
                          )
                        );
                      }}
                    />
                  </Box>
                );
              })}
              {props.persona.active && (
                <>
                  <Collapse in={inactiveChannelsOpened}>
                    {types.map((section, index) => {
                      if (section.active) return null;

                      return (
                        <Box key={index}>
                          {index > 0 && <Divider mb="xs" />}
                          <PersonCampaignCardSection
                            section={section}
                            onClick={() => {
                              if (props.project == undefined) return;
                              setOpenedProspectId(-1);
                              setCurrentProject(props.project);
                              navigateToPage(
                                navigate,
                                `/setup/${section.type.toLowerCase()}`,
                                new URLSearchParams(
                                  `?campaign_id=${props.persona.id}`
                                )
                              );
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Collapse>
                  <Divider mb="xs" />
                  <Button
                    w="100%"
                    variant="subtle"
                    size="xs"
                    color="gray"
                    onClick={() =>
                      setInactiveChannelsOpened(!inactiveChannelsOpened)
                    }
                    leftIcon={
                      inactiveChannelsOpened ? (
                        <IconArrowUp size="0.7rem" />
                      ) : (
                        <IconArrowDown size="0.7rem" />
                      )
                    }
                  >
                    {inactiveChannelsOpened ? "Hide" : "Show"}{" "}
                    {types.filter((x) => !x.active).length} Inactive Channel
                    {types.filter((x) => !x.active).length > 1 ? "s" : ""}
                  </Button>
                </>
              )}
            </Box>
          )}
        </Collapse>
      </Stack>
    </Paper>
  );
}

function PersonCampaignCardSection(props: {
  section: ChannelSection;
  onClick?: () => void;
}) {
  const theme = useMantineTheme();
  const [checked, setChecked] = useState(props.section.active);

  return (
    <>
      <Group
        position="apart"
        p="xs"
        spacing={0}
        onClick={props.onClick}
        sx={{
          cursor: "pointer",
        }}
      >
        <Box sx={{ flexBasis: "30%" }}>
          <Group spacing={8}>
            <ActionIcon color="blue" radius="xl" variant="light" size="sm">
              {props.section.icon}
            </ActionIcon>
            <Text>{formatToLabel(props.section.type)}</Text>
          </Group>
        </Box>

        <Box sx={{ flexBasis: "30%" }}>
          <Group>
            <Text fz="xs" color="gray" w="90px">
              <IconSend size="0.8rem" /> Sent:{" "}
              <span style={{ color: "black" }}>{props.section.sends}</span>
            </Text>
            <Text fz="xs" color="gray" w="90px">
              <IconChecks size="0.8rem" /> Opens:{" "}
              <span style={{ color: "black" }}>{props.section.opens}</span>
            </Text>
            <Text fz="xs" color="gray" w="90px">
              <IconMessageCheck size="0.8rem" /> Replies:{" "}
              <span style={{ color: "black" }}>{props.section.replies}</span>
            </Text>
          </Group>
        </Box>
        <Box sx={{ flexBasis: "20%", color: "gray" }}>
          <Text fz="xs" span>
            <IconCalendar size="0.8rem" />{" "}
            {convertDateToShortFormatWithoutTime(new Date(props.section.date))}
          </Text>
        </Box>
        <Box sx={{ flexBasis: "10%" }}>
          <Group>
            <Switch
              checked={checked}
              onChange={(event) => {
                setChecked(event.currentTarget.checked);
              }}
              color="teal"
              size="xs"
              thumbIcon={
                checked ? (
                  <IconCheck
                    size="0.6rem"
                    color={theme.colors.teal[theme.fn.primaryShade()]}
                    stroke={3}
                  />
                ) : (
                  <IconX
                    size="0.6rem"
                    color={theme.colors.red[theme.fn.primaryShade()]}
                    stroke={3}
                  />
                )
              }
            />
            <ActionIcon size="sm" radius="xl">
              <IconEdit size="0.875rem" />
            </ActionIcon>
          </Group>
        </Box>
      </Group>
    </>
  );
}

function StatModalDisplay(props: {
  color: MantineColor;
  icon: ReactNode;
  label: string;
  percentcolor: MantineColor;
  total: number;
  percentage: number;
  border: string;
}) {
  return (
    <Stack
      spacing={0}
      py={10}
      style={{
        border: props.border
          ? `2.8px solid ${props.color}`
          : "2px solid #e9ecef",
        borderRadius: props.border ? "5px" : "0px",
      }}
    >
      <Group spacing={5} sx={{ justifyContent: "center" }}>
        <Tooltip
          label={props.percentage + "% conversion"}
          withArrow
          withinPortal
        >
          <Flex gap={8} align={"center"}>
            {props.icon}
            <Text c="gray.7" fz={"16px"}>
              {props.label}:
            </Text>
            <Text color={props.color} fz={"16px"} fw={500}>
              {props.total.toLocaleString()}
            </Text>
            <Text
              fz={"12px"}
              color={props.color}
              bg={props.percentcolor}
              style={{ borderRadius: "20px" }}
              px={"10px"}
            >
              {/* percentage */}
              {props.percentage}%
            </Text>
          </Flex>
        </Tooltip>
      </Group>
    </Stack>
  );
}

function StatDisplay(props: {
  color: MantineColor;
  icon: ReactNode;
  label: string;
  total: number;
  percentage: number;
  percentColor: MantineColor;
  hoverColor: string;
}) {
  return (
    <div className={`${props.hoverColor} rounded-md px-2 py-1`}>
      <Stack spacing={0}>
        <Flex justify="left" gap="xl">
          <Tooltip
            label={props.percentage + "% conversion"}
            withArrow
            withinPortal
          >
            <Flex align={"center"} gap={4}>
              <Text color={props.color} fz="md" fw={500}>
                {props.total.toLocaleString()}
              </Text>
              <Text
                size="8px"
                color={props.color}
                bg={props.percentColor}
                py={2}
                px={4}
                style={{ borderRadius: "8px" }}
              >
                {/* percentage */}
                {props.percentage}%
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
        <Flex>
          <Box mt="1px">{props.icon}</Box>
          <Text c="gray.7" fz="xs" ml="4px">
            {props.label}
          </Text>
        </Flex>
      </Stack>
    </div>
  );
}

export const PersonCampaignTable = (props: {
  filteredProjects: CampaignPersona[];
  projects?: PersonaOverview[];
  campaignViewMode: "node-view" | "list-view";
  onPersonaActiveStatusUpdate?: (id: number, active: boolean) => void;
  hideHeader?: boolean;
}) => {
  const userToken = useRecoilValue(userTokenState);

  const [sort, setSort] = useState<"asc" | "desc">("desc");
  let tempData = useMemo(() => {
    if (sort === "asc") {
      return props.filteredProjects.sort((a, b) =>
        moment(a.created_at).isAfter(moment(b.created_at)) ? 1 : -1
      );
    } else {
      return props.filteredProjects.sort((a, b) =>
        moment(a.created_at).isAfter(moment(b.created_at)) ? -1 : 1
      );
    }
  }, [sort]);

  if (props.filteredProjects.length === 0) {
    return null;
  }

  let data = tempData;
  if (!data || data.length === 0) {
    data = props.filteredProjects;
  }

  return (
    <>
      <Paper radius="md">
        <Group
          // position="apart"
          sx={(theme) => ({
            backgroundColor: "white", //props.persona.active ? theme.colors.blue[6] : 'white',
            borderRadius: "0.5rem 0.5rem 0 0",
            border: "solid 1px " + theme.colors.gray[2],
            position: "relative",
          })}
          display={props.hideHeader ? "none" : "flex"}
          py={"md"}
          pl="xs"
          pr="xs"
          spacing={0}
        >
          <Group sx={{ flex: "8%" }}>
            <Text fw={600} color="gray.8" fz="sm">
              Contacts
            </Text>
          </Group>
          <Divider orientation="vertical" ml="xs" mr="xs" />
          <Group sx={{ flex: "27%" }} spacing={5} noWrap>
            <Flex
              style={{ cursor: "pointer" }}
              align={"center"}
              gap={"xs"}
              onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
            >
              <Text fw={600} color="gray.8" fz="sm">
                Campaigns
              </Text>

              {/* <IconArrowDown
                size='0.85rem'
                style={{
                  transform: sort === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              /> */}
            </Flex>
          </Group>

          <Divider orientation="vertical" ml="xs" mr="xs" />

          <Group sx={{ flex: "7%" }} grow>
            <Text fw={600} color="gray.8" fz="sm">
              SDR
            </Text>
          </Group>

          <Divider orientation="vertical" ml="xs" mr="xs" />

          <Group sx={{ flex: "37%" }}>
            <Text fw={600} color="gray.8" fz="sm">
              Overall Report
            </Text>
            <Tooltip label="Refresh overall report." withArrow withinPortal>
              <ActionIcon
                ml={-12}
                variant="transparent"
                onClick={async () => {
                  const result = await postSyncSmartleadCampaigns(userToken);
                  if (result.status === "success") {
                    showNotification({
                      title: "Refreshing overall report.",
                      message:
                        "Please wait for a few minutes for changes to take effect. You can refresh this page to see the changes.",
                      color: "blue",
                      autoClose: 5000,
                    });
                  } else {
                    showNotification({
                      title: "Error refreshing overall report.",
                      message: "Please try again later.",
                      color: "red",
                      autoClose: 5000,
                    });
                  }
                }}
              >
                <IconRefresh size="0.8rem" />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider orientation="vertical" ml="xs" mr="xs" />

          <Group sx={{ flex: "11%" }} grow>
            <Text fw={600} color="gray.8" fz="sm">
              Details
            </Text>
          </Group>
        </Group>
      </Paper>
      {data
        .sort((a: any, b: any) => {
          if (a.active && b.active) return -(a.total_sent - b.total_sent);
          if (a.active && !b.active) return -1;
          if (!a.active && b.active) return 1;
          return a.total_sent - b.total_sent;
        })
        .map((persona, index) => (
          <PersonCampaignCard
            key={index}
            persona={persona}
            project={props.projects?.find(
              (project) => project.id == persona.id
            )}
            viewMode={props.campaignViewMode}
            onPersonaActiveStatusUpdate={props.onPersonaActiveStatusUpdate}
          />
        ))}
    </>
  );
};
