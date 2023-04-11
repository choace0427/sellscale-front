import { userDataState, userTokenState } from "@atoms/userAtoms";
import FlexSeparate from "@common/library/FlexSeparate";
import {
  ActionIcon,
  Badge,
  Text,
  CloseButton,
  Group,
  Paper,
  Title,
  Stack,
  Button,
  Center,
  createStyles,
  Avatar,
  Container,
  LoadingOverlay,
  Loader,
} from "@mantine/core";
import { openContextModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import {
  IconBrandLinkedin,
  IconBriefcase,
  IconCloudDownload,
  IconCookie,
  IconKey,
  IconPassword,
  IconPlugConnected,
  IconRefreshDot,
  IconSocial,
  IconX,
} from "@tabler/icons";
import { clearAuthTokens } from "@utils/requests/clearAuthTokens";
import { useRecoilState, useRecoilValue } from "recoil";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LinkedInAuthOption from "./LinkedInAuthOption";
import { getBrowserExtensionURL } from "@utils/general";
import { useEffect, useState } from "react";
import getLiProfile from "@utils/requests/getLiProfile";
import getNylasClientID from "@utils/requests/getNylasClientID";

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

const REDIRECT_URI = `${window.location.origin}/settings`;

export default function NylasConnectedCard(props: { connected: boolean }) {
  
  const userToken = useRecoilValue(userTokenState);
  const queryClient = useQueryClient();

  const { classes } = useStyles();

  const { data: nylasClientId } = useQuery({
    queryKey: [`nylas-profile-self`],
    queryFn: async () => {
      const result = await getNylasClientID(userToken);
      return result.status === "success" ? result.extra : null;
    },
  });

  return (
    <Paper withBorder m="xs" p="md" radius="md">
      <Stack>
        <div>
          <Group>
            <Title order={3}>Email Integration</Title>
            {props.connected ? (
              <Badge
                size="xl"
                variant="filled"
                color="blue"
                pr={3}
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="blue"
                    radius="xl"
                    variant="transparent"
                    onClick={async () => {
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
                        queryKey: ["query-get-linkedin-connected"],
                      });
                    }}
                  >
                    <IconX size={15} />
                  </ActionIcon>
                }
                styles={{ root: { textTransform: "initial" } }}
              >
                Connected
              </Badge>
            ) : (
              <Badge
                size="xl"
                variant="filled"
                color="red"
                styles={{ root: { textTransform: "initial" } }}
              >
                Not Connected
              </Badge>
            )}
          </Group>
          {props.connected ? (
            <Text fz="sm" pt="xs">
              By connecting your email, SellScale is able to manage, read, and respond to your contact's conversations.
            </Text>
          ) : (
            <>
              <Text fz="sm" pt="xs">
                By connecting your email, SellScale is able to manage, read, and respond to your contact's conversations.
              </Text>
              <Center>
                <Button
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={nylasClientId ? `https://api.nylas.com/oauth/authorize?client_id=${nylasClientId}&redirect_uri=${REDIRECT_URI}&response_type=code` : ''}
                  my={20}
                  variant="outline"
                  size="md"
                  color="pink"
                  rightIcon={<IconPlugConnected size="1rem" />}
                >
                  Connect Email
                </Button>
              </Center>
            </>
          )}
        </div>

        {/* {props.connected && (
          <div>
            {!data && (
              <Center w="100%" h={100}>
                <Stack align="center">
                  <Loader variant="dots" size="xl" />
                  <Text c="dimmed" fz="sm" fs="italic">Fetching LinkedIn details...</Text>
                </Stack>
              </Center>
            )}
            {data && (
              <Group noWrap spacing={10} align="flex-start" pt="xs">
                <Avatar
                  src={
                    data.miniProfile.picture["com.linkedin.common.VectorImage"]
                      .rootUrl +
                    data.miniProfile.picture["com.linkedin.common.VectorImage"]
                      .artifacts[2].fileIdentifyingUrlPathSegment
                  }
                  size={94}
                  radius="md"
                />
                <div>
                  <Title order={3}>
                    {data.miniProfile.firstName} {data.miniProfile.lastName}
                  </Title>

                  <Group noWrap spacing={10} mt={3}>
                    <IconBriefcase
                      stroke={1.5}
                      size={16}
                      className={classes.icon}
                    />
                    <Text size="xs" color="dimmed">
                      {data.miniProfile.occupation}
                    </Text>
                  </Group>

                  <Group noWrap spacing={10} mt={5}>
                    <IconSocial
                      stroke={1.5}
                      size={16}
                      className={classes.icon}
                    />
                    <Text
                      size="xs"
                      color="dimmed"
                      component="a"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.linkedin.com/in/${data.miniProfile.publicIdentifier}`}
                    >
                      linkedin.com/in/{data.miniProfile.publicIdentifier}
                    </Text>
                  </Group>
                </div>
              </Group>
            )}
          </div>
        )} */}
      </Stack>
    </Paper>
  );
}
