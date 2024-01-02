import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Flex,
  Grid,
  HoverCard,
  Loader,
  Paper,
  Select,
  Slider,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useRecoilState, useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";

import { getBumpFrameworks } from "@utils/requests/getBumpFrameworks";
import { openContextModal } from "@mantine/modals";
import { prospectDrawerStatusesState } from "@atoms/prospectAtoms";
import { BumpFramework, LinkedInMessage } from "src";
import { autoSelectBumpFramework } from "@utils/requests/autoSelectBumpFramework";
import TextWithNewline from "@common/library/TextWithNewlines";

type PropsType = {
  client_sdr_id: number;
  prospect_id: number;
  persona_id: number;
  overall_status: string;
  account_research: string;
  convo_history: LinkedInMessage[];
  onBumpFrameworkSelected: (bumpFramework: BumpFramework | undefined, length?: string) => void;
  onAccountResearchChanged: (accountResearch: string) => void;
  manualBumpFramework?: BumpFramework;
};

const bumpFrameworkLengthMarks = [
  { value: 0, label: "Short", api_label: "SHORT" },
  { value: 50, label: "Medium", api_label: "MEDIUM" },
  { value: 100, label: "Long", api_label: "LONG" },
];

export default function SelectBumpInstruction(props: PropsType) {
  const userToken = useRecoilValue(userTokenState);
  const [prospectDrawerStatuses, setProspectDrawerStatuses] = useRecoilState(
    prospectDrawerStatusesState
  );

  const [bumpLengthValue, setBumpLengthValue] = useState(50);

  const [bumpFrameworks, setBumpFrameworks] = useState<BumpFramework[]>([]);
  const [
    selectedBumpFramework,
    setSelectedBumpFramework,
  ] = useState<BumpFramework>();
  const [loadingBumpFrameworks, setLoadingBumpFrameworks] = useState(false);

  const triggerGetBumpFrameworks = async () => {
    setLoadingBumpFrameworks(true);

    // This needs changing in the future to be more rigid
    let substatuses: string[] = [];
    if (prospectDrawerStatuses.linkedin?.includes("ACTIVE_CONVO_")) {
      substatuses = [prospectDrawerStatuses.linkedin];
    }

    const result = await getBumpFrameworks(
      userToken,
      [prospectDrawerStatuses.overall],
      substatuses,
      [],
      [],
      undefined,
      undefined,
      undefined,
      props.persona_id
    );

    setBumpFrameworks(result.data.bump_frameworks);
    /* Select default framework
    for (const bumpFramework of result.data as BumpFramework[]) {
      if (bumpFramework.default) {
        let length = bumpFrameworkLengthMarks.find(
          (marks) => marks.api_label === bumpFramework.bump_length
        )?.value;
        if (length == null) {
          length = 50;
        }

        setSelectedBumpFramework(bumpFramework);
        setBumpLengthValue(length);
        props.onBumpFrameworkSelected(bumpFramework);
        break;
      }
    }
    */

    // If manual bump framework is provided, don't auto select
    if (props.manualBumpFramework) {
      setLoadingBumpFrameworks(false);
      return
    }

    // Select default framework based on convo history
    const response = await autoSelectBumpFramework(
      userToken,
      props.convo_history.slice(-5).map((msg) => ({
        connection_degree: msg.connection_degree,
        message: msg.message,
      })),
      result.data?.bump_frameworks.map((bumpFramework: any) => bumpFramework.id)
    );

    if (response.status === "success") {
      const bumpFramework = result.data.bump_frameworks[response.data];

      let length = bumpFrameworkLengthMarks.find(
        (marks) => marks.api_label === bumpFramework.bump_length
      )?.value;
      if (length == null) {
        length = 50;
      }

      setSelectedBumpFramework(bumpFramework);
      setBumpLengthValue(length);
      props.onBumpFrameworkSelected(bumpFramework);
    }

    setLoadingBumpFrameworks(false);
  };

  useEffect(() => {
    triggerGetBumpFrameworks();
  }, [prospectDrawerStatuses]);

  useEffect(() => {
    if (props.manualBumpFramework) {
      setSelectedBumpFramework(props.manualBumpFramework);
    }
  }, [])

  return (
    <Card withBorder mt="sm">
      {loadingBumpFrameworks && (
        <Flex direction="row" mb="md">
          <Alert
            title="AI predicting, wait a moment!"
            color="grape"
            radius="xs"
          >
            SellScale AI is automatically selecting the best bump framework and
            account research to reply based on this conversation.
          </Alert>{" "}
          <Loader color="grape" size="xl" ml="xs"></Loader>
        </Flex>
      )}
      <Text fw="bold">Bump Framework</Text>
      <Text fz="xs">
        Bump Frameworks are used to train the AI on how to respond to specific
        messages. The default bump framework is used, but you can manage all
        bump frameworks.
      </Text>
      <Button
        color='green'
        >
        Save
      </Button>
      <Grid>
        <Grid.Col span={8}>
          <Select
            mt="md"
            value={selectedBumpFramework ? selectedBumpFramework.id + "" : "-1"}
            data={bumpFrameworks.map((x: any) => {
              return {
                value: x.id + "",
                label: (x.default ? "🟢 " : "⚪️ ") + x.title,
              };
            })}
            placeholder={"Select Bump Frameworks"}
            onChange={(value: any) => {
              let bumpFramework = bumpFrameworks.find((x) => x.id == value);
              let length = bumpFrameworkLengthMarks.find(
                (marks) => marks.api_label === bumpFramework?.bump_length
              )?.value;
              if (length == null) {
                length = 50;
              }

              setSelectedBumpFramework(bumpFramework);
              setBumpLengthValue(length);
              props.onBumpFrameworkSelected(bumpFramework);
            }}
            searchable
            creatable
            withinPortal
            dropdownPosition="bottom"
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Button
            mt="md"
            onClick={() => {
              openContextModal({
                modal: "manageBumpFramework",
                title: <Title order={3}>Manage Bump Frameworks</Title>,
                innerProps: {
                  selectedBumpFramework: selectedBumpFramework,
                  overallStatus: props.overall_status,
                  linkedinStatus: prospectDrawerStatuses.linkedin,
                  archetypeId: props.persona_id,
                  backTriggerGetFrameworks: triggerGetBumpFrameworks,
                },
              });
            }}
          >
            Manage
          </Button>
        </Grid.Col>
      </Grid>
      <HoverCard width={280} shadow="md">
        <HoverCard.Target>
          <Slider
            label={null}
            step={50}
            marks={bumpFrameworkLengthMarks}
            mt="xs"
            mb="xl"
            p="md"
            value={bumpLengthValue}
            onChange={(value) => {
              setBumpLengthValue(value);
              let bumpLength = bumpFrameworkLengthMarks.find(
                (marks) => marks.value === value
              )?.api_label;
              if (bumpLength == null) {
                bumpLength = "MEDIUM";
              }
              if (selectedBumpFramework) {
                setSelectedBumpFramework({ ...selectedBumpFramework, bump_length: bumpLength })
              }
              props.onBumpFrameworkSelected(selectedBumpFramework, bumpLength);
            }}
          />
        </HoverCard.Target>
        <HoverCard.Dropdown style={{ "backgroundColor": "rgb(34, 37, 41)", "padding": 0 }}>
          <Paper style={{ "backgroundColor": "rgb(34, 37, 41)", "color": "white", "padding": 10 }}>
            <TextWithNewline breakheight="10px">
              {"Control how long you want the generated bump to be:\n\nShort: 1-2 sentences\nMedium: 3-4 sentences\nLong: 2 paragraphs"}
            </TextWithNewline>
          </Paper>
        </HoverCard.Dropdown>
      </HoverCard>
      <Textarea
        mt="md"
        value={props.account_research}
        onChange={(event) => {
          props.onAccountResearchChanged(event.currentTarget.value);
        }}
        placeholder="(optional) 'Acme Corp. raised a $20m Series B'"
        label="Account Research"
        description="AI might use this information to write the bump."
        minRows={2}
        maxRows={4}
        autosize
      />
    </Card>
  );
}
