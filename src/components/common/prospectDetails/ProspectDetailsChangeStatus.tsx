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
  LoadingOverlay,
  Select,
} from "@mantine/core";
import { useState } from "react";
import {
  IconHeartHandshake,
  IconMailboxOff,
  IconSend,
  IconClick,
  IconMail,
  IconMailForward,
  IconMailOpened,
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
  IconMessageDots,
} from "@tabler/icons";
import { startCase } from "lodash";
import displayNotification from "@utils/notificationFlow";
import { useRecoilState, useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";
import { formatToLabel, splitName, valueToColor } from "@utils/general";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Channel } from "src";
import { getChannelStatusOptions } from "@utils/requests/getChannels";
import { API_URL } from "@constants/data";
import ProspectDemoDateSelector from "./ProspectDemoDateSelector";
import { demosDrawerOpenState, demosDrawerProspectIdState } from '@atoms/dashboardAtoms';
import DemoFeedbackDrawer from '@drawers/DemoFeedbackDrawer';

const linkedinStatusOptions = [
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
    title: "Demo Lost",
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
  {
    title: "Queued for Outreach",
    icon: IconMessageDots,
    color: "cyan",
    status: "QUEUED_FOR_OUTREACH",
  },
];

const emailStatusOptions = [
  {
    title: "Bounced",
    icon: IconMailboxOff,
    color: "gray",
    status: "BOUNCED",
  },
  {
    title: "Not Sent",
    icon: IconMailboxOff,
    color: "gray",
    status: "NOT_SENT",
  },
  {
    title: "Sent Email",
    icon: IconSend,
    color: "orange",
    status: "SENT_OUTREACH",
  },
  {
    title: "Email Opened",
    icon: IconMailOpened,
    color: "yellow",
    status: "EMAIL_OPENED",
  },
  {
    title: "Email Clicked",
    icon: IconClick,
    color: "blue",
    status: "ACCEPTED",
  },
  {
    title: "Email Replied",
    icon: IconMailForward,
    color: "orange",
    status: "ACTIVE_CONVO",
  },
  {
    title: "Sent Email",
    icon: IconSend,
    color: "orange",
    status: "SENT_OUTREACH",
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
    title: "Demo Lost",
    icon: IconFaceIdError,
    color: "red",
    status: "DEMO_LOST",
  },
  {
    title: "Not Interested",
    icon: IconX,
    color: "red",
    status: "NOT_INTERESTED",
  },
];

