import Cards from "@common/analytics/CumulativeGrowth/Cards";
import CumulativeGrowthChart from "@common/analytics/CumulativeGrowth/CumulativeGrowthChart";
import FeedbackTable from "@common/analytics/FeedbackTable/FeedbackTable";
import Message from "@common/analytics/Message";
import { OverallPerformanceChart } from "@common/analytics/OverallPerformanceChart";
import OverallPerformanceProgress from "@common/analytics/OverallPerformanceProgress/OverallPerformanceProgress";
import Volume from "@common/analytics/Volume";
import ProspectFit from "@common/analytics/ProspectFit";
import PipelineSection from "@common/home/PipelineSection";
import {
  Box,
  Divider,
  Flex,
  Paper,
  Tabs,
  Title,
  Text,
  Button,
  rem,
} from "@mantine/core";
import { IconCalendar } from "@tabler/icons";
import { useState } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { userTokenState } from '@atoms/userAtoms';

export const borderGray = "#E9ECEF";

const AnalyticPage = () => {
  const [period] = useState("Nov 01 - Nov 12");
  const userToken = useRecoilValue(userTokenState)
  return (
    <div>
      <Title>Analytics</Title>

      <Tabs
        defaultValue="compare_campaigns"
        px={20}
        py={10}
        styles={(theme) => ({
          tab: {
            ...theme.fn.focusStyles(),

            "&[data-active]": {
              borderColor: theme.colors.blue[theme.fn.primaryShade()],
              color: theme.colors.blue[theme.fn.primaryShade()],
            },
          },
        })}
      >
        <Tabs.List>
          <Tabs.Tab value="compare_campaigns">Compare Campaigns</Tabs.Tab>
          <Tabs.Tab value="overall_pipeline">Overall Pipeline</Tabs.Tab>
          <Tabs.Tab value="prospect_fit">Prospect Fit</Tabs.Tab>
          <Tabs.Tab value="volume">Volume</Tabs.Tab>
          <Tabs.Tab value="message">Message</Tabs.Tab>

          <Flex
            gap={"0.5rem"}
            align={"center"}
            mb={"xs"}
            sx={{ flex: "auto" }}
            justify={{ md: "flex-end" }}
          >
            <Text fz={"0.75rem"} color="gray.6">
              Date Period:
            </Text>
            <Button
              variant={"outline"}
              size="xs"
              px={"1.5rem"}
              sx={{
                borderRadius: 999,
              }}
              leftIcon={<IconCalendar size={"1rem"} />}
            >
              Last 12 Days:{" "}
              <Text ml={"0.5rem"} color="gray.6">
                {period}
              </Text>
            </Button>
          </Flex>
        </Tabs.List>

        <Tabs.Panel value="compare_campaigns">
          <Box h={"80vh"}>
            <iframe 
              src={"https://sellscale.retool.com/embedded/public/a4e28dc1-b9bf-4df4-99a1-0f2c47dcd9d5#authToken=" + userToken}
              width="100%"
              height="100%"
              allowFullScreen
              style={{
                border: "none",
                borderRadius: rem(8),
                overflow: "hidden",
              }}
            />
          </Box>

        </Tabs.Panel>

        <Tabs.Panel value="overall_pipeline">
          <Paper radius={"lg"} mt="md">
            <Flex>
              <Box
                w={"50%"}
                style={{
                  borderRightWidth: "1px",
                  borderRightStyle: "dashed",
                  borderRightColor: borderGray,
                }}
              >
                <Box p={"lg"}>
                  <Title order={2}>Overall Performance - Coming soon ⚠️</Title>
                  <Text color="gray.6" size={"sm"} fw={700} mt={"xs"}>
                    Random text
                  </Text>
                </Box>
                <OverallPerformanceChart
                  data={{
                    sentOutreach: 12,
                    accepted: 11,
                    activeConvos: 35,
                    demos: 15,
                  }}
                />
              </Box>
              <Flex w={"50%"} p={"1rem"} align={"center"}>
                <OverallPerformanceProgress />
              </Flex>
            </Flex>
          </Paper>

          <Paper radius={"lg"} mt="md" p={"lg"}>
            <FeedbackTable />
          </Paper>
          <Divider
            variant="solid"
            my="lg"
            label={
              <Text fw={700} size={"lg"}>
                Cumulatative Growth - Coming soon ⚠️
              </Text>
            }
            labelPosition="center"
          />
          <Paper p={"lg"}>
            <Flex gap={"1rem"}>
              <Cards />
              <CumulativeGrowthChart />
            </Flex>
          </Paper>

          <Paper mt={"lg"} p={"lg"} radius={"lg"}>
            <PipelineSection />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="volume">
          <Volume />
        </Tabs.Panel>

        <Tabs.Panel value="prospect_fit">
          <ProspectFit />
        </Tabs.Panel>

        <Tabs.Panel value="sdr_action_items">sdr_action_items</Tabs.Panel>
        <Tabs.Panel value="message">
          <Message />
        </Tabs.Panel>
      </Tabs>
      
    </div>
  );
};

export default AnalyticPage;
