import {
  Text,
  Paper,
  Textarea,
  Divider,
  Button,
  Card,
  Title,
  Loader,
  Flex,
  Box,
  LoadingOverlay,
  Tabs,
  Container,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";
import { Archetype } from "src";
import ProspectSelect from "@common/library/ProspectSelect";
import { API_URL } from "@constants/data";
import { logout } from "@auth/core";
import { useQuery } from "@tanstack/react-query";
import { showNotification } from "@mantine/notifications";
import { setDatasets } from "react-chartjs-2/dist/utils";
import { IconAlertCircle, IconBrandOnedrive, IconChartTreemap, IconTool } from '@tabler/icons';
import { IconChartBubble } from '@tabler/icons-react';

export default function VoiceEditorModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  persona_id: number;
  voiceId: number;
}>) {
  const userToken = useRecoilValue(userTokenState);

  const [promptChanged, setPromptChanged] = useState(false);
  const [selectedProspectId, setSelectedProspectId]: any = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [generatedSample, setGeneratedSample] = useState("");

  const [fetchedPromptData, setFetchedPromptData] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [stackRankedConfigurationData, setStackRankedConfigurationData] = useState<any>({});

  const [editViewMode, setEditViewMode] = useState("advanced");
  
  const [stackRankedConfigurationDataChanged, setStackRankedConfigurationDataChanged] = useState(false);

  useEffect(() => {
    if (!fetchedPromptData) {
      fetchPromptData();
    }
  }, []);

  const fetchPromptData = () => {
    setIsFetching(true);

    const response = fetch(
      `${API_URL}/message_generation/stack_ranked_configurations/${innerProps.voiceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    )
      .then((res) => {
        if (res.status === 401) {
          logout();
        }
        return res.json();
      })
      .then((j) => {
        setStackRankedConfigurationData(j.data)
        setPrompt(j.data?.computed_prompt);
        if (j.data?.prompt_1) {
          setEditViewMode("edit_voice")
        }
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  const generateSample = () => {
    setLoadingSample(true);
    setGeneratedSample("");
    showNotification({
      title: "Generating sample...",
      message: "Wait a few seconds while we generate a sample message",
      color: "blue",
      autoClose: 5000,
    });
    fetch(
      `${API_URL}/message_generation/stack_ranked_configuration/generate_completion_for_prospect`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospect_id: selectedProspectId,
          computed_prompt: prompt,
        }),
      }
    )
      .then((res) => {
        const data = res.json();
        return data;
      })
      .then((data) => {
        setGeneratedSample(data?.completion);
        showNotification({
          title: "Sample generated",
          message: "The sample message was generated successfully",
          color: "green",
          autoClose: 5000,
        });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoadingSample(false);
      });
  };

  const saveUpdatedPrompt = () => {
    setSavingPrompt(true);
    fetch(
      `${API_URL}/message_generation/stack_ranked_configuration_tool/update_computed_prompt`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_prompt: prompt,
          configuration_id: innerProps.voiceId,
        }),
      }
    )
      .then((res) => {
        if (res.status === 401) {
          logout();
        }
        setPromptChanged(false);
        setSavingPrompt(false);
      })
      .finally(() => {
        setSavingPrompt(false);
        setPromptChanged(false);
        showNotification({
          title: "Prompt updated",
          message: "The prompt was updated successfully",
          color: "green",
          autoClose: 5000,
        });
      });
  };

  const saveStackRankedConfigurationData = () => {
    setSavingPrompt(true);

    console.log(innerProps.voiceId)
    console.log(stackRankedConfigurationData?.instruction)

    fetch(
      `${API_URL}/message_generation/stack_ranked_configuration_tool/update_stack_ranked_configuration_data`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          configuration_id: innerProps.voiceId,
          instruction: stackRankedConfigurationData?.instruction,
          completion_1: stackRankedConfigurationData?.completion_1,
          completion_2: stackRankedConfigurationData?.completion_2,
          completion_3: stackRankedConfigurationData?.completion_3,
          completion_4: stackRankedConfigurationData?.completion_4,
          completion_5: stackRankedConfigurationData?.completion_5,
          completion_6: stackRankedConfigurationData?.completion_6,
          completion_7: stackRankedConfigurationData?.completion_7,
        }),
      }
    )
      .then((res) => {
        if (res.status === 401) {
          logout();
        }
        setStackRankedConfigurationDataChanged(false)
        setSavingPrompt(false);
      })
      .finally(() => {
        setSavingPrompt(false);
        setStackRankedConfigurationDataChanged(false)
        showNotification({
          title: "Configuration updated",
          message: "The configuration was updated successfully",
          color: "green",
          autoClose: 5000,
        });
        fetchPromptData();
      });
  };

  return (
    <Paper
      p={0}
      style={{
        position: "relative",
      }}
    >
      <LoadingOverlay visible={isFetching} />
      <Text>
        This is the raw prompt that will be used to generate LinkedIn messages
        for this voice. You can edit the prompt below then use the 'Simulation'
        section to test this voice on a prospect.
      </Text>

      <Divider mt="md" mb="md" />
      <Tabs value={editViewMode}>
        <Tabs.List>
          {editViewMode === 'edit_voice' && <Tabs.Tab value="edit_voice" icon={<IconChartBubble size="0.8rem" />}>Edit Voice Instruction & Samples</Tabs.Tab>}
          {editViewMode === 'advanced' && <Tabs.Tab value="advanced" icon={<IconTool size="0.8rem" />}>Advanced Edit Mode</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="edit_voice" pt="xs">
          <Flex direction='row'>
            <Textarea
                w='40%'
                minRows={21}
                label="Instruction"
                description="This is the instruction that will be used to generate messages in this voice"
                defaultValue={stackRankedConfigurationData?.instruction?.replace("Follow instructions to generate a short intro message:\n", "")}
                size='xs'
                onChange={(e) => {
                  console.log("Instruction changed")
                  setStackRankedConfigurationDataChanged(true)
                  
                  if (stackRankedConfigurationData?.instruction) { 
                    stackRankedConfigurationData.instruction = "Follow instructions to generate a short intro message:\n" + e.currentTarget.value
                    setStackRankedConfigurationData(stackRankedConfigurationData)
                  }
                 
                }}
              />  
              <Card sx={{maxHeight: '450px', overflowY: 'scroll', width: '60%'}} m='sm' withBorder>
                <Text>
                  Completions
                </Text>
                <Text size='xs'>
                  These are the completions that will be used to generate messages in this voice.
                  Edit the completions below to change how messages are generated.
                </Text>
                {
                  [1,2,3,4,5,6,7].map((i, index) => {
                      const promptKey = "prompt_" + i
                      const completionKey = "completion_" + i

                      if (!stackRankedConfigurationData[promptKey]) {
                        return null
                      }

                      return (
                        <Textarea
                          w='100%'
                          icon={<IconChartTreemap size="0.8rem" />}
                          minRows={8}
                          mt="sm"
                          size='xs'
                          label={`Sample ${index + 1}`}
                          placeholder="Raw voice prompt..."
                          defaultValue={stackRankedConfigurationData[completionKey]}
                          onChange={(e) => {
                            setStackRankedConfigurationDataChanged(true)
                            console.log("Completion " + promptKey + " changed")
                            console.log("Before: ")
                            console.log(stackRankedConfigurationData[completionKey])

                            console.log("After: ")
                            console.log(e.currentTarget.value)

                            stackRankedConfigurationData[completionKey] = e.currentTarget.value
                            setStackRankedConfigurationData(stackRankedConfigurationData)
                          }}
                          />
                      )
                  })
                }
                
              </Card>
          </Flex>

          <Button
            color="green"
            mt="sm"
            disabled={!stackRankedConfigurationDataChanged}
            onClick={() => {
              setStackRankedConfigurationDataChanged(false)
              saveStackRankedConfigurationData();
            }}
            loading={savingPrompt}
          >
            Save Configuration
          </Button>
          
        </Tabs.Panel>

        <Tabs.Panel value="advanced" pt="xs">
          <Card withBorder>
            <Card withBorder mb='xs'>
              <IconAlertCircle size="1.2rem" color='red' />
              <Text color='red' weight={700} size='xs'>
                WARNING: This voice was made using the old voice builder so it will need to be edited using the raw prompt. Please contact a SellScale engineer if you need help fixing this voice.
              </Text>
            </Card>
            <Textarea
              minRows={15}
              label="Raw Voice Prompt"
              description="This is the raw prompt use by SellScale to generate messages in this voice"
              placeholder="Raw voice prompt..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.currentTarget.value);
                setPromptChanged(true);
              }}
            />     
            <Button
              color="green"
              mt="sm"
              disabled={!promptChanged}
              onClick={() => {
                saveUpdatedPrompt();
              }}
              loading={savingPrompt}
            >
              Save Prompt
            </Button>
          </Card>
        </Tabs.Panel>
    
      </Tabs>
     
    

      <Card mt="md" p="md" withBorder>
        <Title order={4}>Simulate Voice</Title>
        <Text>
          Use the simulation section to test this voice on a prospect. You can
          select a persona then hit 'Generate' to see what the message would
          look like.
        </Text>
        <Flex direction="row">
          <Box sx={{ width: "80%" }}>
            <ProspectSelect
              onChange={(prospect) => {
                setSelectedProspectId(prospect?.id);
              }}
              personaId={innerProps.persona_id}
            />
          </Box>
          <Box pt="md">
            <Button
              color="grape"
              mt="xl"
              ml="lg"
              onClick={() => generateSample()}
              disabled={!selectedProspectId}
              loading={loadingSample}
            >
              Generate
            </Button>
          </Box>
        </Flex>

        {generatedSample && (
          <Textarea
            mt="lg"
            minRows={4}
            label="Sample Generated Message"
            description="This is the sample message generated by SellScale using the prompt above."
            placeholder="Sample message..."
            defaultValue={generatedSample}
            contentEditable={false}
          />
        )}
      </Card>
    </Paper>
  );
}
