import { openedProspectIdState, openedBumpFameworksState, selectedBumpFrameworkState, currentConvoLiMessageState, currentConvoChannelState, currentConvoEmailMessageState, fetchingProspectIdState, tempHiddenProspectsState, selectedEmailSequenceStepState, selectedEmailThread } from '@atoms/inboxAtoms';
import { userTokenState } from '@atoms/userAtoms';
import { Paper, Flex, Textarea, Text, Button, useMantineTheme, Group, ActionIcon, LoadingOverlay, Tooltip, Select, Box } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { hideNotification, showNotification } from '@mantine/notifications';
import { IconExternalLink, IconWriting, IconSend, IconChevronUp, IconChevronDown, IconSettings, IconArrowsDiagonalMinimize2 } from '@tabler/icons';
import { IconMessage2Cog, IconSettingsFilled } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteAutoBumpMessage } from '@utils/requests/autoBumpMessage';
import { sendLinkedInMessage } from '@utils/requests/sendMessage';
import _, { debounce, get } from 'lodash';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { BumpFramework, EmailSequenceStep, EmailThread, LinkedInMessage, Prospect } from 'src';
import { generateAIEmailReply, generateAIFollowup } from './InboxProspectConvoBumpFramework';
import AutoBumpFrameworkInfo from '@common/prospectDetails/AutoBumpFrameworkInfo';
import { ratio as fuzzratio } from 'fuzzball';
import { sendEmail } from '@utils/requests/sendEmail';
import RichTextArea from '@common/library/RichTextArea';
import TextAreaWithAI from '@common/library/TextAreaWithAI';
import { JSONContent } from '@tiptap/react';
import DOMPurify from 'dompurify';

