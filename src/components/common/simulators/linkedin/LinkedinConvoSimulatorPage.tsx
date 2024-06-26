import { currentProjectState } from '@atoms/personaAtoms';
import { useRecoilState, useRecoilValue } from 'recoil'
import LinkedInConvoSimulator from './LinkedInConvoSimulator';
import PageFrame from '@common/PageFrame';
import { Card } from '@mantine/core';

export const LinkedinConvoSimulatorPage = () => {
    const currentProject = useRecoilValue(currentProjectState);

    if (!currentProject) return null;

    return (
        <PageFrame>
            <Card>
                <LinkedInConvoSimulator personaId={currentProject?.id} />
            </Card>
        </PageFrame>
    );
}