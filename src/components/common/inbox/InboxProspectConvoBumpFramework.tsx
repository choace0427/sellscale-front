import { openedBumpFameworksState, openedProspectIdState, selectedBumpFrameworkState } from '@atoms/inboxAtoms';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import TextWithNewlines from '@common/library/TextWithNewlines';
import loaderWithText from '@common/library/loaderWithText';
import {
  Button,
  Flex,
  Group,
  Paper,
  Title,
  Text,
  Textarea,
  useMantineTheme,
  Divider,
  Tabs,
  ActionIcon,
  Badge,
  Container,
  Avatar,
  Stack,
  ScrollArea,
  LoadingOverlay,
  Center,
  Modal,
} from '@mantine/core';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { BumpFramework, LinkedInMessage, Prospect, ProspectShallow } from 'src';
import { showNotification } from '@mantine/notifications';
import { postBumpGenerateResponse } from '@utils/requests/postBumpGenerateResponse';
import _, { String } from 'lodash';
import SelectBumpInstruction from '@common/bump_instructions/SelectBumpInstruction';
import { API_URL } from '@constants/data';
import { prospectDrawerStatusesState } from '@atoms/prospectAtoms';


export const generateAIFollowup = async (userToken: string, prospectId: number, bumpFramework: BumpFramework | undefined) => {

  const result = await postBumpGenerateResponse(
    userToken,
    prospectId,
    bumpFramework?.id,
    bumpFramework?.account_research?.join('\n') || '',
    bumpFramework?.bump_length || 'MEDIUM',
  );

  if (result.status === 'success') {
    showNotification({
      id: 'generate-ai-followup-success',
      title: 'Success',
      message: 'Message generated.',
      color: 'green',
      autoClose: true,
    });
    return { msg: result.data.message, aiGenerated: true };
  } else {
    showNotification({
      id: 'generate-ai-followup-error',
      title: 'Error',
      message: 'Failed to generate message. Please try again later.',
      color: 'red',
      autoClose: false,
    });
    return { msg: '', aiGenerated: false };
  }
};


export const autoFillBumpFrameworkAccountResearch = (userToken: string, prospectId: number) => {
  return fetch(`${API_URL}/research/personal_research_points?prospect_id=` + prospectId, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  })
    .then((res) => {
      return res.json();
    })
    .then(async (res) => {
      let research_str = '';
      for (var i = 0; i < res.length; i++) {
        research_str += `- ${res[i].reason}\n`;
      }
      return research_str.trim();
    })
    .catch((err) => {
      console.log(err);
      return '';
    });
};


export default function InboxProspectConvoBumpFramework(props: {
    prospect: ProspectShallow;
    messages: LinkedInMessage[];
    onClose?: () => void;
}) {

  const [open, setOpen] = useRecoilState(openedBumpFameworksState);

  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);
  const [bumpFramework, setBumpFramework] = useRecoilState(selectedBumpFrameworkState);

  const [prospectDrawerStatuses, setProspectDrawerStatuses] = useRecoilState(prospectDrawerStatusesState);

  // Update the prospectDrawerStatusesState global var for the bump framework modal (since it uses it)
  useEffect(() => {
    if(open){
      setProspectDrawerStatuses({
        overall: props.prospect.overall_status,
        linkedin: props.prospect.linkedin_status,
        email: props.prospect.email_status,
      })
    }
  }, [open]);

  return (
    <Modal
      opened={open}
      onClose={() => {
        setOpen(false);
        props.onClose && props.onClose();
      }}
      title={<Title order={4}>Message Generation Config</Title>}
    > 
      <SelectBumpInstruction
        client_sdr_id={userData.id}
        prospect_id={props.prospect.id}
        persona_id={props.prospect.archetype_id}
        overall_status={props.prospect.overall_status}
        account_research={bumpFramework?.account_research?.join('\n') || ''}
        convo_history={props.messages}
        onBumpFrameworkSelected={async (newBF, length) => {
          if (newBF) {
            // Autofill generated account research
            const newAccountResearch = await autoFillBumpFrameworkAccountResearch(userToken, props.prospect.id);
            setBumpFramework({ ...newBF, bump_length: length as string, account_research: newAccountResearch.split('\n') });
          }
        }}
        onAccountResearchChanged={(research) => {
          setBumpFramework((prev) => {
            if(prev){
              return { ...prev, accountResearch: research };
            }
          });
        }}
        manualBumpFramework={bumpFramework}
      />
    </Modal>
  );
}
