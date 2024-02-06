import { userDataState, userTokenState } from "@atoms/userAtoms";
import {
  Text,
  Paper,
  Title,
  Stack,
  Button,
  createStyles,
  Flex,
  Card,
  Divider,
  Kbd,
  Box,
  Collapse,
  Grid,
  Timeline,
} from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { IconExternalLink, IconChevronDown } from "@tabler/icons";
import { clearAuthTokens } from "@utils/requests/clearAuthTokens";
import { useRecoilValue } from "recoil";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBrowserExtensionURL } from "@utils/general";
import { useEffect, useState } from "react";
import getLiProfile from "@utils/requests/getLiProfile";
import Overview from "./LinkedIn/Overview";
import Information from "./LinkedIn/Information";
import { useOs, useDisclosure } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[5],
  },

  name: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },
}));

export default function LinkedInConnectedCard(props: {
  connected: boolean;
  onConnect?: () => void;
}) {
  const usingFirefox = navigator.userAgent.search("Firefox") >= 0;
  const userToken = useRecoilValue(userTokenState);
  const queryClient = useQueryClient();
  const userData = useRecoilValue(userDataState);

  const os = useOs();

  const { data: extensionInstalled } = useQuery({
    queryKey: [`query-check-extension-installed`],
    queryFn: async () => {
      return document.getElementsByClassName("extension-container").length > 0;
    },
    refetchInterval: 500,
  });
  const [opened, { toggle }] = useDisclosure(true);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [liProfile, setLiProfile] = useState<null | any>(null);

  const { classes } = useStyles();

  const { data, isFetching, refetch } = useQuery({
    queryKey: [`li-profile-self`],
    queryFn: async () => {
      const result = await getLiProfile(userToken);
      return result.status === "success" ? result.data : null;
    },
  });

  useEffect(() => {
    if (props.connected && props.onConnect) {
      props.onConnect();
    }
  }, [props.connected]);

  return (
    <Card>
      <Title order={3} mb={"0.25rem"} color="gray.6">
        LinkedIn Integration
      </Title>

      <Divider my={"sm"} />
      <Paper withBorder p="md" radius="md" bg={"gray.0"}>
        <Stack>
          <>
            {props.connected ? (
              <>
                <Overview />
                <Information />

                <Flex direction="column" px="md" pb="md" maw="100%">
                  <Divider mb="md" />
                  <Card withBorder shadow="sm" w="100%">
                    <Title order={4}>Disconnect LinkedIn</Title>

                    <Flex justify="space-between" align="center">
                      <Flex direction="column" maw="500px">
                        <Text fw="light" fz="sm" lh="1.2rem" mt="2px">
                          Disconnecting your LinkedIn will prevent SellScale
                          from sending outbound, reading messages, and
                          responding to conversations.
                        </Text>
                      </Flex>
                      <Flex>
                        <Button
                          color="red"
                          onClick={() => {
                            openConfirmModal({
                              title: (
                                <Title order={3}>
                                  Disconnect LinkedIn - {userData.sdr_name}
                                </Title>
                              ),
                              children: (
                                <>
                                  <Text fs="italic">
                                    You will need to reconnect your LinkedIn to
                                    continue using SellScale for LinkedIn
                                    outbound.
                                  </Text>
                                </>
                              ),
                              labels: {
                                confirm: "Deactivate",
                                cancel: "Cancel",
                              },
                              cancelProps: { color: "red", variant: "outline" },
                              confirmProps: { color: "red" },
                              onCancel: () => {},
                              onConfirm: async () => {
                                const result = await clearAuthTokens(userToken);
                                if (result.status === "success") {
                                  showNotification({
                                    id: "linkedin-disconnect-success",
                                    title: "Success",
                                    message:
                                      "You have successfully disconnected your LinkedIn account.",
                                    color: "blue",
                                    autoClose: 5000,
                                  });
                                } else {
                                  showNotification({
                                    id: "linkedin-disconnect-failure",
                                    title: "Failure",
                                    message:
                                      "There was an error disconnecting your LinkedIn account. Please contact an admin.",
                                    color: "red",
                                    autoClose: false,
                                  });
                                }
                                queryClient.invalidateQueries({
                                  queryKey: ["query-get-accounts-connected"],
                                });
                              },
                            });
                          }}
                        >
                          Deactivate
                        </Button>
                      </Flex>
                    </Flex>
                  </Card>
                </Flex>
              </>
            ) : (
              <>
                <Flex
                  justify={"space-between"}
                  align={"center"}
                  wrap={"wrap"}
                  gap={4}
                >
                  <Box>
                    <Flex align={"center"} wrap={"wrap"} gap={4}>
                      <Text fw={600}>Connect SellScale with Linkedin</Text>
                    </Flex>
                    <Text c={"gray.6"} fz={"0.75rem"} fw={600}>
                      By being connected to LinkedIn, SellScale is able to send
                      connections, read, and respond to your conversations.
                    </Text>
                  </Box>
                  <Divider my={"sm"} />
                </Flex>
                <Divider my={"sm"} />
                <Card withBorder>
                  <Flex align={"center"} justify={"space-between"}>
                    <Flex>
                      <Text fw={600}>Install the Sellscale Extensions.</Text>
                    </Flex>
                    <Button
                      className={"bg-black"}
                      variant={"filled"}
                      color={""}
                      component="a"
                      target="_blank"
                      radius={"md"}
                      rel="noopener noreferrer"
                      rightIcon={<IconExternalLink />}
                      onClick={() => {
                        window.open(
                          getBrowserExtensionURL(usingFirefox),
                          "_blank"
                        );
                      }}
                    >
                      {extensionInstalled ? "Installed" : "Install"} Extension
                    </Button>
                  </Flex>
                </Card>
              </>
            )}
          </>
        </Stack>
      </Paper>

      <Paper withBorder mt={"md"} p="md" radius="md" bg={"gray.0"}>
        <Flex align={"center"} wrap={"wrap"} gap={4} justify={"space-between"}>
          <Text fw={600}>Step to Connect Linkedin</Text>
          <Button variant="subtle" onClick={toggle} compact color="gray">
            <IconChevronDown
              style={{
                transitionDuration: "150ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                transform: opened ? `rotate(${opened ? 180 : 0}deg)` : "none",
              }}
            />
          </Button>
        </Flex>

        <Divider my={"sm"} />

        <Collapse in={opened} mt={"md"}>
          <Grid>
            <Grid.Col span={6}>
              <iframe
                width="100%"
                height="300"
                src="https://www.youtube.com/embed/m95s5HlfvWg?si=JCStgJrTyO7q3dpw"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Timeline active={3} bulletSize={24} lineWidth={2}>
                <Timeline.Item
                  bullet={<Text>1</Text>}
                  title={
                    <Text fz="sm" td={extensionInstalled ? "line-through" : ""}>
                      Install the SellScale browser extension.
                    </Text>
                  }
                />

                <Timeline.Item
                  bullet={<Text>2</Text>}
                  title={
                    <Box>
                      <Text fz="sm">
                        Open the extension popup by either using the Chrome
                        extensions dropdown (via the puzzle piece icon 🧩 in the
                        top right) or with the hotkey:{" "}
                      </Text>
                      <Text mt={"sm"}>
                        <Kbd>
                          {os === "undetermined" || os === "macos"
                            ? "⌘"
                            : "Ctrl"}
                        </Kbd>{" "}
                        + <Kbd>Shift</Kbd> + <Kbd>S</Kbd>.
                      </Text>
                    </Box>
                  }
                />

                <Timeline.Item
                  title={
                    <Text fz="sm">
                      {`In the popup, click the "Connect Linkedin" button`}
                    </Text>
                  }
                  bullet={<Text>3</Text>}
                />
              </Timeline>
            </Grid.Col>
          </Grid>
        </Collapse>
      </Paper>
    </Card>
  );
}
