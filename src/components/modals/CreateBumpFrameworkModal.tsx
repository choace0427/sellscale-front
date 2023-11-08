import { userTokenState } from "@atoms/userAtoms";
import TextWithNewline from "@common/library/TextWithNewlines";
import PersonaSelect from "@common/persona/PersonaSplitSelect";
import { PersonalizationSection } from '@common/sequence/SequenceSection';
import { Modal, TextInput, Text, Textarea, Slider, Flex, Select, Switch, Button, useMantineTheme, LoadingOverlay, NumberInput, HoverCard, Paper, Tooltip, Group, Box, Collapse } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from '@mantine/hooks';
import { ContextModalProps, closeAllModals, openContextModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconWashMachine, IconX } from "@tabler/icons";
import { useQueryClient } from '@tanstack/react-query';
import { createBumpFramework } from "@utils/requests/createBumpFramework";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { MsgResponse } from "src";


const bumpFrameworkLengthMarks = [
  { value: 0, label: "Short", api_label: "SHORT" },
  { value: 50, label: "Medium", api_label: "MEDIUM" },
  { value: 100, label: "Long", api_label: "LONG" },
];


interface CreateBumpFramework extends Record<string, unknown> {
  modalOpened: boolean;
  openModal: () => void;
  closeModal: () => void;
  backFunction: () => void;
  dataChannels: MsgResponse | undefined;
  archetypeID: number | null;
  status?: string;
  showStatus?: boolean;
  bumpedCount?: number | null;
  initialValues?: {
    title: string;
    description: string;
    human_readable_prompt: string;
    default: boolean;
    bumpDelayDays: number;
    useAccountResearch: boolean;
    bumpLength: string;
    transformerBlocklist?: string[];
  };
}

export default function CreateBumpFrameworkModal(props: CreateBumpFramework) {

  useEffect(() => {
    if (props.modalOpened) {
      openContextModal({
        modal: "createBumpFramework",
        title: "Create Bump Framework",
        innerProps: {
          ...props,
        },
      });
    }
  }, [props.modalOpened]);

  return (
    <></>
  );

}

