import { useContext, useState } from "react";
import { IconSun, IconMoonStars } from "@tabler/icons";
import {
  AppShell,
  Navbar,
  Header,
  Group,
  ActionIcon,
  useMantineColorScheme,
  MediaQuery,
  Burger,
  useMantineTheme,
  Button,
  Title,
} from "@mantine/core";
import { Logo } from "./nav/Logo";
import { useMediaQuery } from "@mantine/hooks";
import { SCREEN_SIZES } from "../constants/data";
import { SearchBar } from "./nav/SearchBar";
import { SidePanel } from "./nav/SidePanel";
import { openContextModal } from "@mantine/modals";
import { UserContext } from "../contexts/user";
import ProfileTab from "./common/ProfileTab";
import { useNavigate } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const smScreenOrLess = useMediaQuery(`(max-width: ${SCREEN_SIZES.SM})`);
  const mdScreenOrLess = useMediaQuery(`(max-width: ${SCREEN_SIZES.MD})`);

  const [opened, setOpened] = useState(false);
  const hasSideNav =
    (smScreenOrLess && opened) || (!smScreenOrLess && mdScreenOrLess);
  const hasSideNavOverlay = hasSideNav && smScreenOrLess;

  return (
    <AppShell
      className={'h-full'}
      fixed={false}
      // Nav bar for mobile view
      navbar={
        <Navbar
          width={{ base: 200 }}
          p="xs"
          sx={{
            top: !hasSideNavOverlay ? 0 : undefined,
            display: hasSideNav ? "block" : "none",
            position: hasSideNavOverlay ? "absolute" : "relative",

            backdropFilter: "blur(8px)",
            // Add alpha channel to hex color (browser support: https://caniuse.com/css-rrggbbaa)
            backgroundColor:
              (theme.colorScheme === "dark"
                ? theme.colors.dark[8]
                : theme.colors.gray[0]) + "75",
          }}
        >
          {smScreenOrLess && (
            <Navbar.Section>
              <SearchBar isSmall={true} />
            </Navbar.Section>
          )}
          <Navbar.Section>
            <SidePanel />
          </Navbar.Section>
        </Navbar>
      }
      // Site header (& nav bar for desktop view)
      header={
        <Header height={60}>
          <Group
            sx={{ height: "100%", flexWrap: "nowrap" }}
            px={20}
            position="apart"
          >
            {/* Show burger menu if tablet or smaller */}
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
              />
            </MediaQuery>
            <Logo colorScheme={colorScheme} />

              {/* Show top nav buttons if desktop or larger */}
              {!mdScreenOrLess && (
                <Group spacing="xs">
                  <Button variant="subtle" color="gray" size="sm" onClick={() => navigate(`/`)}>
                    Home
                  </Button>

                  <Button variant="subtle" color="gray" size="sm" onClick={() => navigate(`/inbox`)}>
                    Inbox
                  </Button>

                  <Button variant="subtle" color="gray" size="sm" onClick={() => navigate(`/prospects`)}>
                    Prospects
                  </Button>

                  <Button variant="subtle" color="gray" size="sm" onClick={() => navigate(`/call-to-actions`)}>
                    CTAs
                  </Button>

                  <Button variant="subtle" color="gray" size="sm" onClick={() => navigate(`/campaigns`)}>
                    Campaigns
                  </Button>
                </Group>
              )}

            <Group>

              {/* Show search bar if larger than tablet */}
              {!smScreenOrLess && <SearchBar />}

              {!smScreenOrLess && <ProfileTab name="Benedict Cumberbatch" email="benny20@cubumberbatch.gmail.com" />}

              {/* Dark mode / light mode switch */}
              <ActionIcon
                variant="default"
                onClick={() => toggleColorScheme()}
                size={30}
                sx={{ borderRadius: "50px" }}
              >
                {colorScheme === "dark" ? (
                  <IconSun size={16} />
                ) : (
                  <IconMoonStars size={16} />
                )}
              </ActionIcon>
            </Group>
          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: {
          padding: 0,
          height: "calc(100vh - 60px)",
        },
        body: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          backgroundSize: "cover",
          overflowY: "auto",
        },
      })}
    >
      <main>{children}</main>
    </AppShell>
  );
}
