import { useEffect, useRef, useState } from "react";
import { useScrollIntoView } from "@mantine/hooks";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  Flex,
  Input,
  Popover,
  ScrollArea,
  Text,
} from "@mantine/core";
import {
  IconChartBar,
  IconEdit,
  IconMessage,
  IconSend,
  IconTargetArrow,
  IconX,
} from "@tabler/icons";
import moment from "moment";

export default function SellscaleChat() {
  const [chatbot, setChatbot] = useState(false);
  const [mineChat, setMineChat] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([
    {
      mine: "",
      date: "",
      chatbot: "",
      response_date: "",
      loading: false,
    },
  ]);
  const handleEnterKeyPress = (event: any) => {
    if (event.key === "Enter") {
      handleChat();
    }
  };
  const handleClick = () => {
    setChatbot(!chatbot);
  };

  const handleChat = () => {
    setLoading(true);
    const newChat = {
      mine: mineChat,
      date: moment().format("dddd, HH:mm"),
      chatbot: "",
      response_date: "",
      loading: true,
    };

    setChat([...chat, newChat]);

    let response = "";

    setTimeout(() => {
      response =
        "Hi, My name is SellScale chatbot. This is my answer for your question. Please let me know if you have any questions.";

      const updatedChat = {
        ...newChat,
        chatbot: response,
        response_date: moment().format("dddd, HH:mm"),
        loading: false,
      };

      setChat((prevChat) =>
        prevChat.map((c) => (c === newChat ? updatedChat : c))
      );
      setLoading(false);
    }, 3000);

    setMineChat("");
  };

  return (
    <>
      <Popover offset={{ mainAxis: 10, crossAxis: -85 }}>
        <Popover.Target>
          <Button
            color="pink"
            style={{ position: "absolute", bottom: "50px", right: "50px" }}
            radius={"100%"}
            w={"fit-content"}
            h={"fit-content"}
            p={"sm"}
          >
            <IconEdit />
          </Button>
        </Popover.Target>
        <Popover.Dropdown
          sx={{
            backgroundColor: "transparent",
            border: "none",
          }}
        >
          {chatbot ? (
            <>
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                w={380}
                h={580}
                py={"lg"}
                mr={"35px"}
                sx={{
                  border: "1px #228be6 solid !important",
                  padding: "0px !important",
                }}
              >
                <Card.Section
                  sx={{
                    backgroundColor: "#228be6",
                    display: "flex",
                    padding: "14px",
                    justifyContent: "center",
                    color: "white",
                    position: "relative",
                    alignItems: "center",
                    margin: "0px !important",
                  }}
                >
                  <Text w={"100%"} align="center">
                    Sage
                  </Text>
                  <IconX
                    style={{
                      cursor: "pointer",
                      width: "fit-content",
                      position: "absolute",
                      right: 18,
                    }}
                    size={"1.2rem"}
                    onClick={() => {
                      setChatbot(false);
                      setChat([]);
                    }}
                  />
                </Card.Section>
                <Flex direction={"column"} p={"sm"} h={"100%"} gap={"lg"}>
                  <ScrollArea
                    h={"445px"}
                    offsetScrollbars
                    scrollbarSize={8}
                    scrollHideDelay={4000}
                  >
                    <Flex
                      direction={"column"}
                      justify={"flex-start"}
                      w={"100%"}
                    >
                      {chat?.map((item) => {
                        return (
                          <>
                            {item?.mine && (
                              <Flex align={"end"} direction={"column"}>
                                <Box
                                  p={"xs"}
                                  bg={"#22b624"}
                                  sx={{
                                    borderRadius: "8px",
                                    borderBottomRightRadius: "0px",
                                  }}
                                >
                                  <Text color="white" size={"xs"}>
                                    {item?.mine}
                                  </Text>
                                </Box>
                                <Text color="gray" size={"xs"}>
                                  {item?.date}
                                </Text>
                              </Flex>
                            )}

                            {item.loading ? (
                              <Text color="gray" size={"xs"}>
                                loading
                              </Text>
                            ) : (
                              <>
                                {item?.chatbot && (
                                  <Flex mt={"sm"}>
                                    <Avatar size={"md"} radius={"100%"} />
                                    <Flex direction={"column"}>
                                      <Box
                                        p={"xs"}
                                        bg={"gray"}
                                        sx={{ borderRadius: "8px" }}
                                      >
                                        <Text size={"xs"}>{item?.chatbot}</Text>
                                      </Box>
                                      <Text color="gray" size={"xs"}>
                                        {item?.response_date}
                                      </Text>
                                    </Flex>
                                  </Flex>
                                )}
                              </>
                            )}
                          </>
                        );
                      })}
                    </Flex>
                  </ScrollArea>
                  <Flex w={"100%"}>
                    <Input
                      placeholder="Type here..."
                      w={"100%"}
                      disabled={loading}
                      value={mineChat}
                      rightSection={
                        <ActionIcon
                          variant="filled"
                          aria-label="Settings"
                          color="blue"
                          onClick={handleChat}
                        >
                          <IconSend
                            style={{ width: "70%", height: "70%" }}
                            stroke={1.5}
                          />
                        </ActionIcon>
                      }
                      onChange={(e) => setMineChat(e.target.value)}
                      onKeyDown={handleEnterKeyPress}
                    />
                  </Flex>
                </Flex>
              </Card>
            </>
          ) : (
            <>
              <Flex direction={"column"} gap={"md"} align={"end"}>
                <Button
                  color="orange"
                  radius="xl"
                  w={"fit-content"}
                  px={"lg"}
                  leftIcon={<IconMessage size={"1rem"} />}
                  onClick={handleClick}
                >
                  Adjust Messaging
                </Button>
                <Button
                  color="green"
                  radius="xl"
                  w={"fit-content"}
                  px={"lg"}
                  leftIcon={<IconChartBar size={"0.9rem"} />}
                  onClick={handleClick}
                >
                  Understand Analytics
                </Button>
                <Button
                  radius="xl"
                  w={"fit-content"}
                  px={"lg"}
                  leftIcon={<IconTargetArrow size={"0.9rem"} />}
                  onClick={handleClick}
                >
                  Create Campaign
                </Button>
              </Flex>
            </>
          )}
        </Popover.Dropdown>
      </Popover>
    </>
  );
}
