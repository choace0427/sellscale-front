import React, { useEffect } from "react";
import {
  IconSearch,
  IconFilter,
  IconUsers,
  IconHome,
  IconSend,
  IconAnalyze,
  IconSettings,
  IconBrandLinkedin,
  IconMail,
} from "@tabler/icons";
import {
  ThemeIcon,
  UnstyledButton,
  Group,
  MantineTheme,
  Center,
  Text,
} from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import NavTab from "./NavTab";
import { useOs } from "@mantine/hooks";
import { openSpotlight } from "@mantine/spotlight";
import { useRecoilState, useRecoilValue } from "recoil";
import { navTabState } from "@atoms/navAtoms";
import { LogoFull, LogoIcon } from "@nav/Logo";
import useStyles from "../SearchBars.styles";
import { userDataState } from "@atoms/userAtoms";
import { navigateToPage } from "@utils/documentChange";

type PanelLinkProps = {
  icon: React.ReactNode;
  color: string;
  label: string;
  onClick: () => void;
  isActive: boolean;
};

function getHoverColor(theme: MantineTheme) {
  // Add alpha channel to hex color (browser support: https://caniuse.com/css-rrggbbaa)
  return (
    (theme.colorScheme === "dark"
      ? theme.colors.dark[6]
      : theme.colors.gray[0]) + "50"
  );
}

function PanelLink({ icon, color, label, onClick, isActive }: PanelLinkProps) {
  return (
    <UnstyledButton
      my={4}
      sx={(theme) => ({
        display: "block",
        width: "180px",
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colors.dark[0],

        "&:hover": {
          backgroundColor: getHoverColor(theme),
        },
        backgroundColor: isActive ? getHoverColor(theme) : "inherit",
      })}
      onClick={onClick}
    >
      <Group>
        <ThemeIcon color={color} variant="light" radius="xl">
          {icon}
        </ThemeIcon>
      </Group>
    </UnstyledButton>
  );
}

export default function SidePanel(props: { isMobile?: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const os = useOs();
  const { classes } = useStyles();

  const userData = useRecoilValue(userDataState);

  const [navTab, setNavTab] = useRecoilState(navTabState);
  const activeTab = location.pathname?.split("/")[1];

  useEffect(() => {
    setNavTab(activeTab.trim() === "" ? "home" : activeTab);
  }, [activeTab, setNavTab]);

  return (
    <>
      <div>
        {!props.isMobile && (
          <Center h={50}>
            <LogoFull size={23} />
          </Center>
        )}

        {!props.isMobile && (
          <NavTab
            icon={<IconSearch size={22} />}
            name="search"
            description={`Search | ${
              os === "undetermined" || os === "macos" ? "⌘" : "Ctrl"
            } + K`}
            onClick={() => openSpotlight()}
            dontChangeTab={true}
            sideContent={
              <Text weight={700} className={classes.shortcut} mx={4} truncate>
                {os === "undetermined" || os === "macos" ? "⌘" : "Ctrl"} + K
              </Text>
            }
          />
        )}

        <NavTab
          icon={<IconHome size={22} />}
          name="home"
          description="Go to home"
          onClick={() => navigateToPage(navigate, `/home`)}
        />

        <NavTab
          icon={<IconBrandLinkedin size={22} />}
          name="linkedin"
          description="View your LinkedIn outbound"
          onClick={() => navigateToPage(navigate, `/linkedin`)}
        />

        <NavTab
          icon={<IconMail size={22} />}
          name="email"
          description="View your email outbound"
          onClick={() => navigateToPage(navigate, `/email`)}
        />

        <NavTab
          icon={<IconUsers size={22} />}
          name="personas"
          description="Create target ICPs and upload new prospect lists"
          onClick={() => navigateToPage(navigate, `/personas`)}
        />

      </div>
    </>
  );
}
