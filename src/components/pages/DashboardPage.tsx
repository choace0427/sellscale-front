import { userDataState } from "@atoms/userAtoms";
import NotificationCard from "@common/dashboard/NotificationCard";
import InstallExtensionCard from "@common/library/InstallExtensionCard";
import {
  List,
  ThemeIcon,
  Text,
  Container,
  Stack,
  Flex,
  Title,
  useMantineTheme,
  Paper,
  Group,
  Button,
  Divider,
  Progress,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { openContextModal } from "@mantine/modals";
import {
  IconActivity,
  IconAnalyze,
  IconBellRinging,
  IconCalendarEvent,
  IconChartBar,
  IconInfoSquareRounded,
  IconMessageCircle,
  IconPhoto,
} from "@tabler/icons";
import { setPageTitle } from "@utils/documentChange";
import { useRecoilValue } from "recoil";
import { SCREEN_SIZES } from "../../constants/data";
import PageFrame from "../common/PageFrame";

export default function DashboardPage() {
  setPageTitle("Dashboard");

  const userData = useRecoilValue(userDataState);
  
  return (
    <PageFrame>
      <Flex wrap="wrap">
        <div style={{ flex: "2 0 0" }}>
          <Title order={3} pl={20} pb={5}>
            Daily Updates
          </Title>
          <Flex wrap="wrap">
            <NotificationCard
              icon={<IconBellRinging size={45} />}
              name={"Suggested Follow-Ups"}
              description={"Conversations that might need a bump"}
            />
            <NotificationCard
              icon={<IconMessageCircle size={45} />}
              name={"Unread Messages"}
              description={"From prospects you've been contacting"}
            />
            <NotificationCard
              icon={<IconAnalyze size={45} />}
              name={"Recently Viewed"}
              description={"Check back on your recently viewed prospects"}
            />
            <NotificationCard
              icon={<IconChartBar size={45} />}
              name={"Demo Sets"}
              description={"View your leads"}
            />
          </Flex>
        </div>
        <div style={{ flex: "1 0 0" }}>
          <Title order={3} pl={20} pb={5}>
            Quick Actions
          </Title>
          <Container m="xs" p={0} w={"100%"}>
            <Stack spacing='xs'>
              {!userData.li_voyager_connected && (
                <InstallExtensionCard />
              )}
              <Button
                variant="light"
                color="teal"
                radius="md"
                size="md"
                fullWidth
                onClick={() => {
                  openContextModal({
                    modal: 'uploadProspects',
                    title: (<Title order={3}>Upload Prospects</Title>),
                    innerProps: { mode: 'ADD-ONLY' },
                  });
                }}
              >
                Upload Prospects
              </Button>
              <Button
                variant="light"
                color="teal"
                radius="md"
                size="md"
                fullWidth
                onClick={() => {
                  openContextModal({
                    modal: 'sequenceWriter',
                    title: (<Title order={3}>Sequence Writer</Title>),
                    innerProps: {},
                  });
                }}
              >
                Sequence Writer
              </Button>
            </Stack>
          </Container>
        </div>
      </Flex>
    </PageFrame>
  );
}
