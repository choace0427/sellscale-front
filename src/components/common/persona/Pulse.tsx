import { Paper, Title, Text, Textarea, Button } from "@mantine/core";
import { openContextModal } from "@mantine/modals";
import { IconPencil } from "@tabler/icons";
import { useState } from "react";
import { Archetype } from "src"

export default function Pulse(props: {
  archetype: Archetype;
}) {
  const [currentICPPrompt, setCurrentICPPrompt] = useState(props.archetype.icp_matching_prompt)


  return (
    <Paper withBorder p="xs" my={20} radius="md">
      <Textarea
        defaultValue={currentICPPrompt}
        placeholder="No prompt? Send SellScale a prompt request through here."
        label="Ideal Customer Profile Description"
        description="Description of your Ideal Customer Profile (ICP) that SellScale AI will use to filter prospects."
        autosize
        disabled
      />
      <Button
        mt="xs"
        rightIcon={<IconPencil size="1rem" />}
        variant="outline"
        radius="lg"
        color="teal"
        onClick={() => {
          currentICPPrompt ?
            openContextModal({
              modal: "managePulsePrompt",
              title: <Title order={3}>Edit Pulse Prompt</Title>,
              innerProps: { mode: "EDIT", archetype: props.archetype },
            })
            :
            openContextModal({
              modal: "managePulsePrompt",
              title: <Title order={3}>Create Pulse Prompt</Title>,
              innerProps: { mode: "CREATE", archetype: props.archetype },
            })
        }}
      >
        {currentICPPrompt ? "Edit Pulse Prompt" : "Create New Pulse Prompt"}
      </Button>
    </Paper>
  )
}
