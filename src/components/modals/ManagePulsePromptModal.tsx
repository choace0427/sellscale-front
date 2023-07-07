import { userTokenState } from "@atoms/userAtoms";
import {
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Textarea,
  TextInput,
  useMantineTheme,
  Text
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { ContextModalProps, openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { IconPencil } from "@tabler/icons";
import postICPClassificationPromptChange from "@utils/requests/postICPClassificationPromptChange";
import postRunICPClassification from "@utils/requests/postRunICPClassification";
import { useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { Archetype, PersonaOverview } from "src";

const defaultHeader =
  "I am a sales researcher. This is the Ideal Customer Profile for my target customer:\n\n";

export default function ManagePulsePrompt({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  mode: "EDIT" | "CREATE";
  personaOverview: PersonaOverview;
  backfillICPPrompt: Function;
  icpPrompt: string;
}>) {
  const theme = useMantineTheme();
  const [currentICPPrompt, setCurrentICPPrompt] = useState(
    innerProps.icpPrompt
  );
  const [loading, setLoading] = useState(false);
  const userToken = useRecoilValue(userTokenState);

  const form = useForm({
    initialValues: {
      seniority: "",
      relevantWork: "",
      tiers: "",
      others: "",
    },
  });

  async function handleFormSubmit(values: typeof form.values) {
    let prompt = defaultHeader;
    prompt += `Seniority: ${values.seniority}\n\n`;
    prompt += `Relevant Work: ${values.relevantWork}\n\n`;
    prompt += `Tiers:\n${values.tiers}\n\n`;
    prompt += `${values.others}`;

    handleSaveChanges(prompt);
  }

  async function handleSaveChanges(prompt: string, runPrompt = false) {
    setLoading(true);

    if (
      innerProps.mode === "EDIT" &&
      currentICPPrompt === innerProps.personaOverview.icp_matching_prompt
    ) {
      showNotification({
        id: "edit-pulse-prompt-fail-no-changes",
        title: "No Changes Detected",
        message:
          "You have not made any changes to your Pulse Prompt. Please make changes to your Pulse Prompt before requesting to save changes.",
        color: "red",
        autoClose: 5000,
      });

      setLoading(false);
      return;
    } else if (currentICPPrompt === "") {
      showNotification({
        id: "pulse-prompt-request-no-prompt",
        title: "No Prompt Detected",
        message:
          "You have not entered a Pulse Prompt. Please enter a Pulse Prompt before requesting to save changes.",
        color: "red",
        autoClose: 5000,
      });
    }

    const result = await postICPClassificationPromptChange(
      userToken,
      innerProps.personaOverview.id,
      prompt
    );

    setLoading(false);

    if (result.status === "success") {
      if (innerProps.mode === "EDIT") {
        showNotification({
          id: "edit-pulse-prompt",
          title: "Pulse Prompt Edited",
          message: "Pulse Prompt has been edited successfully.",
          color: "teal",
          autoClose: 3000,
        });
        if (runPrompt) {
          const result = await postRunICPClassification(userToken, innerProps.personaOverview.id)
          if (result.status === 'success') {
            showNotification({
              id: "run-pulse-prompt",
              title: "Pulse Prompt Running",
              message: "Pulse Prompt is running on all prospects. This may take a while.",
              color: "teal",
              autoClose: 3000,
            })
          } else {
            showNotification({
              id: "run-pulse-prompt-fail",
              title: "Pulse Prompt Not Ran",
              message: "Pulse Prompt could not be ran. Please contact support, or run manually from the Classify tab.",
              color: "red",
            })
          }
        }
      } else if (innerProps.mode === "CREATE") {
        showNotification({
          id: "create-pulse-prompt",
          title: "Pulse Prompt Created",
          message: "Pulse Prompt has been created successfully.",
          color: "teal",
          autoClose: 3000,
        });
      }
    } else {
      showNotification({
        id: "pulse-prompt-request-fail",
        title: "Pulse Prompt Request Failed",
        message:
          "Pulse Prompt could not be modified. Please try again or contact support.",
      });
    }

    innerProps.backfillICPPrompt();
    setCurrentICPPrompt(prompt);

    context.closeModal(id);
  }

  return (
    <>
      <LoadingOverlay visible={loading} color={theme.colors.blue[5]} />
      <Paper
        p={0}
        style={{
          position: "relative",
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        }}
      >
        {innerProps.mode === "EDIT" ? (
          <>
            <Textarea
              defaultValue={currentICPPrompt}
              label="Your current Pulse Prompt"
              description="Make as many changes as you would like."
              onChange={(e) => setCurrentICPPrompt(e.currentTarget.value)}
              withAsterisk
              autosize
            />
            <Button
              mt="xs"
              rightIcon={<IconPencil size="1rem" />}
              variant="outline"
              radius="lg"
              color="teal"
              onClick={() => {
                openConfirmModal({
                  title: 'Run Pulse Prompt on All Prospects',
                  children: (
                    <Text size='sm'>
                      Now that you've edited your ICP Pulse Prompt, would you like to run your prompt on all prospects? This will use credits.
                    </Text>
                  ),
                  labels: { confirm: 'Save & Run', cancel: 'Save' },
                  onCancel: () => handleSaveChanges(currentICPPrompt),
                  onConfirm: () => handleSaveChanges(currentICPPrompt, true),
                });
              }}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <form onSubmit={form.onSubmit(handleFormSubmit)}>
              <Flex direction="column">
                <TextInput
                  mb="xs"
                  placeholder="Senior Level, Junior Level, etc."
                  label="ICP Seniority"
                  description="Please write the qualitative seniority level of your prospect."
                  withAsterisk
                  required
                  {...form.getInputProps("seniority")}
                />
                <TextInput
                  mb="xs"
                  placeholder="Software Engineering, Fullstack, etc."
                  label="Relevant Work"
                  description="Please rank what type of work or roles your ICP has done."
                  withAsterisk
                  required
                  {...form.getInputProps("relevantWork")}
                />
                <Textarea
                  mb="xs"
                  placeholder="Tier 1: Senior level SWE&#13;&#10;Tier2: Junior level SWE"
                  label="Tiers"
                  description="Please rank the preference of your ICP based on their descriptions."
                  minRows={2}
                  withAsterisk
                  autosize
                  required
                  {...form.getInputProps("tiers")}
                />
                <Textarea
                  mb="xs"
                  placeholder="If the biography mentions Python, this is a positive ideal candidate&#13;&#10;&#13;&#10;Interested in startups"
                  description="Please mention any other notes that may be useful to grab from a LinkedIn Bio."
                  label="Other"
                  minRows={4}
                  withAsterisk
                  autosize
                  required
                  {...form.getInputProps("others")}
                />
              </Flex>
              <Button
                type="submit"
                mt="xs"
                rightIcon={<IconPencil size="1rem" />}
                variant="outline"
                radius="lg"
                color="teal"
              >
                Create New Pulse Prompt
              </Button>
            </form>
          </>
        )}
      </Paper>
    </>
  );
}