export function CreateBumpFrameworkContextModal({
  context,
  id,
  innerProps,
}: ContextModalProps<CreateBumpFramework>) {
  const [userToken] = useRecoilState(userTokenState);
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const initBumpLengthAsValue = bumpFrameworkLengthMarks.find((mark) => mark.api_label === innerProps.initialValues?.bumpLength)?.value;
  const [bumpLengthValue, setBumpLengthValue] = useState(
    initBumpLengthAsValue ?? 50
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>('');
  const [selectedSubstatus, setSelectedSubstatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [opened, { toggle }] = useDisclosure(false);

  const getActiveConvoSubstatusValues = () => {
    const activeConvoStatuses = [];
    const statuses_avilable =
        innerProps.dataChannels?.data["LINKEDIN"]?.statuses_available;
    if (statuses_avilable != null) {
      for (const item of statuses_avilable) {
        const statusLabel = innerProps.dataChannels?.data["LINKEDIN"][item]?.name;
        if (statusLabel.includes("Active Convo")) {
          activeConvoStatuses.push({
            label: statusLabel,
            value: item,
          });
        }
      }
    }
    return activeConvoStatuses;
  };

  const triggerCreateBumpFramework = async () => {
    setLoading(true);

    if (form.values.archetypeID == null) {
      showNotification({
        title: "Error",
        message: "Please select an archetype",
        color: "red",
      });
      return;
    }

    const result = await createBumpFramework(
      userToken,
      form.values.archetypeID,
      selectedStatus as string,
      form.values.title,
      form.values.description,
      bumpFrameworkLengthMarks.find((mark) => mark.value === bumpLengthValue)
        ?.api_label as string,
      form.values.bumpedCount as number,
      form.values.bumpDelayDays,
      form.values.default,
      selectedSubstatus,
      form.values.useAccountResearch,
      form.values.human_readable_prompt,
      form.values.transformerBlocklist
    );

    if (result.status === "success") {
      showNotification({
        title: "Success",
        message: "Bump Framework created successfully",
        color: "green",
      });
      form.reset();
      innerProps.backFunction();
      innerProps.closeModal();
    } else {
      showNotification({
        title: "Error",
        message: result.message,
        color: "red",
      });
    }
    
    queryClient.refetchQueries({
      queryKey: [`query-get-bump-frameworks`],
    });

    setLoading(false);
  };

  const form = useForm({
    initialValues: {
      title: innerProps.initialValues?.title ?? "",
      description: innerProps.initialValues?.description ?? "",
      human_readable_prompt: innerProps.initialValues?.human_readable_prompt ?? "",
      archetypeID: innerProps.archetypeID,
      default: innerProps.initialValues?.default ?? true,
      bumpedCount: innerProps.bumpedCount,
      bumpDelayDays: innerProps.initialValues?.bumpDelayDays ?? 2,
      useAccountResearch: innerProps.initialValues?.useAccountResearch ?? false,
      transformerBlocklist: innerProps.initialValues?.transformerBlocklist ?? []
    },
  });


  useEffect(() => {
    // Set the statuses to the correct values
    if (innerProps.status != null) {
      setSelectedStatus(innerProps.status);
      if (innerProps.status.includes("ACTIVE_CONVO_")) {
        setSelectedStatus("ACTIVE_CONVO");
        setSelectedSubstatus(innerProps.status);
      }
    }
  }, [innerProps.status])


  return (
    <Paper>
      <LoadingOverlay visible={loading} />
      <TextInput
        label={selectedStatus?.includes("ACTIVE_CONVO") ? 'Prospect reply' : "Template nickname"}
        placeholder={"Sports introduction"}
        withAsterisk
        {...form.getInputProps("title")}
      />
      <Textarea
        mt="md"
        label="Prompt Instructions"
        placeholder={
          "These are instructions the AI will read to craft a personalized message"
        }
        withAsterisk
        autosize
        {...form.getInputProps("description")}
      />

      <Box mx="auto">
        <Group mb={5}>
          <Button onClick={toggle} leftIcon={<IconWashMachine size="0.8rem"/>} variant='outline' color='gray' mt='xs' w='100%'>
            {opened ? "Hide" : "Show"} Advanced Settings
            </Button>
        </Group>

        <Collapse in={opened}>
          <Textarea
              mt="md"
              label="Goal"
              minRows={3}
              description="This is the label that will be shown to succinctly explain this framework"
              placeholder={
                "This is a description of this framework."
              }
              withAsterisk
              autosize
              {...form.getInputProps("human_readable_prompt")}
            />
          <Text fz="sm" mt="md">
            Bump Length
          </Text>
          <Flex
        align="center"
        justify={'center'}
      >
        <HoverCard width={280} shadow="md">
          <HoverCard.Target>
            <Slider
              label={null}
              step={50}
              marks={bumpFrameworkLengthMarks}
              mt="xs"
              mb="xl"
              p="md"
              w='75%'
              value={bumpLengthValue}
              onChange={(value) => {
                setBumpLengthValue(value);
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
      </Flex>

      {innerProps.showStatus && (
        <Select
          label="Status"
          w='100%'
          description="Which status should use this bump?"
          placeholder="select status..."
          data={innerProps.dataChannels?.data[
            "SELLSCALE"
          ]?.statuses_available?.map((status: string) => {
            return {
              label:
              innerProps.dataChannels?.data["SELLSCALE"][status].name,
              value: status,
            };
          })}
          value={selectedStatus ? selectedStatus : null}
          onChange={setSelectedStatus}
          mt="md"
          withAsterisk
        />
      )}
      {selectedStatus === "ACTIVE_CONVO" && (
        <Select
          label="Substatus"
          description="Which substatus should use this bump?"
          placeholder="select substatus..."
          value={selectedSubstatus ? selectedSubstatus : null}
          data={getActiveConvoSubstatusValues()}
          onChange={setSelectedSubstatus}
          mt="md"
          withAsterisk
        />
      )}


   
      {(selectedStatus === "BUMPED" && form.values.bumpedCount != null && innerProps.showStatus) && (
        <NumberInput
          mt='md'
          label="Bump Number"
          description="The position in the bump sequence."
          placeholder="1"
          value={form.values.bumpedCount}
          onChange={(e) => {
            form.setFieldValue("bumpedCount", e as number);
          }}
          min={1}
          withAsterisk
        />
      )}
      <Flex justify='space-between' align='center'>
          {
            (selectedStatus === "BUMPED" || selectedStatus === "ACCEPTED") &&  (
              <NumberInput
                mt='md'
                label="Bump Delay"
                description="The number of days to wait before sending the bump."
                placeholder="2"
                value={form.values.bumpDelayDays}
                onChange={(e) => {
                  form.setFieldValue("bumpDelayDays", e as number);
                }}
                min={2}
                withAsterisk
              />
            )
          }
          <Flex></Flex>

          <Flex direction='column' align='flex-end'>
            <Tooltip 
              withinPortal
              withArrow 
              label="New frameworks must be default enabled."
            >
              <span>
                <Switch
                  pt="md"
                  label="Make default"
                  labelPosition="left"
                  disabled={true}
                  checked={form.values.default}
                  onChange={(e) => {
                    form.setFieldValue(
                      "default",
                      e.currentTarget.checked
                    );
                  }}
                />
              </span>
            </Tooltip>
            <Tooltip
              withinPortal
              withArrow
              label='Using account research leads to more personalized messages, but may not be the best for straightforward messages.'
            >
              <span>
                <Switch
                  pt="md"
                  label="Use Account Research"
                  labelPosition="left"
                  checked={form.values.useAccountResearch}
                  onChange={(e) => {
                    form.setFieldValue(
                      "useAccountResearch",
                      e.currentTarget.checked
                    );
                  }}
                />
              </span>
            </Tooltip>
          </Flex>
        </Flex>
        {form.values.useAccountResearch && (
          <PersonalizationSection
            blocklist={form.values.transformerBlocklist ?? []}
            onItemsChange={async (items) => {
              form.setFieldValue("transformerBlocklist", 
                items.filter((x) => !x.checked).map(x => x.id)
              );
            }}
            onChanged={() => {}}
          />
        )}
        
        </Collapse>
      </Box>

     
      <Flex w="100%" justify="flex-end" direction={'column'}>
        

        <Button
          mt="md"
          disabled={
            form.values.title.trim() == "" ||
            form.values.description.trim() == "" ||
            selectedStatus == null ||
            (selectedStatus === "ACTIVE_CONVO" &&
              selectedSubstatus == null)
          }
          onClick={() => {
            triggerCreateBumpFramework();
          }}
          size='lg'
        >
          Create Framework
        </Button>
      </Flex>

      {/* TODO:? <PersonalizationSection /> */}
    </Paper>
  )
}