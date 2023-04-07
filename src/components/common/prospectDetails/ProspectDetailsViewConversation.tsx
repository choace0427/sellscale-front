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
} from "@mantine/core";
import {
  IconExternalLink,
  IconSend,
  IconRobot,
  IconReload,
} from "@tabler/icons";
import displayNotification from "@utils/notificationFlow";

import { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { LinkedInMessage } from "src/main";
import { useQuery } from "@tanstack/react-query";
import FlexSeparate from "@common/library/FlexSeparate";
import {
  convertDateToLocalTime,
} from "@utils/general";
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

type ProspectDetailsViewConversationPropsType = {
  conversation_entry_list: LinkedInMessage[];
  conversation_url: string;
  prospect_id: number;
  overall_status: string;
};

const LOAD_CHUNK_SIZE = 5;

export default function ProspectDetailsViewConversation(
  props: ProspectDetailsViewConversationPropsType
) {
  const [msgCount, setMsgCount] = useState(LOAD_CHUNK_SIZE);
  const userToken = useRecoilValue(userTokenState);
  const [messageDraft, setMessageDraft] = useState("");
  const userData = useRecoilValue(userDataState);
  const [selectedBumpFrameworkId, setBumpFrameworkId] = useState(0);

  const [scrollPosition, onScrollPositionChange] = useDebouncedState(
    { x: 0, y: 50 },
    200
  );

  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  // Use cached convo if voyager isn't connected, else fetch latest
  const messages = useRef(
    userData.li_voyager_connected
      ? []
      : props.conversation_entry_list.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
  );

  const emptyConvo = messages.current.length === 0;

  const msgsViewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    msgsViewport.current?.scrollTo({
      top: msgsViewport.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const fetchAndPopulateConvo = async () => {
    if (messages.current.length === 0) {
      setLoading(true);
    }
    const result = await getConversation(userToken, props.prospect_id);
    const latestMessages =
      result.status === "success"
        ? (result.extra as LinkedInMessage[])
        : undefined;
    if (latestMessages) {
      if (latestMessages.length > messages.current.length) {
        setTimeout(() => {
          scrollToBottom();
        }, 500);
      }
      messages.current = latestMessages.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
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
          `${process.env.REACT_APP_API_URI}/li_conversation/prospect/send_woz_message`,
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
    const result = await sendLinkedInMessage(userToken, props.prospect_id, msg);
    if (result.status === "success") {
      let yourMessage = _.cloneDeep(messages.current).reverse().find((msg) => msg.connection_degree === "You");
      if (yourMessage) {
        yourMessage.message = msg;
        yourMessage.date = new Date().toUTCString();
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
  };

  const generateAIFollowup = () => {
    setMessageDraft("Loading...");
    fetch(
      `${process.env.REACT_APP_API_URI}/li_conversation/prospect/generate_response`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospect_id: props.prospect_id,
          bump_framework_id: selectedBumpFrameworkId,
        }),
      }
    )
      .then((e) => {
        return e.json();
      })
      .then((resp) => setMessageDraft(resp["message"]));
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

  return (
    <>
      <Card shadow="sm" p="lg" radius="md" mt="md" withBorder>
        <FlexSeparate>
          <div>
            <Group position="apart">
              <Text weight={700} size="lg">
                Linkedin Conversation
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
                />
              ))}
            </ScrollArea>
          ) : (
            <Center mah={300} h={300}>
              <Text>
                <Text size="md" fs="italic" c="dimmed" ta="center" pb={5}>No conversation <u>yet</u>.</Text>
                <Text size="sm" fs="italic" c="dimmed" ta="center">Once they accept your connection request, you will see your conversation here!</Text>
              </Text>
            </Center>
          )}
        </div>
        <div>
          <div style={{ position: "relative" }}>
            <LoadingOverlay visible={msgLoading} overlayBlur={2} />
            <Textarea
              mt="sm"
              minRows={2}
              maxRows={6}
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
              fullWidth
              rel="noopener noreferrer"
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
              fullWidth
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
          <SelectBumpInstruction
            client_sdr_id={userData.id}
            overall_status={props.overall_status}
            onBumpFrameworkSelected={(framework_id) => {
              setBumpFrameworkId(framework_id);
            }}
          />
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
