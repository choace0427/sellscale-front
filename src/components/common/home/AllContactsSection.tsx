import { Container, useMantineTheme } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons";
import { useMediaQuery } from "@mantine/hooks";
import { SCREEN_SIZES } from "../../../constants/data";
import PipelineSelector, { icons } from "../pipeline/PipelineSelector";
import ProspectTable_old from "../pipeline/ProspectTable_old";
import PageFrame from "@common/PageFrame";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import { useLoaderData } from "react-router-dom";
import { prospectDrawerIdState, prospectDrawerOpenState } from "@atoms/prospectAtoms";
import { useEffect } from "react";

function getPipelineSelectorData(data: any){
  return new Map()
  .set('all', {
    title: "All Prospects",
    description: "All prospects in the pipeline",
    icon: IconUserPlus,
    value: data?.pipeline_data?.SELLSCALE.SENT_OUTREACH || "-",
    color: "blue",
  })
  .set('accepted', {
    title: "Accepted",
    description: "Accepted prospects in the pipeline",
    icon: IconUserPlus,
    value: data?.pipeline_data?.SELLSCALE.ACCEPTED || "-",
    color: "green",
  })
  .set('bumped', {
    title: "Bumped",
    description: "Bumped prospects in the pipeline",
    icon: IconUserPlus,
    value: data?.pipeline_data?.SELLSCALE.BUMPED || "-",
    color: "orange",
  })
  .set('active', {
    title: "Active Convos",
    description: "Active conversations in the pipeline",
    icon: IconUserPlus,
    value: data?.pipeline_data?.SELLSCALE.ACTIVE_CONVO || "-",
    color: "yellow",
  })
  .set('demo', {
    title: "Demo Set",
    description: "Demo set prospects in the pipeline",
    icon: IconUserPlus,
    value: data?.pipeline_data?.SELLSCALE.DEMO || "-",
    color: "purple",
  });
}

export default function AllContactsSection() {

  //const { prospectId } = useLoaderData() as { prospectId: string };
  const [_opened, setOpened] = useRecoilState(prospectDrawerOpenState);
  const [_prospectId, setProspectId] = useRecoilState(prospectDrawerIdState);
  /*
  useEffect(() => {
    if(prospectId && prospectId.trim().length > 0){
      setProspectId(+prospectId.trim())
      setOpened(true);
    }
  }, [prospectId]);
  */

  const userToken = useRecoilValue(userTokenState);

  const { data, isFetching, refetch } = useQuery({
    queryKey: [`query-pipeline-details`],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URI}/analytics/pipeline/all_details`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        }
      );
      if(response.status === 401){ logout() }
      const res = await response.json();

      return res;
    },
  });

  const PIPELINE_SELECTOR_DATA = getPipelineSelectorData(data);
  return (
    <div>
      <PipelineSelector data={PIPELINE_SELECTOR_DATA} />
      <Container pt={15} px={0}>
<<<<<<< HEAD
        <ProspectTable_old />
=======
        <ProspectTable_old selectorData={PIPELINE_SELECTOR_DATA} />
>>>>>>> 3ca1f7a464f8a794dc953ea74e18d06d9b736570
      </Container>
    </div>
  );
}
