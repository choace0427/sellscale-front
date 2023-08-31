import { useState } from "react";
import {
  AppShell,
  Navbar,
  Header,
  Burger,
  useMantineTheme,
  Container,
  Text,
  Box,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { NAV_BAR_SIDE_WIDTH, NAV_BAR_TOP_WIDTH, SCREEN_SIZES } from "@constants/data";
import { useRecoilValue } from "recoil";
import { isLoggedIn } from "@auth/core";
import { userDataState } from "@atoms/userAtoms";
import { version } from '../../../package.json';
import SideNavbar from "./SideNavbar";
import { currentProjectState } from "@atoms/personaAtoms";

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = useMantineTheme();

  const userData = useRecoilValue(userDataState);
  const currentProject = useRecoilValue(currentProjectState);

  const smScreenOrLess = useMediaQuery(
    `(max-width: ${SCREEN_SIZES.SM})`,
    false,
    { getInitialValueInEffect: true }
  );

  const isMobileView = smScreenOrLess;

  const [navOpened, setNavOpened] = useState(false);

  return (
    <AppShell
      className={"h-full"}
      fixed={true}
      navbar={
        <>
          {isLoggedIn() && (
            <SideNavbar />
          )}
        </>
      }
      header={
        undefined
        /*
        isMobileView ? (
          <Header height={NAV_BAR_TOP_WIDTH}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              <Container p={12} m={0}>
                <Burger
                  opened={navOpened}
                  onClick={() => setNavOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[5]}
                />
              </Container>

              <Container>
                <LogoFull />
              </Container>

              <Container
                p={12}
                m={0}
                className="cursor-pointer"
                onClick={() => openSpotlight()}
              >
                <IconSearch size={22} />
              </Container>
            </div>
          </Header>
        ) : (
          <></>
        )*/
      }
      styles={(theme) => ({
        main: {
          padding: 0,
          marginTop: 0, //isMobileView ? NAV_BAR_TOP_WIDTH : 0,
          marginLeft: 0, //isMobileView ? 0 : NAV_BAR_SIDE_WIDTH,
          height: `100vh`,
        },
        body: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          backgroundSize: "cover",
        },
      })}
    >
      <main style={{
        overflowY: "auto",
        height: "100vh",
      }}>{children}</main>
    </AppShell>
  );
}
