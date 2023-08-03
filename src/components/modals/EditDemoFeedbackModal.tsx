import { userTokenState } from "@atoms/userAtoms";
import { DemoRating } from "@common/home/dashboard/demo/DemoRating";
import { Button, Checkbox, Flex, Group, LoadingOverlay, Modal, Radio, Stack, Text, Textarea, Title, useMantineTheme } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import patchDemoFeedback from "@utils/requests/patchDemoFeedback";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { DemoFeedback, Prospect } from "src";


interface EditDemoFeedback extends Record<string, unknown> {
  modalOpened: boolean;
  openModal: () => void;
  closeModal: () => void;
  backFunction: () => void;
  demoFeedback: DemoFeedback;
}

export default function EditDemoFeedbackModal(props: EditDemoFeedback) {
  const userToken = useRecoilValue(userTokenState);
  const [loading, setLoading] = useState(false);

  const triggerUpdateDemoFeedback = async (values: typeof demoFeedbackForm.values) => {
    setLoading(true)

    const result = await patchDemoFeedback(
      userToken,
      props.demoFeedback.id,
      values.demoHappen === 'yes' ? 'OCCURRED' : 'NO_SHOW',
      values.demoRating + '/5',
      values.feedback,
      values.followupDate,
    )
    if (result.status === 'success') {
      showNotification({
        title: "Success",
        message: "Demo feedback updated.",
        color: "green",
        autoClose: 2000,
      });
      demoFeedbackForm.reset()
      props.backFunction()
      props.closeModal()
      setLoading(false)
    } else {
      showNotification({
        title: "Error",
        message: "Failed to update demo feedback.",
        color: "red",
      });
    }

    setLoading(false)
  }

  const [reschedule, setReschedule] = useState(false);
  const [showedUp, setShowedUp] = useState(false);
  const [followup, setFollowup] = useState(false);

  const demoFeedbackForm = useForm({
    initialValues: {
      demoHappen: props.demoFeedback.status === 'OCCURRED' ? 'yes' : 'no-show',
      demoRating: parseInt(props.demoFeedback.rating.split('/')[0]),
      feedback: props.demoFeedback.feedback,
      followupDate: props.demoFeedback.next_demo_date,
    },
  });

  useEffect(() => {
    if (demoFeedbackForm.values.demoHappen === 'reschedule') {
      setReschedule(true);
    } else if (demoFeedbackForm.values.demoHappen === 'yes') {
      setReschedule(false);
      setShowedUp(true);
    } else {
      setReschedule(false);
      setShowedUp(false);
    }
  }, [demoFeedbackForm.values.demoHappen]);

  return (
    <Modal
      opened={props.modalOpened}
      onClose={props.closeModal}
      title={
        <Title order={3}>
          Edit Demo Feedback
        </Title>
      }
      size="md"
    >
      <LoadingOverlay visible={loading} />

      <form onSubmit={demoFeedbackForm.onSubmit((values) => triggerUpdateDemoFeedback(values))}>
        <Stack>
          <Radio.Group name='demoHappen' label='Did the demo happen?' {...demoFeedbackForm.getInputProps('demoHappen')}>
            <Radio color='green' value='yes' label='Yes' />
            <Radio color='green' value='no-show' label='No show' />
          </Radio.Group>

          <>
            <Stack spacing={5}>
              <Text
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                How did it go?
              </Text>
              <DemoRating {...demoFeedbackForm.getInputProps('demoRating')} />
            </Stack>
            <Textarea
              autosize
              minRows={2}
              maxRows={6}
              required
              label='What did you like / what would you change?'
              {...demoFeedbackForm.getInputProps('feedback')}
            />
            {
              showedUp && (
                <Stack spacing={5}>
                  <Text fw='bold' fz='md'>Follow up</Text>
                  <Checkbox
                    label='I have a followup meeting scheduled with this Prospect.'
                    checked={followup || demoFeedbackForm.values.followupDate != undefined}
                    onChange={(e) => setFollowup(e.target.checked)}
                  />
                  <Flex align='center' justify='center' mt='md'>
                    {
                      (followup || demoFeedbackForm.values.followupDate != undefined) && (
                        <DatePicker
                          size='xs'
                          {...demoFeedbackForm.getInputProps('followupDate')}
                        />
                      )
                    }
                  </Flex>
                </Stack>
              )
            }
          </>

        </Stack>

        <Flex
          justify='center'
          mt='xl'
        >
          <Group>
            <Button hidden={reschedule} type='submit' color='green' radius='xl'>
              Edit feedback
            </Button>
          </Group>
        </Flex>
      </form>

    </Modal>
  )
}