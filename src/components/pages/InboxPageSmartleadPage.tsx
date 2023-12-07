import React from "react";
import { openedProspectIdState } from "@atoms/inboxAtoms";
import { userDataState, userTokenState } from "@atoms/userAtoms";
import { blue } from "@common/campaigns/CampaignAnalytics";
import InboxProspectDetails from "@common/inbox/InboxProspectDetails";
import InboxProspectList, {
  ProspectConvoCard,
} from "@common/inbox/InboxProspectList";
import RichTextArea from "@common/library/RichTextArea";
import {
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Text,
  Loader,
  Title,
  Box,
  ScrollArea,
  Collapse,
  Group,
  Accordion,
  Avatar,
  Tabs,
  Badge,
  Input,
  useMantineTheme,
  ActionIcon,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";

import { mainTabState } from "@atoms/inboxAtoms";

import {
  IconArrowBackUp,
  IconArrowDown,
  IconArrowForwardUp,
  IconBackpack,
  IconList,
  IconSearch,
  IconWorld,
} from "@tabler/icons";

// import InboxProspectListFilter, {
//   InboxProspectListFilterState,
//   defaultInboxProspectListFilterState,
// } from "./InboxProspectListFilter";

import InboxProspectListFilter, {
  InboxProspectListFilterState,
  defaultInboxProspectListFilterState,
} from "@common/inbox/InboxProspectListFilter";

import { IconAdjustmentsFilled, IconArrowForward } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { JSONContent } from "@tiptap/react";
import { setPageTitle } from "@utils/documentChange";
import { getSmartleadProspectConvo } from "@utils/requests/getSmartleadProspectConvo";
import { getSmartleadRepliedProspects } from "@utils/requests/getSmartleadRepliedProspects";
import postSmartleadReply from "@utils/requests/postSmartleadReply";
import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import _ from "lodash";

export const INBOX_PAGE_HEIGHT = `100vh`; //`calc(100vh - ${NAV_HEADER_HEIGHT}px)`;

// OH GOD THIS IS A MESS
export default function InboxSmartleadPage(props: {
  setNumberLeads: (number: number) => void;
  all?: boolean;
}) {
  setPageTitle("Inbox");
  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);
  const theme = useMantineTheme();
  const [fetchingProspects, setFetchingProspects] = useState(false);
  const [fetchingConversation, setFetchingConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [prospects, setProspects] = useState([]);
  const [repliedProspects, setRepliedProspects] = useState([]);
  const [snoozedProspects, setSnoozedProspects] = useState([]);
  const [conversation, setConversation] = useState<any>([]);
  const [openedProspectId, setOpenedProspectId] = useRecoilState(
    openedProspectIdState
  );
  const [conversationdetail, setConversationDetail] = useState<boolean[]>([]);

  const [mainTab, setMainTab] = useRecoilState(mainTabState);
  const [sectionTab, setSectionTab] = useState<string | null>("active");

  const [filtersState, setFiltersState] =
    useState<InboxProspectListFilterState>({
      recentlyContacted: "ALL",
      respondedLast: "ALL",
      channel: "SELLSCALE",
    });

  const [searchFilter, setSearchFilter] = useState("");

  // We use this to store the value of the text area
  const [messageDraft, _setMessageDraft] = useState("");
  // We use this to store the raw value of the rich text editor
  const messageDraftRichRaw = useRef<JSONContent | string>();

  // We use this to set the value of the text area (for both rich text and normal text)
  const setMessageDraft = (value: string) => {
    messageDraftRichRaw.current = value;
    _setMessageDraft(value);
  };
  // For email we have to use this ref instead, otherwise the textbox does a weird refocusing.
  const messageDraftEmail = useRef("");

  const triggerGetSmartleadRepliedProspects = async () => {
    setFetchingProspects(true);

    const response = await getSmartleadRepliedProspects(userToken);
    const repliedProspects = response.data.inbox.inbox;
    const snoozedProspects = response.data.inbox.snoozed;

    setRepliedProspects(repliedProspects);
    setSnoozedProspects(snoozedProspects);
    props.setNumberLeads(repliedProspects.length);

    if (mainTab === "inbox") {
      setProspects(repliedProspects);
    } else if (mainTab === "snoozed") {
      setProspects(snoozedProspects);
    } else {
      setProspects(repliedProspects);
    }

    // Sort by ID
    repliedProspects.sort((a: any, b: any) => {
      return a.prospect_id - b.prospect_id;
    });

    setFetchingProspects(false);
  };

  const triggerGetSmartleadProspectConvo = async (prospectID?: any) => {
    setFetchingConversation(true);

    if (!selectedProspect) {
      return;
    }

    const prospectid = prospectID || selectedProspect.prospect_id;
    const smartleadCampaignID = selectedProspect.smartlead_campaign_id;
    const response = await getSmartleadProspectConvo(
      userToken,
      prospectid,
      smartleadCampaignID
    );

    let result = response?.data?.conversation?.reduce(
      (grouped: any, item: any) => {
        if (!grouped[item.stats_id]) {
          grouped[item.stats_id] = [];
        }
        grouped[item.stats_id].push(item);
        return grouped;
      },
      {}
    );

    setConversation(Object.values(result));

    setFetchingConversation(false);
  };

  const triggerPostSmartleadReply = async () => {
    setSendingMessage(true);

    if (!selectedProspect) {
      return;
    }

    const prospectid = selectedProspect.prospect_id;
    const response = await postSmartleadReply(
      userToken,
      prospectid,
      messageDraftEmail.current
    );
    if (response.status !== "success") {
      showNotification({
        title: "Error",
        message: "Failed to send email",
        color: "red",
      });
    } else {
      showNotification({
        title: "Success",
        message:
          "Email sent. It may take a few minutes to appear in your inbox.",
        color: "green",
      });
      messageDraftEmail.current = "";
      messageDraftRichRaw.current = "";
      setMessageDraft("");
    }

    setSendingMessage(false);

    triggerGetSmartleadProspectConvo();
  };

  const handleConvertDate = (date: string) => {
    const timestamp = date;
    const dateObject = new Date(timestamp);
    console.log("date", dateObject);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const formattedDate = dateObject.toLocaleDateString("en-US", options);

    const hours = dateObject.getHours();
    const minutes = dateObject.getMinutes();

    // Convert hours to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12

    // Add leading zero to minutes if needed
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    // Combine the formatted date and time components
    const formattedDateTime = `${formattedDate} - ${formattedHours}:${formattedMinutes}${ampm}`;

    return formattedDateTime;
  };

  useEffect(() => {
    triggerGetSmartleadRepliedProspects();
  }, []);

  return (
    <Grid
      columns={100}
      gutter={0}
      h={INBOX_PAGE_HEIGHT}
      sx={{ overflow: "hidden" }}
    >
      <Grid.Col span={27}>
        <Flex direction="column" w="100%">
          <Tabs
            value={mainTab}
            onTabChange={(value) => {
              setMainTab(value as string);
              setSectionTab(value as string);
              if (value === "inbox") {
                setProspects(repliedProspects);
              } else if (value === "snoozed") {
                setProspects(snoozedProspects);
              }
            }}
            styles={(theme) => ({
              tab: {
                ...theme.fn.focusStyles(),
                fontWeight: 600,
                color: theme.colors.gray[5],
                "&[data-active]": {
                  color: theme.colors.blue[theme.fn.primaryShade()],
                },
                // paddingTop: rem(16),
                // paddingBottom: rem(16),
              },
            })}
          >
            <Tabs.List grow>
              <Tabs.Tab
                value="inbox"
                rightSection={
                  <Badge
                    sx={{ pointerEvents: "none" }}
                    variant="filled"
                    size="xs"
                    color={mainTab === "inbox" ? "blue" : "gray"}
                  >
                    {repliedProspects.length}
                  </Badge>
                }
              >
                Inbox
              </Tabs.Tab>
              <Tabs.Tab
                value="snoozed"
                rightSection={
                  <Badge
                    sx={{ pointerEvents: "none" }}
                    variant="filled"
                    size="xs"
                    color={mainTab === "snoozed" ? "blue" : "gray"}
                  >
                    {snoozedProspects.length}
                  </Badge>
                }
              >
                Snoozed
              </Tabs.Tab>
              <Tabs.Tab
                disabled // REMOVE ME
                value="demos"
                rightSection={
                  <Badge
                    sx={{ pointerEvents: "none" }}
                    variant="filled"
                    size="xs"
                    color={mainTab === "demos" ? "blue" : "gray"}
                  >
                    TBD
                  </Badge>
                }
              >
                Demos
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Group pt={20} pb={10} px={20} m={0} noWrap>
            <Input
              sx={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: theme.colors.gray[2],
                  border: `1px solid ${theme.colors.gray[2]}`,
                  "&:focus-within": {
                    borderColor: theme.colors.gray[4],
                  },
                  "&::placeholder": {
                    color: theme.colors.gray[6],
                    fontWeight: 500,
                  },
                },
              }}
              icon={<IconSearch size="1.0rem" />}
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.currentTarget.value)}
              radius={theme.radius.md}
              placeholder="Search..."
            />
            <ActionIcon
              variant="transparent"
              color={
                _.isEqual(filtersState, defaultInboxProspectListFilterState) ||
                !filtersState
                  ? "gray.6"
                  : "blue.6"
              }
              // onClick={() => setFilterModalOpen(true)}
            >
              <IconAdjustmentsFilled size="1.125rem" />
            </ActionIcon>
          </Group>
          <ScrollArea>
            {prospects.map((prospect: any) => {
              return (
                <Box
                  w="100%"
                  onClick={() => {
                    setSelectedProspect(prospect);
                    setOpenedProspectId(prospect.prospect_id);
                    triggerGetSmartleadProspectConvo(prospect.prospect_id);
                  }}
                  sx={{
                    display: prospect.prospect_name
                      .toLowerCase()
                      .includes(searchFilter.toLowerCase())
                      ? "visible"
                      : "none",
                  }}
                >
                  <ProspectConvoCard
                    id={prospect.prospect_id}
                    name={prospect.prospect_name}
                    title={prospect.prospect_title}
                    img_url={prospect.prospect_img_url}
                    latest_msg={""}
                    latest_msg_time={""}
                    icp_fit={prospect.prospect_icp_fit_score}
                    new_msg_count={0}
                    latest_msg_from_sdr={false}
                    opened={prospect.prospect_id === openedProspectId}
                  />
                </Box>
              );
            })}
          </ScrollArea>
        </Flex>
      </Grid.Col>
      {prospects.length > 0 ? (
        <>
          <Grid.Col span={46}>
            {fetchingConversation ? (
              <Flex
                w="100%"
                h="60vh"
                my="xl"
                align={"center"}
                justify={"center"}
                direction="column"
              >
                <Loader color="purple" />
                <Text color="purple" mt="md">
                  Fetching conversation, please wait...
                </Text>
              </Flex>
            ) : (
              <ScrollArea h="100vh" pb="lg" w="100%">
                {conversation && (
                  <Flex w="100%" direction="column">
                    {conversation.map((item: any, index: any) => (
                      <>
                        {item.map((message: any, index: any) => (
                          <>
                            <Flex
                              p="sm"
                              justify={
                                message.type === "SENT" ? "end" : "start"
                              }
                              w="100%"
                            >
                              {message?.type !== "SENT" ? (
                                <Avatar
                                  src={""}
                                  size={"60px"}
                                  radius={"100%"}
                                />
                              ) : (
                                <></>
                              )}
                              <Flex
                                direction={"column"}
                                align={
                                  message.type === "SENT" ? "end" : "start"
                                }
                                w="100%"
                              >
                                <Card
                                  my="sm"
                                  withBorder
                                  shadow="sm"
                                  radius="md"
                                  key={message.id}
                                  right={"0px"}
                                  style={{
                                    maxWidth: "600px",
                                    minWidth: "100%",
                                  }}
                                >
                                  <Card.Section
                                    bg={
                                      message.type === "SENT"
                                        ? "blue"
                                        : "#dcdbdd"
                                    }
                                    p={14}
                                    px={20}
                                  >
                                    <Flex justify="space-between">
                                      <Text
                                        color={
                                          message.type !== "SENT"
                                            ? "#9a9a9d"
                                            : "#85b3f5"
                                        }
                                        fw={500}
                                      >
                                        To:{" "}
                                        <span
                                          style={{
                                            color:
                                              message.type === "SENT"
                                                ? "white"
                                                : "black",
                                          }}
                                        >
                                          {message.type === "SENT"
                                            ? selectedProspect.prospect_name
                                            : userData.sdr_name}
                                        </span>
                                      </Text>
                                      <Flex gap={30} align="center">
                                        <Text
                                          color={
                                            message.type !== "SENT"
                                              ? "#9a9a9d"
                                              : "#85b3f5"
                                          }
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                          }}
                                        >
                                          <IconArrowBackUp size={20} /> Reply
                                        </Text>
                                        <Text
                                          color={
                                            message.type !== "SENT"
                                              ? "#9a9a9d"
                                              : "#85b3f5"
                                          }
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                          }}
                                        >
                                          <IconArrowForwardUp size={20} />{" "}
                                          Forward
                                        </Text>
                                      </Flex>
                                    </Flex>
                                  </Card.Section>
                                  <Card.Section px={24} py={20}>
                                    <Text color="gray" fw={500}>
                                      Subject:{" "}
                                      <span style={{ color: "black" }}>
                                        {message.subject || "..."}
                                      </span>
                                    </Text>
                                    <Text
                                      fz="sm"
                                      color="black"
                                      mt={14}
                                      style={{
                                        display: "flex",
                                        alignItems: "end",
                                        flexDirection: "column",
                                      }}
                                    >
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(
                                            message.email_body
                                          ),
                                        }}
                                        className={`${
                                          conversationdetail[index]
                                            ? ""
                                            : "line-clamp-4"
                                        }`}
                                      />
                                      <Button
                                        onClick={() => {
                                          const newState = [
                                            ...conversationdetail,
                                          ];
                                          newState[index] = !newState[index];
                                          setConversationDetail(newState);
                                        }}
                                        // rightIcon={<IconArrowDown />}
                                        bg="#dcdbdd"
                                        radius="xl"
                                        mt="sm"
                                        size="xs"
                                      >
                                        {conversationdetail[index]
                                          ? "Less more"
                                          : "Read more"}
                                      </Button>
                                    </Text>
                                  </Card.Section>
                                </Card>
                                <Text
                                  align={
                                    message?.type === "SENT" ? "end" : "start"
                                  }
                                  color="#9a9a9d"
                                  size={12}
                                >
                                  {handleConvertDate(message.time)}
                                </Text>
                              </Flex>
                              {message?.type !== "SENT" ? (
                                <></>
                              ) : (
                                <Avatar
                                  src={""}
                                  size={"60px"}
                                  radius={"100%"}
                                />
                              )}
                            </Flex>
                          </>
                        ))}
                      </>
                    ))}
                    <RichTextArea
                      onChange={(value, rawValue) => {
                        messageDraftRichRaw.current = rawValue;
                        messageDraftEmail.current = value;
                      }}
                      value={messageDraftRichRaw.current}
                      height={200}
                    />
                    <Flex justify={"flex-end"} mt="xs">
                      <Button
                        color="green"
                        onClick={() => {
                          triggerPostSmartleadReply();
                        }}
                      >
                        Reply
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </ScrollArea>
            )}
          </Grid.Col>
          <Grid.Col span={27}>
            <InboxProspectDetails prospects={prospects} snoozeProspectEmail />
          </Grid.Col>
        </>
      ) : (
        <Grid.Col span={73}>
          <Container
            w="100%"
            mt="200px"
            sx={{ justifyContent: "center", textAlign: "center" }}
          >
            <Title
              fw="800"
              sx={{
                fontSize: "120px",
                color: "#e3e3e3",
                margin: "0% auto",
                textAlign: "center",
              }}
            >
              <span>Inbox Zero</span>
            </Title>
            <Text>
              <span style={{ fontSize: "24px" }}>
                You have no prospects in your inbox.
              </span>
            </Text>
            <Text mt="md">Try one of these other tabs instead:</Text>
            <Flex justify={"center"} mt="xs">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/all/inboxes";
                }}
                leftIcon={<IconWorld />}
                color="blue"
                mr="xs"
              >
                Global Inbox
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/all/contacts";
                }}
                leftIcon={<IconWorld />}
                color="grape"
              >
                Contacts
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/all/recent-activity";
                }}
                leftIcon={<IconList />}
                ml="xs"
                color="orange"
              >
                Recent Activity
              </Button>
            </Flex>
          </Container>
        </Grid.Col>
      )}
    </Grid>
  );
}
