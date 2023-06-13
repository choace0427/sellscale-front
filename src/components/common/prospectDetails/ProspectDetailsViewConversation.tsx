import { userDataState, userTokenState } from "@atoms/userAtoms";
import { LinkedInConversationEntry } from "@common/persona/LinkedInConversationEntry";
import {
  Button,
  Flex,
  Card,
  Text,
  Group,
  ScrollArea,
  Textarea,
  Container,
  LoadingOverlay,
  Center,
  Loader,
  Alert,
  Anchor,
  HoverCard,
  Paper,
} from "@mantine/core";
import {
  IconExternalLink,
  IconSend,
  IconRobot,
  IconReload,
  IconAlertCircle,
} from "@tabler/icons";
import displayNotification from "@utils/notificationFlow";

import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { BumpFramework, LinkedInMessage } from "src";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FlexSeparate from "@common/library/FlexSeparate";
import { convertDateToLocalTime } from "@utils/general";
import { sendLinkedInMessage } from "@utils/requests/sendMessage";
import { showNotification } from "@mantine/notifications";
import { getConversation } from "@utils/requests/getConversation";
import _ from "lodash";
import {
  getHotkeyHandler,
  useDebouncedState,
  useHotkeys,
  useTimeout,
} from "@mantine/hooks";
import InstallExtensionCard from "@common/library/InstallExtensionCard";
import SelectBumpInstruction from "@common/bump_instructions/SelectBumpInstruction";
import { API_URL } from "@constants/data";
import { prospectDrawerStatusesState } from "@atoms/prospectAtoms";
import { postBumpGenerateResponse } from "@utils/requests/postBumpGenerateResponse";
import { autoFillAccountResearch } from "@utils/requests/autoFillAccountResearch";
import {
  deleteAutoBumpMessage,
  getAutoBumpMessage,
} from "@utils/requests/autoBumpMessage";
import AutoBumpFrameworkInfo from "./AutoBumpFrameworkInfo";

type ProspectDetailsViewConversationPropsType = {
  conversation_entry_list: LinkedInMessage[];
  ai_enabled: boolean;
  conversation_url: string;
  prospect_id: number;
  persona_id: number;
  overall_status: string;
};

const LOAD_CHUNK_SIZE = 5;

