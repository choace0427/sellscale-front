import { userTokenState } from "@atoms/userAtoms";
import { createStyles, Avatar, Text, Group, useMantineTheme, Badge, Flex, Switch, LoadingOverlay } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconPhoneCall,
  IconAt,
  IconBriefcase,
  IconMail,
  IconSocial,
  IconBuildingStore,
} from "@tabler/icons";
import { nameToInitials, valueToColor } from "@utils/general";
import { patchProspectAIEnabled } from "@utils/requests/patchProspectAIEnabled";
import { useState } from "react";
import { useRecoilValue } from "recoil";

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

type ProspectDetailsSummaryProps = {
  fullName: string;
  prospectID: number;
  aiEnabled: boolean;
  refetch: () => void;
  title: string | null;
  email: string | null;
  linkedin: string | null;
  profilePic: string | null;
  companyName: string | null;
  companyURL?: string;
  persona?: string;
};

export default function ProspectDetailsSummary(
  props: ProspectDetailsSummaryProps
) {
  const theme = useMantineTheme();
  const userToken = useRecoilValue(userTokenState);
  const { classes } = useStyles();
  const companyURL =
    props.companyName && !props.companyURL
      ? `https://www.google.com/search?q=${encodeURIComponent(
        props.companyName
      )}`
      : props.companyURL;

  const [aiEnabled, setAIEnabled] = useState<boolean>(props.aiEnabled)
  const [loading, setLoading] = useState<boolean>(false)

  const triggerAIEnableToggle = async () => {
    setLoading(true)

    const result = await patchProspectAIEnabled(userToken, props.prospectID)

    if (result.status === 'success') {
      showNotification({
        title: "Success",
        message: "AI Enabled status updated.",
        color: "green",
        autoClose: 3000,
      })
    } else {
      showNotification({
        title: "Error",
        message: "Something went wrong. Please try again later.",
        color: "red",
        autoClose: 5000,
      })
    }

    setLoading(false)
    props.refetch()
  }

  return (
    <Group noWrap align="flex-start" pb="xs" w='100%'>
      <LoadingOverlay visible={loading} />
      <Avatar
        src={props.profilePic}
        alt={props.fullName}
        color={valueToColor(theme, props.fullName)}
        radius="md"
        size={94}
      >
        {nameToInitials(props.fullName)}
      </Avatar>
      <Flex direction='column' w='100%'>
        <Flex w='100%' justify='space-between' pr='xs'>
          <Badge
            mb='4px'
            p='xs'
            variant='outline'
            radius='sm'
            size='xs'
            color={valueToColor(theme, props.persona || "Persona Unassigned")}
          >
            {props.persona || "Persona Unassigned"}
          </Badge>
          <Switch
            label='AI enabled 🤖'
            labelPosition='right'
            size='sm'
            checked={aiEnabled}
            onChange={() => {
              setAIEnabled(!aiEnabled)
              triggerAIEnableToggle()
            }}
          />
        </Flex>
        <Group noWrap spacing={10} mt={3}>
          <IconBriefcase stroke={1.5} size={16} className={classes.icon} />
          <Text size="xs" color="dimmed">
            {props.title}
          </Text>
        </Group>

        {props.email && (
          <Group noWrap spacing={10} mt={5}>
            <IconMail stroke={1.5} size={16} className={classes.icon} />
            <Text
              size="xs"
              color="dimmed"
              component="a"
              href={`mailto:${props.email}`}
            >
              {props.email}
            </Text>
          </Group>
        )}

        {props.linkedin && (
          <Group noWrap spacing={10} mt={5}>
            <IconSocial stroke={1.5} size={16} className={classes.icon} />
            <Text
              size="xs"
              color="dimmed"
              component="a"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://${props.linkedin}`}
            >
              {props.linkedin}
            </Text>
          </Group>
        )}

        {props.companyName && (
          <Group noWrap spacing={10} mt={5}>
            <IconBuildingStore
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
              href={companyURL}
            >
              {props.companyName}
            </Text>
          </Group>
        )}
      </Flex>
    </Group>
  );
}
