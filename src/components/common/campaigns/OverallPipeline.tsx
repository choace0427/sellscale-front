import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Grid,
  Progress,
  Select,
  Text,
  ThemeIcon,
  em,
} from "@mantine/core";
import { IconCheck, IconExternalLink } from "@tabler/icons";
import {
  IconBrandTelegram,
  IconMessageCheck,
  IconMessageDots,
  IconMessages,
  IconX,
} from "@tabler/icons-react";
import { FC, useMemo } from "react";
import TodayActivity, { TodayActivityData } from "./OverallPipeline/TodayActivity";
import { useMediaQuery } from "@mantine/hooks";

const blue = "#228be6";
const green = "#40c057";
const grape = "#dc7ef1";
const orange = "#dd7643";

const borderGray = "#E9ECEF";
export interface CampaignAnalyticsData {
  sentOutreach: number;
  accepted: number;
  activeConvos: number;
  demos: number;
}

// const ALL_TYPES = [
//   { value: "ALL", label: "All" },
//   { value: "EMAIL", label: "Email" },
//   { value: "LINKEDIN", label: "LinkedIn" },
// ];

// const ALL_DATES = [
//   { value: "WEEK", label: "This week" },
//   { value: "MONTH", label: "This month" },
//   { value: "QUARTER", label: "This Quarter" },
//   { value: "YEAR", label: "This Year" },
// ];
const todayActivityData = [
  {
    name: "All Activities",
    icon: (
      <ActionIcon color="gray.6">
        <IconMessages size={"1rem"} />
      </ActionIcon>
    ),
    number: 84,
  },
  {
    name: "New Outreach",
    icon: <IconBrandTelegram size={"1rem"} stroke="gray.6" />,
    number: 40,
  },

  {
    name: "Bumps",
    icon: <IconMessageDots size={"1rem"} stroke="gray.6" />,
    number: 2,
  },
  {
    name: "AI Replies",
    icon: <IconMessageCheck size={"1rem"} stroke="gray.6" />,
    number: 1,
  },
];
const OverallPipeline: FC<{ campaignData: CampaignAnalyticsData, aiActivityData: TodayActivityData }> = ({ campaignData, aiActivityData }) => {
  const values = useMemo(
    () => [
      {
        title: "Sent Outreach",
        goalPct: 100,
        value: campaignData.sentOutreach,
        link: "",
        percentage: 100,
        color: grape,
      },
      {
        title: "Opens",
        goalPct: 9,
        value: campaignData.accepted,
        link: "",
        color: blue,
        percentage: !campaignData.sentOutreach
          ? 0
          : parseFloat(((campaignData.accepted / campaignData.sentOutreach) * 100).toFixed(0)),
      },
      {
        title: "Replies",
        goalPct: 0.5,
        value: campaignData.activeConvos,
        link: "",
        color: green,
        percentage: !campaignData.sentOutreach
          ? 0
          : parseFloat(
              ((campaignData.activeConvos / campaignData.sentOutreach) * 100).toFixed(0)
            ),
      },
      {
        title: "Demos",
        goalPct: 0.1,
        value: campaignData.demos,
        link: "",
        percentage: !campaignData.sentOutreach
          ? 0
          : parseFloat(((campaignData.demos / campaignData.sentOutreach) * 100).toFixed(0)),
        color: orange,
      },
    ],
    [campaignData]
  );
  const isMobile = useMediaQuery(`(max-width: ${em(1200)})`);

  return (
    <Flex direction={"column"} w={"100%"}>
      {/* <Flex
        direction={isMobile ? "column" : "row"}
        justify={"space-between"}
        align={isMobile ? "start" : "center"}
        w={"100%"}
        gap={"1rem"}
      >
        <Text fw={500}>Overall Pipeline:</Text>
        <Flex gap={"0.5rem"}>
          <Select data={ALL_TYPES} defaultValue={ALL_TYPES[0].value} />
          <Select data={ALL_DATES} defaultValue={ALL_DATES[0].value} />
        </Flex>
      </Flex> */}

      <Flex
        gap="1rem"
        direction={isMobile ? "column" : "row"}
        w={"100%"}
      >
        <Flex w={isMobile ? "100%" : "70%"}>
          <Grid
            w="100%"
            p={0}
            m={0}
            bg={"white"}
            style={{
              border: `1px solid ${borderGray}`,
              borderRadius: "0.75rem",
            }}
          >
            {values.map((i, idx) => (
              <Grid.Col
                span={6}
                md={3}
                p={0}
                style={{
                  borderRight:
                    idx === values.length - 1 ? "" : `1px solid ${borderGray}`,
                }}
              >
                <Flex h={"100%"} w={"100%"} direction={"column"}>
                  <Flex
                    justify={"center"}
                    align={"center"}
                    py="0.5rem"
                    sx={{
                      borderBottom: `1px solid ${borderGray}`,
                    }}
                  >
                    <Flex justify={"center"} align={"center"}>
                      <Text size={"0.75rem"} color="gray.6" fw={700}>
                        {i.title}:{" "}
                      </Text>

                      <Flex align={"center"} gap={"0.125rem"}>
                        <Text size={"0.75rem"} color={i.color} fw={700}>
                          &nbsp;
                          {i.value}
                        </Text>

                        {/* <a
                          href={i.link}
                          style={{
                            textDecoration: "none",
                            display: "flex",
                            fontSize: "0.75rem",
                            marginBottom: "2px",
                          }}
                        >
                          <IconExternalLink size="0.75rem" color={i.color} />
                        </a> */}
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex
                    direction={"column"}
                    px={"1rem"}
                    py={"0.5rem"}
                    gap={"0.5rem"}
                  >
                    <Flex w={"100%"} justify={"space-between"}>
                      <Box>
                        <Text color="gray.4" fw={500} size={"0.75rem"}>
                          Current %
                        </Text>
                      </Box>
                      <Flex align={"center"}>
                        
                        {i.percentage >= (i.goalPct || 0) ? (
                          <ThemeIcon color={green} size="0.75rem" radius="xl">
                            <IconCheck size="1rem" />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color={"red"} size="0.75rem" radius="xl">
                            <IconX size="1rem" />
                          </ThemeIcon>
                        )}
                        <Text fw={700} color="gray.6" size={"0.75rem"} ml='4px'>
                          {i.percentage || 0}%&nbsp;
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex w={"100%"} justify={"space-between"}>
                      <Box>
                        <Text color="gray.4" fw={500} size={"0.75rem"}>
                          Goal %
                        </Text>
                      </Box>
                      <Flex align={"center"}>
                        <Text fw={700} color="gray.6" size={"0.75rem"}>
                          {i.goalPct}%&nbsp;
                        </Text>
                        {/* {i.percentage >= i.goalPct ? (
                          <ThemeIcon color={green} size="0.75rem" radius="xl">
                            <IconCheck size="1rem" />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color={"red"} size="0.75rem" radius="xl">
                            <IconX size="1rem" />
                          </ThemeIcon>
                        )} */}
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex
                    sx={{
                      borderBottomLeftRadius: idx === 0 ? "0.75rem" : "0",
                      borderBottomRightRadius:
                        idx === values.length - 1 ? "0.75rem" : "0",

                      overflow: "hidden",
                    }}
                  >
                    {/* <Progress
                      radius={0}
                      color={i.color}
                      value={i.percentage}
                      mt="auto"
                      w="100%"
                    /> */}
                  </Flex>
                </Flex>
              </Grid.Col>
            ))}
          </Grid>
        </Flex>

        <Flex
          w={isMobile ? "100%" : "30%"}
          bg={"white"}
          direction={"column"}
          style={{
            border: `1px solid ${borderGray}`,
            borderRadius: 12,
          }}
        >
          <TodayActivity aiActivityData={aiActivityData} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default OverallPipeline;
