import { userTokenState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import {
  List,
  ThemeIcon,
  Text,
  Container,
  Stack,
  Flex,
  Title,
  useMantineTheme,
  Drawer,
  Group,
  Divider,
  Paper,
  LoadingOverlay,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { setPageTitle } from "@utils/documentChange";
import { useQuery } from "react-query";
import { useRecoilState, useRecoilValue } from "recoil";
import { Archetype } from "src/main";
import { SCREEN_SIZES } from "../../constants/data";
import PageFrame from "../common/PageFrame";
import PersonaCard from "../common/persona/PersonaCard";
import LinkedInCTAsDrawer from "../drawers/LinkedInCTAsDrawer";
import PersonaUploadDrawer from "../drawers/PersonaUploadDrawer";

export default function PersonaPage() {
  setPageTitle(`Personas`);

  const userToken = useRecoilValue(userTokenState);

  const { data, isFetching, refetch } = useQuery({
    queryKey: [
      `query-personas-data`
    ],
    queryFn: async () => {

      const response = await fetch(
        `${process.env.REACT_APP_API_URI}/client/archetype/get_archetypes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      if (response.status === 401) {
        logout();
      }
      const res = await response.json();
      if (!res || !res.archetypes) {
        return [];
      }

      let result = res.archetypes as Archetype[];
      // Sort by number of prospects
      return result.sort((a, b) => {
        return b.performance.total_prospects - a.performance.total_prospects;
      });
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <PageFrame>
        <Paper withBorder p="md" radius="md">
          <LoadingOverlay visible={isFetching} overlayBlur={2} />
          {data?.filter((p) => p.active).map(
            (persona) => (
              <PersonaCard
                key={persona.id}
                archetype={persona}
                refetch={refetch}
              />
            )
          )}
          <Divider my="sm" />
          {data?.filter((p) => !p.active).map(
            (persona) => (
              <PersonaCard
                key={persona.id}
                archetype={persona}
                refetch={refetch}
              />
            )
          )}
        </Paper>
      </PageFrame>
      <LinkedInCTAsDrawer />
      <PersonaUploadDrawer />
    </>
  );
}