export default function ProspectDetailsViewConversation(
  props: ProspectDetailsViewConversationPropsType
) {
  const queryClient = useQueryClient();
  const [prospectDrawerStatuses, setProspectDrawerStatuses] = useRecoilState(
    prospectDrawerStatusesState
  );
  const [msgCount, setMsgCount] = useState(LOAD_CHUNK_SIZE);
  const userToken = useRecoilValue(userTokenState);
  const [messageDraft, setMessageDraft] = useState("");
  const userData = useRecoilValue(userDataState);
  const [selectedBumpFrameworkId, setBumpFrameworkId] = useState(0);
  const [selectedBumpFrameworkLengthAPI, setBumpFrameworkLengthAPI] = useState(
    "MEDIUM"
  );
  const [accountResearch, setAccountResearch] = useState("");
  const [convoOutOfSync, setConvoOutOfSync] = useState(false);

  const [scrollPosition, onScrollPositionChange] = useDebouncedState(
    { x: 0, y: 50 },
    200
  );

  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [generateMsgLoading, setGenerateMsgLoading] = useState(false);

  const [aiGenerated, setAiGenerated] = useState(false);

  const autoBumpMessage = useRef<any>(null);

  // Use cached convo if voyager isn't connected, else fetch latest
  const messages = useRef(
    userData.li_voyager_connected
      ? []
      : props.conversation_entry_list.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
  );

  // If message was cleared, it's no longer ai generated
  useEffect(() => {
    if (messageDraft.trim().length === 0) {
      setAiGenerated(false);
    }
  }, [messageDraft]);

  const emptyConvo = messages.current.length === 0;

  const msgsViewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    msgsViewport.current?.scrollTo({
      top: msgsViewport.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const fetchAndPopulateConvo = async () => {
    const isFirstLoad = messages.current.length === 0;

    if (isFirstLoad) {
      setLoading(true);
    }

    const result = await getConversation(userToken, props.prospect_id);

    // Fixes bug with li saying there's no convo but we have one cached
    if (
      result.message === "NO_CONVO" &&
      props.conversation_entry_list.length > 0
    ) {
      setConvoOutOfSync(true);
      result.data.data = props.conversation_entry_list;
    }

    // Get and sort messages
    const latestMessages =
      result.status === "success"
        ? (result.data.data as LinkedInMessage[])
        : undefined;
    if (latestMessages) {
      // If we have a new message, scroll to bottom
      if (latestMessages.length > messages.current.length) {
        setTimeout(() => {
          scrollToBottom();
        }, 500);
      }
      messages.current = latestMessages.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // If status changed, update UI
      if (
        result.data.prospect.overall_status !== prospectDrawerStatuses.overall
      ) {
        setProspectDrawerStatuses((prev) => ({
          overall: result.data.prospect.overall_status,
          linkedin: result.data.prospect.linkedin_status,
          email: result.data.prospect.email_status,
        }));
        queryClient.invalidateQueries({
          queryKey: [`query-pipeline-prospects-all`],
        });
        queryClient.invalidateQueries({
          queryKey: [`query-get-channels-prospects`],
        });
      }

      if (
        result.data.prospect.linkedin_status !== prospectDrawerStatuses.linkedin
      ) {
        queryClient.invalidateQueries({
          queryKey: [`query-dash-get-prospects`],
        });
      }

      if (isFirstLoad) {
        // Set if we have an auto bump message generated
        const autoBumpMsgResponse = await getAutoBumpMessage(
          userToken,
          props.prospect_id
        );
        if (autoBumpMsgResponse.status === "success") {
          autoBumpMessage.current = autoBumpMsgResponse.data;
          setMessageDraft(autoBumpMsgResponse.data.message);
          setAiGenerated(true);
        }
      }
    }
    setLoading(false);
    return latestMessages;
  };

  useQuery({
    queryKey: [`query-get-li-convo-${props.prospect_id}`],
    queryFn: async () => {
      return (await fetchAndPopulateConvo()) ?? [];
    },
    enabled: userData.li_voyager_connected,
    refetchInterval: 30 * 1000, // every 30 seconds, refetch
  });

  const sendFollowUp = async () => {
    await displayNotification(
      "asend-woz-message",
      async () => {
        let result: any = await fetch(
          `${API_URL}/li_conversation/prospect/send_woz_message`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${userToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              new_message: messageDraft,
              prospect_id: props.prospect_id,
            }),
          }
        ).then(async (e) => {
          setMessageDraft("");
          return {
            status: "success",
            title: `Success`,
            message: `Status updated.`,
          };
        });
        return result;
      },
      {
        title: `Scheduling message...`,
        message: `Queuing your message to be sent.`,
        color: "teal",
      },
      {
        title: `Scheduled!`,
        message: `Your message will be sent shortly.`,
        color: "teal",
      },
      {
        title: `Error while sending message!`,
        message: `Please contact SellScale engineering team.`,
        color: "red",
      }
    );
  };
  const sendMessage = async () => {
    setMsgLoading(true);
    const msg = messageDraft;
    setMessageDraft("");

    // Delete the auto bump message if it exists
    await deleteAutoBumpMessage(userToken, props.prospect_id);

    const result = await sendLinkedInMessage(
      userToken,
      props.prospect_id,
      msg,
      aiGenerated
    );
    if (result.status === "success") {
      let yourMessage = _.cloneDeep(messages.current)
        .reverse()
        .find((msg) => msg.connection_degree === "You");
      if (yourMessage) {
        yourMessage.message = msg;
        yourMessage.date = new Date().toUTCString();
        yourMessage.ai_generated = false;
        messages.current.push(yourMessage);
      }
    } else {
      showNotification({
        id: "send-linkedin-message-error",
        title: "Error",
        message: "Failed to send message. Please try again later.",
        color: "red",
        autoClose: false,
      });
    }
    setMsgLoading(false);
    setTimeout(() => scrollToBottom());

    // Update convo and UI
    await fetchAndPopulateConvo();

    queryClient.invalidateQueries({
      queryKey: [`query-dash-get-prospects`],
    });
  };

  const generateAIFollowup = async () => {
    setGenerateMsgLoading(true);
    const result = await postBumpGenerateResponse(
      userToken,
      props.prospect_id,
      selectedBumpFrameworkId,
      accountResearch,
      selectedBumpFrameworkLengthAPI
    );

    if (result.status === "success") {
      showNotification({
        id: "generate-ai-followup-success",
        title: "Success",
        message: "Message generated.",
        color: "green",
        autoClose: true,
      });
      setMessageDraft(result.data.message);
      setAiGenerated(true);
    } else {
      showNotification({
        id: "generate-ai-followup-error",
        title: "Error",
        message: "Failed to generate message. Please try again later.",
        color: "red",
        autoClose: false,
      });
      setMessageDraft("");
    }
    setGenerateMsgLoading(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    if (scrollPosition.y < 40 && msgCount < messages.current.length) {
      setMsgCount((prev) => prev + LOAD_CHUNK_SIZE);
      msgsViewport.current?.scrollTo({ top: scrollPosition.y + 500 });
    }
  }, [scrollPosition]);

  if (!userData.li_voyager_connected && emptyConvo) {
    return (
      <div style={{ paddingTop: 10 }}>
        <InstallExtensionCard />
      </div>
    );
  }

  const autoFillBumpFrameworkAccountResearch = (
    bumpFramework: BumpFramework
  ) => {
    fetch(
      `${API_URL}/research/personal_research_points?prospect_id=` +
        props.prospect_id,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    )
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        console.log("GOT HERE");
        console.log(res);
        let research_str = "";
        for (var i = 0; i < res.length; i++) {
          research_str += `- ${res[i].reason}\n`;
        }
        console.log(research_str);
        setAccountResearch(research_str.trim());
      })
      .catch((err) => {
        console.log(err);
      });
  };

  console.log(!emptyConvo);
  console.log(loading);
  console.log(messages.current);
  console.log(autoBumpMessage.current);

  return (
    <>
      <Card shadow="sm" p="lg" radius="md" mt="md" withBorder>
        <FlexSeparate>
          <div>
            <Group position="apart">
              <Text weight={700} size="lg">
                LinkedIn Conversation
              </Text>
            </Group>
            <Group position="apart" mb="xs">
              <Text weight={200} size="xs">
                {`Last Updated: ${convertDateToLocalTime(
                  emptyConvo || !messages.current[0]
                    ? new Date()
                    : new Date(messages.current[0].date)
                )}`}
              </Text>
            </Group>
          </div>
          <Button
            variant="subtle"
            radius="xl"
            size="xs"
            component="a"
            target="_blank"
            disabled={emptyConvo}
            rel="noopener noreferrer"
            href={props.conversation_url}
            rightIcon={<IconExternalLink size={14} />}
          >
            Open LinkedIn
          </Button>
        </FlexSeparate>
        <div style={{ position: "relative" }}>
          {convoOutOfSync && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Out of Sync!"
              color="orange"
              sx={{ borderTopLeftRadius: 15, borderTopRightRadius: 15 }}
            >
              <Text fz="xs" c="orange.1">
                We've detected this conversation might be desynced with
                LinkedIn! Please{" "}
                <Anchor
                  c="orange.4"
                  href={props.conversation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  check LinkedIn
                </Anchor>{" "}
                first before sending a message.
              </Text>
            </Alert>
          )}
          <LoadingOverlay visible={loading} overlayBlur={2} />
          {!emptyConvo || loading ? (
            <ScrollArea
              style={{ height: msgCount > 2 ? 500 : "inherit", maxHeight: 300 }}
              viewportRef={msgsViewport}
              onScrollPositionChange={onScrollPositionChange}
            >
              {_.slice(
                messages.current,
                messages.current.length - msgCount > 0
                  ? messages.current.length - msgCount
                  : 0,
                messages.current.length
              ).map((message, index) => (
                <LinkedInConversationEntry
                  key={`message-${index}`}
                  postedAt={convertDateToLocalTime(new Date(message.date))}
                  body={message.message}
                  name={message.author}
                  image={message.img_url}
                  aiGenerated={message.ai_generated}
                />
              ))}
            </ScrollArea>
          ) : (
            <Center mah={300} h={300}>
              <Text>
                <Text size="md" fs="italic" c="dimmed" ta="center" pb={5}>
                  No conversation <u>yet</u>.
                </Text>
                <Text size="sm" fs="italic" c="dimmed" ta="center">
                  Once they accept your connection request, you will see your
                  conversation here!
                </Text>
              </Text>
            </Center>
          )}
        </div>
        <div>
          <div style={{ position: "relative" }}>
            <LoadingOverlay
              visible={msgLoading || generateMsgLoading}
              overlayBlur={2}
            />
            <Textarea
              mt="sm"
              minRows={2}
              autosize
              placeholder="Write a message..."
              onChange={(e) => {
                setMessageDraft(e.target?.value);
              }}
              value={messageDraft}
              onKeyDown={getHotkeyHandler([
                [
                  "mod+Enter",
                  () => {
                    if (userData.li_voyager_connected) {
                      sendMessage();
                    } else {
                      sendFollowUp();
                    }
                  },
                ],
              ])}
            />
            {autoBumpMessage.current &&
              autoBumpMessage.current.bump_framework.title && (
                <AutoBumpFrameworkInfo
                  bump_title={autoBumpMessage.current.bump_framework.title}
                  bump_description={
                    autoBumpMessage.current.bump_framework.description
                  }
                  bump_length={autoBumpMessage.current.bump_framework.length}
                  account_research_points={
                    autoBumpMessage.current.account_research_points ?? []
                  }
                />
              )}
          </div>
          <Flex>
            <Button
              variant="light"
              mt="sm"
              radius="xl"
              size="xs"
              color="violet"
              component="a"
              mr="sm"
              target="_blank"
              w="70%"
              rel="noopener noreferrer"
              loading={generateMsgLoading}
              rightIcon={<IconRobot size={14} />}
              onClick={() => {
                generateAIFollowup();
              }}
            >
              Generate AI Follow Up
            </Button>
            <Button
              variant="light"
              mt="sm"
              radius="xl"
              size="xs"
              color="blue"
              component="a"
              target="_blank"
              w="30%"
              rel="noopener noreferrer"
              rightIcon={<IconSend size={14} />}
              onClick={() => {
                if (userData.li_voyager_connected) {
                  sendMessage();
                } else {
                  sendFollowUp();
                }
              }}
            >
              {userData.li_voyager_connected ? "Send" : "Schedule"}
            </Button>
          </Flex>
          {!props.ai_enabled && (
            <Paper
              withBorder
              w="100%"
              p="md"
              my="md"
              sx={{
                backgroundColor: "#ffe4e1",
              }}
            >
              <Flex w="100%" align="center" justify="center">
                <Text weight="bold" color="red">
                  AI communication has been turned off for this prospect.
                </Text>
              </Flex>
            </Paper>
          )}
          {props.overall_status && !loading && (
            <SelectBumpInstruction
              client_sdr_id={userData.id}
              prospect_id={props.prospect_id}
              persona_id={props.persona_id}
              overall_status={props.overall_status}
              account_research={accountResearch}
              convo_history={messages.current}
              onBumpFrameworkSelected={async (bumpFramework) => {
                if (bumpFramework) {
                  setBumpFrameworkId(bumpFramework.id);
                  setBumpFrameworkLengthAPI(bumpFramework.bump_length);

                  // Autofill account research
                  await autoFillBumpFrameworkAccountResearch(bumpFramework);
                }
              }}
              onAccountResearchChanged={(research) => {
                setAccountResearch(research);
              }}
            />
          )}
        </div>
      </Card>
      {!userData.li_voyager_connected && (
        <div style={{ paddingTop: 10 }}>
          <InstallExtensionCard />
        </div>
      )}
    </>
  );
}
