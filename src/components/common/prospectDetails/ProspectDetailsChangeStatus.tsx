import {
  createStyles,
  Card,
  Badge,
  Text,
  Box,
  SimpleGrid,
  UnstyledButton,
  Collapse,
  Button,
  Group,
  Flex,
  SegmentedControl,
  Center,
} from "@mantine/core";
import { useState } from "react";
import {
  IconHeartHandshake,
  IconMail,
  IconNotification,
  IconChartBubble,
  IconCalendar,
  IconX,
  IconQuestionMark,
  IconCalendarEvent,
  IconConfetti,
  IconFaceIdError,
  IconTrash,
  IconBrandLinkedin,
  IconChecks,
} from "@tabler/icons";
import { startCase } from "lodash";

const statusOptions = [
  {
    title: "Accepted Invite",
    icon: IconHeartHandshake,
    color: "yellow",
    status: "ACCEPTED",
  },
  {
    title: "Sent Outreach",
    icon: IconMail,
    color: "orange",
    status: "SENT_OUTREACH",
  },
  {
    title: "Bumped",
    icon: IconNotification,
    color: "orange",
    status: "RESPONDED",
  },
  {
    title: "Active Convo",
    icon: IconChartBubble,
    color: "orange",
    status: "ACTIVE_CONVO",
  },
  {
    title: "Scheduling",
    icon: IconCalendar,
    color: "pink",
    status: "SCHEDULING",
  },
  {
    title: "Demo Set",
    icon: IconCalendarEvent,
    color: "pink",
    status: "DEMO_SET",
  },
  {
    title: "Demo Complete",
    icon: IconConfetti,
    color: "green",
    status: "DEMO_WON",
  },
  {
    title: "Not Interested",
    icon: IconX,
    color: "red",
    status: "NOT_INTERESTED",
  },
  {
    title: "Demo Loss",
    icon: IconFaceIdError,
    color: "red",
    status: "DEMO_LOSS",
  },
  {
    title: "Not Qualified",
    icon: IconTrash,
    color: "red",
    status: "NOT_QUALIFIED",
  },
];
const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.gray[0],
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontWeight: 700,
  },

  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: theme.radius.md,
    height: 90,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.white,
    transition: "box-shadow 150ms ease, transform 100ms ease",

    "&:hover": {
      boxShadow: `${theme.shadows.md} !important`,
      transform: "scale(1.05)",
    },
  },
}));

const channelIconMap = {
  LINKEDIN: <IconBrandLinkedin size={16} />,
  EMAIL: <IconMail size={16} />,
};

type ProspectDetailsChangeStatusProps = {
  currentStatus: string;
  prospectId: number;
  channelOptions: {
    label: string;
    status_options: Record<string, string>;
    value: string;
  }[];
};

export default function ProspectDetailsChangeStatus(
  props: ProspectDetailsChangeStatusProps
) {
  const { classes, theme } = useStyles();
  const [statusService, setStatusService] = useState<string>(
    props.channelOptions[0].value
  );

  const items = [];
  for(const statusValue in props.channelOptions.find((o) => o.value === statusService)?.status_options){
    let status = statusOptions.find((o) => o.status === statusValue);
    if(!status) {
      status = {
        title: startCase(statusValue),
        icon: IconQuestionMark,
        color: "blue",
        status: statusValue,
      };
    }
    items.push(
      <UnstyledButton key={status.status} className={classes.item}>
        <status.icon color={theme.colors[status.color][6]} size={32} />
        <Text size="xs" mt={7}>
          {status.title}
        </Text>
      </UnstyledButton>
    );
  }

  return (
    <Card shadow="sm" p="lg" radius="md" mt="md" withBorder>
      <Group position="apart" mb="xs">
        <Text weight={700} size="lg">
          Status
        </Text>
        <Badge color="pink" variant="light">
          {props.currentStatus.replaceAll("_", " ")}
        </Badge>
      </Group>
      <Flex>
        {props.channelOptions.length > 1 && (
          <SegmentedControl
            color="blue"
            defaultValue={statusService}
            onChange={(value) => {
              setStatusService(value);
            }}
            data={props.channelOptions.map((option) => {
              return {
                value: option.value,
                label: (
                  <Center>
                    {channelIconMap[option.value as "LINKEDIN" | "EMAIL"]}
                    <Box ml={10}>{option.label}</Box>
                  </Center>
                ),
              };
            })}
          />
        )}
      </Flex>
      <SimpleGrid cols={3} mt="md">
        {items}
      </SimpleGrid>
    </Card>
  );
}