export default forwardRef(function InboxProspectConvoSendBox(
  props: {
    prospectId: number;
    linkedin_public_id: string;
    email: string;
    nylasMessageId?: string;
    scrollToBottom?: () => void;
    msgLoading?: boolean;
    minimizedSendBox: () => void;
  },
  ref
) {
  useImperativeHandle(
    ref,
    () => {
      return {
        getAiGenerated: () => aiGenerated,
        setAiGenerated: setAiGenerated,
        getMessageDraft: () => messageDraft,
        setMessageDraft: (msg: string, bumpFramework?: {
          description?: string,
          id?: number,
          length?: string,
          title?: string
        }, accountResearch?: string[]) => {
          // bumpFramework is no longer used because we want to show default bump framework and NOT the autogenerated one
          setMessageDraft(msg);
          if (accountResearch) {
            setBumpFramework((prev) => {
              if (!prev) {
                return prev;
              }
              return {
                ...prev,
                account_research: accountResearch,
              }
            })
          }
        },
        setAiMessage: (msg: string) => {
          setAiMessage(msg);
        },
        setBumpFrameworks: (bumpFrameworks: BumpFramework[]) => {
          setBumpFrameworks(bumpFrameworks);
          // Set the default bump framework
          if (bumpFrameworks.length > 0) {
            setBumpFramework(bumpFrameworks[0]);
            for (let i = 0; i < bumpFrameworks.length; i++) {
              if (bumpFrameworks[i].default) {
                setBumpFramework(bumpFrameworks[i]);
                break;
              }
            }
          }
        },
        setEmailSequenceSteps: (emailSequenceSteps: EmailSequenceStep[]) => {
          setEmailSequenceSteps(emailSequenceSteps);
          // Set the default bump framework
          if (emailSequenceSteps.length > 0) {
            setEmailSequenceStep(emailSequenceSteps[0]);
            for (let i = 0; i < emailSequenceSteps.length; i++) {
              if (emailSequenceSteps[i].default) {
                setEmailSequenceStep(emailSequenceSteps[i]);
                break;
              }
            }
          }
        },
        setEmailThread: (emailThread: EmailThread) => {
          setCurrentConvoEmailThread(emailThread);
        }
      };
    },
    []
  );

  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const userToken = useRecoilValue(userTokenState);

  const openedProspectId = useRecoilValue(openedProspectIdState);
  const openedOutboundChannel = useRecoilValue(currentConvoChannelState);
  const [fetchingProspectId, setFetchingProspectId] = useRecoilState(fetchingProspectIdState)

  const [openBumpFrameworks, setOpenBumpFrameworks] = useRecoilState(openedBumpFameworksState);
  const [selectedBumpFramework, setBumpFramework] = useRecoilState(selectedBumpFrameworkState); // LinkedIn
  const [selectedEmailSequenceStep, setEmailSequenceStep] = useRecoilState(selectedEmailSequenceStepState); // Email
  const [currentConvoLiMessages, setCurrentConvoLiMessages] = useRecoilState(currentConvoLiMessageState);
  const [currentConvoEmailMessages, setCurrentConvoEmailMessages] = useRecoilState(currentConvoEmailMessageState);
  const [currentConvoEmailThread, setCurrentConvoEmailThread] = useRecoilState(selectedEmailThread);

  const [tempHiddenProspects, setTempHiddenProspects] = useRecoilState(tempHiddenProspectsState);

  const [bumpFrameworks, setBumpFrameworks] = useState<BumpFramework[]>([]);
  const [emailSequenceSteps, setEmailSequenceSteps] = useState<EmailSequenceStep[]>([]);

  // We use this to store the value of the text area
  const [messageDraft, _setMessageDraft] = useState('');
  // We use this to store the raw value of the rich text editor
  const messageDraftRichRaw = useRef<JSONContent | string>();

  // We use this to set the value of the text area (for both rich text and normal text)
  const setMessageDraft = (value: string) => {
    messageDraftRichRaw.current = value;
    _setMessageDraft(value);
  }
  // For email we have to use this ref instead, otherwise the textbox does a weird refocusing.
  const messageDraftEmail = useRef('')

  const [aiMessage, setAiMessage] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [msgLoading, setMsgLoading] = useState(props.msgLoading || false);

  const sendMessage = async () => {
    setMsgLoading(true);
    

    // Delete the auto bump message if it exists
    await deleteAutoBumpMessage(userToken, props.prospectId);

    // Hack to update the prospect list to temp show they're in purgatory
    setTempHiddenProspects(tempHiddenProspects.concat([props.prospectId]));

    if (openedOutboundChannel === 'LINKEDIN') {
      const msg = messageDraft;
      setMessageDraft('');
      showNotification({
        id: "send-linkedin-message",
        title: "Sending message ...",
        message: '',
        color: "green",
        autoClose: 3000,
      })
      setTimeout(() => setFetchingProspectId(-1), 15000);

      setFetchingProspectId(openedProspectId)
      sendLinkedInMessage(
        userToken,
        props.prospectId,
        msg,
        aiGenerated,
        undefined,
        selectedBumpFramework?.id,
        selectedBumpFramework?.title,
        selectedBumpFramework?.description,
        selectedBumpFramework?.bump_length,
        selectedBumpFramework?.account_research
      ).then(() => {
        queryClient.refetchQueries({
          queryKey: [`query-get-dashboard-prospect-${openedProspectId}-convo-${openedOutboundChannel}`],
        });
      });
      if (true) {
        let yourMessage = _.cloneDeep(currentConvoLiMessages || [])
          .reverse()
          .find((msg) => msg.connection_degree === 'You');
        if (yourMessage) {
          yourMessage.message = msg;
          yourMessage.date = new Date().toUTCString();
          yourMessage.ai_generated = false;
          setCurrentConvoLiMessages(
            ([...currentConvoLiMessages || [], yourMessage])
          );
        } else {
          queryClient.refetchQueries({
            queryKey: [`query-get-dashboard-prospect-${openedProspectId}-convo-${openedOutboundChannel}`],
          });
        }
      } else {
        showNotification({
          id: 'send-linkedin-message-error',
          title: 'Error',
          message: 'Failed to send message. Please try again later.',
          color: 'red',
          autoClose: false,
        });
      }

    } else {
      if (currentConvoEmailMessages === undefined || currentConvoEmailMessages.length === 0) {
        showNotification({
          id: 'send-email-message-error',
          title: 'Error',
          message: 'Please select an email thread',
          color: 'red',
          autoClose: false,
        })
        setMsgLoading(false);
        return;
      }
      const msg = messageDraftEmail.current;
      if (msg.length === 0) {
        showNotification({
          id: 'send-email-message-error',
          title: 'Error',
          message: 'Please enter a message',
          color: 'red',
          autoClose: false,
        })
        setMsgLoading(false);
        return;
      }

      // Get the last message
      console.log(currentConvoEmailMessages)
      const replyToMessageID = currentConvoEmailMessages[currentConvoEmailMessages.length - 1].nylas_message_id
      console.log('reply', replyToMessageID)
      const result = await sendEmail(
        userToken,
        props.prospectId,
        `Re: ${currentConvoEmailThread?.subject}`,
        msg,
        aiGenerated,
        replyToMessageID
      );
      if (result.status === 'success') {
        let yourMessage = _.cloneDeep(currentConvoEmailMessages || [])
          .reverse()
          .find((msg) => msg.from_sdr);
        if (yourMessage) {
          yourMessage.body = msg;
          yourMessage.date_received = new Date().toUTCString();
          yourMessage.ai_generated = false;
          setCurrentConvoEmailMessages(
            ([...currentConvoEmailMessages || [], yourMessage])
          );
        } else {
          queryClient.refetchQueries({
            queryKey: [`query-get-dashboard-prospect-${openedProspectId}-convo-${openedOutboundChannel}`],
          });
        }
        messageDraftEmail.current = ''
        messageDraftRichRaw.current = ''
        setMessageDraft('')
      } else {
        showNotification({
          id: 'send-email-message-error',
          title: 'Error',
          message: 'Failed to send message. Please try again later.',
          color: 'red',
          autoClose: false,
        });
      }

    }

    setMsgLoading(false);
    setAiGenerated(false);
    setTimeout(() => props.scrollToBottom && props.scrollToBottom(), 100);

  };

  // If messageDraft is cleared, odds are that the AI generated message was cleared, and the new message is likely not to be AI generated
  useEffect(() => {
    checkFuzz(messageDraft, aiMessage);
  }, [messageDraft, aiMessage])

  const checkFuzz = useCallback(
    debounce((message, aiMessage) => {
      const ratio = fuzzratio(message, aiMessage);
      ratio > 50 && setAiGenerated(true);
      ratio <= 50 && setAiGenerated(false);
    }, 200), []
  )

  return (
    <Paper
      shadow='sm'
      withBorder
      radius={theme.radius.md}
      sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', position: 'relative' }}
      mx={10}
      mb={10}
      pb={8}
      mah={500}
    >
      <LoadingOverlay visible={msgLoading} />
      <div
        style={{
          flexBasis: '15%',
          backgroundColor: '#25262b',
          borderTopLeftRadius: theme.radius.md,
          borderTopRightRadius: theme.radius.md,
        }}
      >
        <Group spacing={0} position='apart'>
          <Flex wrap='nowrap' align='center'>
            <Text color='white' fz={14} fw={500} pl={15} pt={5}>
              Message via {openedOutboundChannel === 'LINKEDIN' ? 'LinkedIn' : 'Email'}
            </Text>
            <Text
              pl={10}
              pt={5}
              size='xs'
              fs='italic'
              color='gray.3'
              component='a'
              target='_blank'
              rel='noopener noreferrer'
              href={openedOutboundChannel === 'LINKEDIN' ? `https://www.linkedin.com/in/${props.linkedin_public_id}` : `mailto:${props.email}`}
            >
              {openedOutboundChannel === 'LINKEDIN' ? `linkedin.com/in/${_.truncate(props.linkedin_public_id, { length: 20 })}` : props.email} <IconExternalLink size='0.65rem' />
            </Text>
          </Flex>
          {true && ( // TODO: Added chat box expanding
            <div style={{ paddingRight: 5 }}>
              <ActionIcon color='gray.0' size='lg' variant='transparent' onClick={props.minimizedSendBox}>
                <IconArrowsDiagonalMinimize2 size='1rem' />
              </ActionIcon>
            </div>
          )}
        </Group>
      </div>
      <div
        style={{
          flexBasis: '85%',
          position: 'relative',
          paddingLeft: 10,
          paddingRight: 10,
        }}
      >

        {openedOutboundChannel === 'LINKEDIN' ? (
          <Textarea
            minRows={5}
            maxRows={8}
            mt='xs'
            color='gray'
            placeholder='Your message...'
            value={messageDraft}
            onChange={(event) => _setMessageDraft(event.currentTarget.value)}
            onKeyDown={getHotkeyHandler([
              [
                "mod+Enter",
                () => {
                  sendMessage();
                },
              ],
            ])}
          />
        ) : (
          <Box mt='xs'>
            <RichTextArea
              onChange={(value, rawValue) => {
                messageDraftRichRaw.current = rawValue;
                messageDraftEmail.current = value;
              }}
              value={messageDraftRichRaw.current}
              height={110}
            />
          </Box>
        )}

        <Flex justify='space-between' align='center' mt='xs'>
          <Group>
            <Button.Group>
              <Button
                leftIcon={<IconWriting size='1rem' />}
                variant='outline'
                color="gray.8"
                radius={theme.radius.lg}
                size='xs'
                onClick={async () => {
                  setMsgLoading(true);
                  if (openedOutboundChannel === 'LINKEDIN') {
                    const result = await generateAIFollowup(userToken, props.prospectId, selectedBumpFramework);
                    setMessageDraft(result.msg);
                    setAiMessage(result.msg);
                    setAiGenerated(result.aiGenerated);
                  } else if (openedOutboundChannel === 'EMAIL') {
                    if (!currentConvoEmailThread) {
                      showNotification({
                        id: 'send-email-message-error',
                        title: 'Error',
                        message: 'Please select an email thread',
                        color: 'red',
                        autoClose: false,
                      })
                      setMsgLoading(false);
                      return;
                    }
                    const result = await generateAIEmailReply(userToken, props.prospectId, currentConvoEmailThread.nylas_thread_id, selectedEmailSequenceStep)
                    // Clean the result
                    const message = result.message.replaceAll('\n', `<br />`)
                    messageDraftEmail.current = message
                    setMessageDraft(message)
                    setAiMessage(message);
                    setAiGenerated(result.aiGenerated);
                  }
                  setMsgLoading(false);
                }}
              >
                Generate {openedOutboundChannel === 'LINKEDIN' ? 'Message' : 'Email'}
              </Button>
              <Select
                withinPortal
                placeholder={bumpFrameworks.length > 0 ? "Select Framework" : "No Frameworks"}
                radius={0}
                size='xs'
                data={
                  openedOutboundChannel === 'LINKEDIN' ? (
                    bumpFrameworks.length > 0 ? bumpFrameworks.map((bf: BumpFramework) => {
                      return {
                        value: bf.id + "",
                        label: (bf.default ? "🟢 " : "⚪️ ") + bf.title,
                      };
                    }) : []
                  ) : (
                    emailSequenceSteps.length > 0 ? emailSequenceSteps.map((step: EmailSequenceStep) => {
                      return {
                        value: step.id + "",
                        label: (step.default ? "🟢 " : "⚪️ ") + step.title,
                      };
                    }) : []
                  )

                }
                styles={{
                  input: { borderColor: 'black', borderRight: '0', borderLeft: '0' },
                  dropdown: { minWidth: 150 }
                }}
                onChange={(value) => {
                  if (openedOutboundChannel === 'LINKEDIN') {
                    const selected = bumpFrameworks.find((bf) => bf.id === parseInt(value as string));
                    if (selected) {
                      setBumpFramework(selected);
                    }
                  } else if (openedOutboundChannel === 'EMAIL') {
                    const selected = emailSequenceSteps.find((step) => step.id === parseInt(value as string));
                    if (selected) {
                      setEmailSequenceStep(selected);
                    }
                  }

                }}
                value={selectedBumpFramework ? selectedBumpFramework.id + "" : undefined}
              />
              <Tooltip label={selectedBumpFramework ? `Manage '${selectedBumpFramework.title}'` : `Configure Msg Gen`} withArrow>
                <Button
                  variant="outline"
                  color="gray.8"
                  radius={theme.radius.lg}
                  size='xs'
                  onClick={() => setOpenBumpFrameworks(true)}
                >
                  {selectedBumpFramework ? (<IconSettingsFilled size="1.225rem" />) : (<IconSettings size="1.225rem" />)}
                </Button>
              </Tooltip>
            </Button.Group>
          </Group>
          <Button leftIcon={<IconSend size='1rem' />} radius={theme.radius.lg} size='xs'
            onClick={() => sendMessage()}
          >
            Send
          </Button>
        </Flex>
        {aiGenerated && (
          <AutoBumpFrameworkInfo
            useBumpFramework={selectedBumpFramework !== undefined}
            bump_title={selectedBumpFramework?.title || 'None'}
            bump_description={selectedBumpFramework?.description || 'No framework'}
            bump_length={selectedBumpFramework?.bump_length || 'No length'}
            account_research_points={selectedBumpFramework?.account_research || []}
            bump_number_sent={selectedBumpFramework?.etl_num_times_used}
            bump_number_converted={selectedBumpFramework?.etl_num_times_converted}
          />
        )}
      </div>
    </Paper>
  );
});
