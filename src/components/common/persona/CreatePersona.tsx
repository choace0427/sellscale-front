import React from 'react';
import createPersona from '@utils/requests/createPersona';
import { Button, Card, Text, Title } from '@mantine/core';
import { useRecoilState } from 'recoil';
import { userTokenState } from '@atoms/userAtoms';
import { currentProjectState } from '@atoms/personaAtoms';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { navigateToPage } from '@utils/documentChange';
import { createLiTemplate } from '@utils/requests/linkedinTemplates';
import { WindowScrollController } from '@fullcalendar/core/internal';
import { useQuery } from '@tanstack/react-query';
import getResearchPointTypes from '@utils/requests/getResearchPointTypes';
import { ResearchPointType } from 'src';

type PropsType = {
  createPersona: {
    name: string;
    ctas: string[];
    fitReason: string;
    icpMatchingPrompt: string;
    contactObjective: string;
    contractSize: number;
    templateMode: boolean;
  };
};

export default function CreatePersona(props: PropsType) {
  const [creatingPersona, setCreatingPersona] = React.useState(false);
  const [userToken] = useRecoilState(userTokenState);
  const [currentProject, setCurrentProject] = useRecoilState(currentProjectState);
  const navigate = useNavigate();

  const { data: researchPointTypes } = useQuery({
    queryKey: [`query-get-research-point-types`],
    queryFn: async () => {
      const response = await getResearchPointTypes(userToken);
      return response.status === 'success' ? (response.data as ResearchPointType[]) : [];
    },
    refetchOnWindowFocus: false,
  });

  const createPersonaHandler = async () => {
    setCreatingPersona(true);
    const result = await createPersona(
      userToken,
      props.createPersona.name,
      props.createPersona.ctas,
      {
        fitReason: props.createPersona.fitReason,
        icpMatchingPrompt: props.createPersona.icpMatchingPrompt,
        contactObjective: props.createPersona.contactObjective,
        contractSize: props.createPersona.contractSize,
        template_mode: props.createPersona.templateMode,
      }
    );
    if (result.status === 'error') {
      console.error('Failed to create persona & CTAs');
      return;
    }
    setCreatingPersona(false);
    showNotification({
      title: 'Persona created!',
      message: 'You can now create a segment to import new contacts into... redirecting now...',
      color: 'teal',
    });

    // Create default template
    if (props.createPersona.templateMode) {
      await createLiTemplate(
        userToken,
        result.data,
        'Great to connect!',
        `Hi [first name]! [personalization related to them]. It’s great to connect.`,
        true,
        // researchPointTypes?.map((rpt) => rpt.name) || [], WE SHOULD LET THE BACKEND USE THE DEFAULT RESEARCH POINTS
        [],
        ''
      );
    }

    setTimeout(() => {
      // window.location.href = `/contacts/find?campaign_id=${result.data}`;
      window.location.href = '/contacts/overview';
    }, 3000);

    setCurrentProject(result.data);
    return result.data as number;
  };

  return (
    <Card>
      <Button
        disabled={!props.createPersona?.name || !props.createPersona.contactObjective}
        onClick={() => createPersonaHandler()}
        loading={creatingPersona}
      >
        Create Campaign
      </Button>
    </Card>
  );
}
//
