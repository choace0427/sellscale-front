import {
  Drawer,
  LoadingOverlay,
  ScrollArea,
  Title,
  Badge,
  Flex,
  useMantineTheme,
  Tabs,
  Divider,
  ActionIcon,
  Paper,
  Group,
  Avatar,
} from "@mantine/core";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  prospectDrawerIdState,
  prospectDrawerOpenState,
  prospectDrawerNotesState,
  prospectChannelState,
  prospectDrawerStatusesState,
} from "@atoms/prospectAtoms";
import { useQuery } from "@tanstack/react-query";
import ProspectDetailsSummary from "../common/prospectDetails/ProspectDetailsSummary";
import ProspectDetailsChangeStatus, {
  channelToIcon,
} from "../common/prospectDetails/ProspectDetailsChangeStatus";
import ProspectDetailsCompany from "../common/prospectDetails/ProspectDetailsCompany";
import ProspectDetailsNotes from "../common/prospectDetails/ProspectDetailsNotes";
import { userTokenState } from "@atoms/userAtoms";
import { formatToLabel, valueToColor } from "@utils/general";
import { logout } from "@auth/core";
import getChannels, { getChannelOptions } from "@utils/requests/getChannels";
import { useEffect, useRef, useState } from "react";
import { Channel, Prospect } from "src";
import FlexSeparate from "@common/library/FlexSeparate";
import { API_URL } from "@constants/data";
import ProspectDetailsRemove from "@common/prospectDetails/ProspectDetailsRemove";
import ProspectDetailsResearch from "@common/prospectDetails/ProspectDetailsResearch";
import { IconDots } from "@tabler/icons";
import ProspectDetailsOptionsMenu from "@common/prospectDetails/ProspectDetailsOptionsMenu";
import {
  dashCardSeeAllDrawerOpenState,
  schedulingDrawerOpenState,
} from "@atoms/dashboardAtoms";
import SchedulingCardContents from "@common/home/dashboard/SchedulingCardContents";
import DashCardContents from "@common/home/dashboard/DashCardContents";

export default function DashCardSeeAllDrawer(props: {
  prospects: Prospect[];
  title: string;
  includeNote?: boolean;
  includeQualified?: boolean;
  includeSchedule?: boolean;
}) {
  const theme = useMantineTheme();

  // This component is only rendered if drawerOpened=true - which isn't helpful for the first render
  // So we use actuallyOpened to control when the drawer opens and delay it by 100ms (for the animation to play)
  const [drawerOpened, setDrawerOpened] = useRecoilState(
    dashCardSeeAllDrawerOpenState
  );
  const [actuallyOpened, setActuallyOpened] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setActuallyOpened(drawerOpened);
    }, 100);
  }, []);

  const userToken = useRecoilValue(userTokenState);

  const prospectsVisible = [];
  const prospectsHidden = [];
  for (const prospect of props.prospects) {
    const latest_msgs =
      prospect.recent_messages.li_convo?.sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      ) ?? [];

    if (latest_msgs.length > 0 && 
        (latest_msgs[0].connection_degree !== "You"
        // Message is over 3 days old
        || (Date.now() - new Date(latest_msgs[0].date).getTime()) > (3 * 24 * 60 * 60 * 1000))) {
      prospectsVisible.push(prospect);
    } else {
      prospectsHidden.push(prospect);
    }
  }

  return (
    <Drawer
      opened={actuallyOpened}
      onClose={() => setDrawerOpened(false)}
      title={
        <Group spacing={10}>
          <Title order={3}>{props.title}</Title>
          {prospectsVisible.length > 1 && (
            <Avatar
              color="violet"
              radius="xl"
              size={24}
              styles={{
                placeholder: {
                  fontSize: 12,
                },
              }}
            >
              {`${prospectsVisible.length}`}
            </Avatar>
          )}
        </Group>
      }
      padding="xl"
      size="lg"
      position="right"
    >
      {props.prospects.length > 0 ? (
        <ScrollArea
          style={{ height: window.innerHeight - 100, overflowY: "hidden" }}
        >
          {prospectsVisible.length > 0 && (
            <Divider
              my="xs"
              label="Open conversation to respond"
              labelPosition="center"
            />
          )}
          {prospectsVisible.map((prospect, i) => (
            <Paper key={i} withBorder p="xs" radius="md" mt={14}>
              <DashCardContents
                prospect={prospect}
                includeNote={props.includeNote}
                includeQualified={props.includeQualified}
                includeSchedule={props.includeSchedule}
              />
            </Paper>
          ))}
          {prospectsHidden.length > 0 && (
            <Divider
              my="xs"
              label="Waiting for response"
              labelPosition="center"
            />
          )}
          {prospectsHidden.map((prospect, i) => (
            <Paper
              key={i}
              withBorder
              p="xs"
              radius="md"
              mt={14}
              sx={{ filter: "opacity(50%)" }}
            >
              <DashCardContents
                prospect={prospect}
                includeNote={props.includeNote}
                includeQualified={props.includeQualified}
                includeSchedule={props.includeSchedule}
                showLastEngagement
              />
            </Paper>
          ))}
        </ScrollArea>
      ) : (
        <LoadingOverlay visible={true} />
      )}
    </Drawer>
  );
}
