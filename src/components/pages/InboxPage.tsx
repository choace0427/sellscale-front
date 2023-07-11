import { nurturingModeState } from "@atoms/inboxAtoms";
import { currentProjectState } from "@atoms/personaAtoms";
import { prospectShowPurgatoryState } from "@atoms/prospectAtoms";
import { userTokenState, userDataState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import InboxProspectConvo from "@common/inbox/InboxProspectConvo";
import InboxProspectDetails from "@common/inbox/InboxProspectDetails";
import InboxProspectList from "@common/inbox/InboxProspectList";
import { populateInboxNotifs } from "@common/inbox/utils";
import { API_URL } from "@constants/data";
import { Grid } from "@mantine/core";
import { NAV_HEADER_HEIGHT } from "@nav/MainHeader";
import { useQuery } from "@tanstack/react-query";
import { setPageTitle } from "@utils/documentChange";
import { getProspects } from "@utils/requests/getProspects";
import { useRecoilValue } from "recoil";
import { Prospect } from "src";

export const INBOX_PAGE_HEIGHT = `calc(100vh - ${NAV_HEADER_HEIGHT}px)`;

export default function InboxPage(props: { all?: boolean }) {
  setPageTitle("Inbox");

  const userToken = useRecoilValue(userTokenState);
  const nurturingMode = useRecoilValue(nurturingModeState);
  const currentProject = useRecoilValue(currentProjectState);

  const { data, isFetching, refetch } = useQuery({
    queryKey: [
      `query-dash-get-prospects`,
      { nurturingMode },
    ],
    queryFn: async ({ queryKey }) => {
      // @ts-ignore
      // eslint-disable-next-line
      const [_key, { nurturingMode }] = queryKey;

      const response = await getProspects(
        userToken,
        undefined,
        "SELLSCALE",
        10000, // TODO: Maybe use pagination method instead
        nurturingMode ? ['ACCEPTED', 'BUMPED'] : ['ACTIVE_CONVO', 'DEMO'],
        'ALL',
        props.all ? undefined : currentProject?.id,
      );
      return response.status === 'success' ? response.data as Prospect[] : [];
      
    },
    refetchOnWindowFocus: false,
  });
  const prospects = data ?? [];

  if (prospects.length > 0) {
    const notifCount = populateInboxNotifs(prospects);
    setPageTitle(`Inbox (${notifCount})`);
  }
  
  return (
    <Grid columns={100} gutter={0} h={INBOX_PAGE_HEIGHT} sx={{ overflow: 'hidden' }}>
      <Grid.Col span={27} >
        <InboxProspectList prospects={prospects} isFetching={isFetching} all={props.all} />
      </Grid.Col>
      <Grid.Col span={46}>
        <InboxProspectConvo prospects={prospects} />
      </Grid.Col>
      <Grid.Col span={27}>
        <InboxProspectDetails prospects={prospects} />
      </Grid.Col>
    </Grid>
  );

}