const dontShowStatuses = [
  "UNKNOWN",
  "PROSPECTED",
  "ACTIVE_CONVO_OBJECTION",
  "ACTIVE_CONVO_NEXT_STEPS",
  "ACTIVE_CONVO_QUAL_NEEDED",
  "ACTIVE_CONVO_QUESTION",
  "ACTIVE_CONVO_SCHEDULING",
  "ACTIVE_CONVO_REVIVAL",
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

export function channelToIcon(channel: Channel, size: number) {
  switch (channel) {
    case "LINKEDIN":
      return <IconBrandLinkedin size={16} />;
    case "EMAIL":
      return <IconMail size={16} />;
    default:
      return <IconQuestionMark size={size} />;
  }
}

export async function updateChannelStatus(
  prospectId: number,
  userToken: string,
  channelType: Channel,
  newStatus: string
) {
  return await fetch(`${API_URL}/prospect/${prospectId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      new_status: newStatus,
      channel_type: channelType,
    }),
  })
    .then(async (r) => {
      if ((r.status + "").startsWith("2")) {
        return {
          status: "success",
          title: `Success`,
          message: `Status updated.`,
        };
      } else {
        return {
          status: "error",
          title: `Error (${r.status})`,
          message: await r.text(),
        };
      }
    })
    .catch((e) => {
      console.error(e);
      return {
        status: "error",
        title: `Error while updating`,
        message: e.message,
      };
    });
}

type ProspectDetailsChangeStatusProps = {
  prospectId: number;
  prospectName: string;
  prospectDemoDate: any;
  channelData: {
    data: any;
    value: Channel;
    currentStatus: string;
  };
};

export default function ProspectDetailsChangeStatus(
  props: ProspectDetailsChangeStatusProps
) {
  const { classes, theme } = useStyles();
  const userToken = useRecoilValue(userTokenState);
  const queryClient = useQueryClient();

  const items = [];

  const [demosDrawerOpened, setDemosDrawerOpened] = useRecoilState(
    demosDrawerOpenState
  );
  const [drawerProspectId, setDrawerProspectId] = useRecoilState(
    demosDrawerProspectIdState
  );

  const { data, isFetching, refetch } = useQuery({
    queryKey: [
      `prospect-next-status-options-${props.prospectId}-${props.channelData.value}`,
    ],
    queryFn: async () => {
      const res = await getChannelStatusOptions(
        props.prospectId,
        userToken,
        props.channelData.value
      );
      if (res.status === "success") {
        return Object.keys(res.data.valid_next_statuses).map(
          (k) => res.data.valid_next_statuses[k].enum_val
        );
      } else {
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  for (const statusValue of (data ? data : []).filter(
    (s: string) =>
      !dontShowStatuses.includes(s) &&
      !(
        props.channelData.currentStatus?.startsWith("ACTIVE_CONVO") &&
        s === "ACTIVE_CONVO"
      )
  )) {
    let status: any = null;
    if (props.channelData.value === "EMAIL") {
      status = emailStatusOptions.find((o) => o.status === statusValue);
    } else if (props.channelData.value === "LINKEDIN") {
      status = linkedinStatusOptions.find((o) => o.status === statusValue);
    }
    if (!status) {
      status = {
        title: startCase(statusValue),
        icon: IconQuestionMark,
        color: "blue",
        status: statusValue,
      };
    }
    items.push(
      <UnstyledButton
        key={status.status}
        className={classes.item}
        onClick={async () => {
          await changeStatus(status);
        }}
        sx={{
          border: "solid 1px #333",
        }}
      >
        <status.icon color={theme.colors[status.color][6]} size={32} />
        <Text size="xs" mt={7}>
          {status.title}
        </Text>
      </UnstyledButton>
    );
  }

  const changeStatus = async (status: { title: string; status: string }) => {
    await displayNotification(
      "change-prospect-status",
      async () => {
        let result = await updateChannelStatus(
          props.prospectId,
          userToken,
          props.channelData.value,
          status?.status as string
        );
        if (result.status === "success") {
          // This will make the queries rerun and update the UI
          queryClient.invalidateQueries({
            queryKey: [`query-prospect-details-${props.prospectId}`],
          });
          queryClient.invalidateQueries({
            queryKey: ["query-pipeline-prospects-all"],
          });
          queryClient.invalidateQueries({
            queryKey: ["query-pipeline-details"],
          });
          queryClient.invalidateQueries({
            queryKey: ["query-get-channels-prospects"],
          });
          refetch();
        }
        return result;
      },
      {
        title: `Updating Status`,
        message: `Working with servers...`,
        color: "teal",
      },
      {
        title: `Updated!`,
        message: `Status is now "${status?.title}"!`,
        color: "teal",
      },
      {
        title: `Error while updating!`,
        message: `Please try again later.`,
        color: "red",
      }
    );
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group position="apart">
        <Text weight={700} size="lg">
          {`${formatToLabel(props.channelData.value)} Status`}
        </Text>
        <Badge
          color={valueToColor(
            theme,
            formatToLabel(props.channelData.currentStatus)
          )}
          variant="light"
        >
          {formatToLabel(props.channelData.currentStatus)}
        </Badge>
      </Group>
      <Text mb="xs" fz="sm" c="dimmed">{`Adjust ${
        splitName(props.prospectName).first
      }'s ${formatToLabel(props.channelData.value)} status.`}</Text>
      <LoadingOverlay visible={isFetching} overlayBlur={2} />
      {
        !props.channelData.currentStatus?.includes('DEMO') ?
        <SimpleGrid cols={3} mt="md">
          {items}
        </SimpleGrid> :
        <Button
            variant="light"
            radius="md"
            fullWidth
            onClick={() => {
              setDrawerProspectId(props.prospectId);
              setDemosDrawerOpened(true);
            }}
          >
            Give Demo Feedback
          </Button>    
      }

      <DemoFeedbackDrawer refetch={refetch} onSubmit={() => {
          queryClient.refetchQueries({
            queryKey: [`query-prospect-details-${props.prospectId}`],
          });
        }}/>

      {props.channelData.currentStatus &&
        props.channelData.currentStatus.includes("DEMO") && (
          <ProspectDemoDateSelector prospectId={props.prospectId} />
        )}
      {props.channelData.currentStatus?.startsWith("ACTIVE_CONVO") && (
        <Select
          mt={15}
          label="Conversation Substatus"
          placeholder="The state of the active conversation"
          clearable
          data={[
            { value: "ACTIVE_CONVO_QUESTION", label: "Question" },
            {
              value: "ACTIVE_CONVO_QUAL_NEEDED",
              label: "Qualifications Needed",
            },
            { value: "ACTIVE_CONVO_OBJECTION", label: "Objection" },
            { value: "ACTIVE_CONVO_SCHEDULING", label: "Scheduling" },
            { value: "ACTIVE_CONVO_NEXT_STEPS", label: "Next Steps" },
            { value: "ACTIVE_CONVO_REVIVAL", label: "Revival (AI Follow Ups Needed)" },
          ]}
          defaultValue={props.channelData.currentStatus}
          onChange={async (value) => {
            if (!value) {
              await changeStatus({
                title: "Active Conversation",
                status: "ACTIVE_CONVO",
              });
            } else {
              await changeStatus({
                title: formatToLabel(value),
                status: value,
              });
            }
          }}
        />
      )}
     
    </Card>
  );
}
