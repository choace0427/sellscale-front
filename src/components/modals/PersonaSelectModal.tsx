import {
  Anchor,
  Button,
  Group,
  Text,
  Paper,
  useMantineTheme,
  Title,
  Flex,
  Textarea,
  LoadingOverlay,
  Menu,
  Container,
  Box,
  ActionIcon,
  Stack,
  ScrollArea,
  Badge,
  Center,
  ThemeIcon,
} from "@mantine/core";
import { ContextModalProps, openContextModal } from "@mantine/modals";
import { ReactNode, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";
import { Archetype, PersonaOverview } from "src";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import createCTA from "@utils/requests/createCTA";
import CTAGeneratorExample from "@common/cta_generator/CTAGeneratorExample";
import { DateInput } from "@mantine/dates";
import { currentProjectState } from "@atoms/personaAtoms";
import { isLoggedIn } from "@auth/core";
import { getPersonasOverview } from "@utils/requests/getPersonas";
import { useNavigate } from "react-router-dom";
import { IconArrowsLeftRight, IconCopy, IconDots, IconMessageCircle, IconPhoto, IconPower, IconSearch, IconSettings, IconStack3, IconTrash } from "@tabler/icons";
import { useHover } from "@mantine/hooks";
import { navigateToPage } from "@utils/documentChange";
import _ from "lodash";
import { openedProspectIdState } from "@atoms/inboxAtoms";

export default function PersonaSelectModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{}>) {
  const theme = useMantineTheme();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [_, setCurrentProject] = useRecoilState(currentProjectState);
  const userToken = useRecoilValue(userTokenState);
  const [projects, setProjects] = useState<PersonaOverview[]>([]);
  const [openedProspectId, setOpenedProspectId] = useRecoilState(openedProspectIdState);

  useEffect(() => {
    (async () => {
      if (!isLoggedIn()) return;
      const response = await getPersonasOverview(userToken);
      const result =
        response.status === "success"
          ? (response.data as PersonaOverview[])
          : [];
      setProjects(result);

      // const firstActiveProject = result.find((project) => project.active);
      // if (firstActiveProject && !window.location.href.includes("/all")) {
      //   setCurrentProject(firstActiveProject);
      // }

      setLoading(false);
    })();
  }, []);

  const unassignedPersona = projects.find(
    (project) => project.is_unassigned_contact_archetype
  );

  return (
    <Paper
      p={0}
      h={"70vh"}
      style={{
        position: "relative",
      }}
    >
      <LoadingOverlay visible={loading} />
      <Group position="apart" sx={{ flexDirection: "column", height: "100%" }}>
        <ScrollArea h="60vh" w="100%">
          <Stack py={4}>
            {projects
              .filter((project) => !project.is_unassigned_contact_archetype)
              .map((project, index) => (
                <PersonaOption
                  key={index}
                  persona={project}
                  onClick={() => {
                    setOpenedProspectId(-1);
                    setCurrentProject(project);
                    navigateToPage(navigate, `/inbox`);
                    context.closeModal(id);
                  }}
                  onSettingsClick={() => {
                    navigateToPage(navigate, `/persona/settings`);
                    context.closeModal(id);
                  }}
                  onCloneClick={() => {
                    openContextModal({
                      modal: "clonePersona",
                      title: <Title order={3}>Clone Persona: {project.name}</Title>,
                      innerProps: { persona: project },
                    });
                  }}
                />
              ))}
          </Stack>
        </ScrollArea>
        {unassignedPersona && (
          <Flex gap={10} wrap="nowrap" w={"100%"} h={30}>
            <Box sx={{ flexBasis: "5%" }}>
              <ThemeIcon variant="light">
                <IconStack3 size="1rem" color="blue" stroke={1.5} />
              </ThemeIcon>
            </Box>
            <Box
              sx={{
                flexBasis: "95%",
                cursor: "pointer",
              }}
              onClick={() => {
                setOpenedProspectId(-1);
                setCurrentProject(unassignedPersona);
                navigateToPage(navigate, `/inbox`);
                context.closeModal(id);
              }}
            >
              <Text
                fz="lg"
                span
                p={4}
                sx={{
                  border: "none",
                  borderRadius: 10,
                  ":hover": {
                    border: "solid",
                  },
                }}
              >
                {unassignedPersona.name}
              </Text>
            </Box>
          </Flex>
        )}
      </Group>
    </Paper>
  );
}

function PersonaOption(props: {
  persona: PersonaOverview;
  onClick?: () => void;
  onSettingsClick?: () => void;
  onCloneClick?: () => void;
  onActivateClick?: () => void;
}) {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  const { hovered, ref } = useHover();

  return (
    <Flex gap={10} wrap="nowrap" w={"100%"} h={30}>
      <Box sx={{ flexBasis: "15%" }}>
        <Center>
          <Badge color={props.persona.active ? "teal" : "red"}>
            {props.persona.active ? "Active" : "Inactive"}
          </Badge>
        </Center>
      </Box>
      <Box
        ref={ref}
        sx={{
          flexBasis: "78%",
          cursor: "pointer",
        }}
        onClick={() => {
          props.onClick && props.onClick();
        }}
      >
        <Text
          fz="lg"
          span
          p={4}
          sx={{
            border:
              hovered || currentProject?.id === props.persona.id
                ? "solid"
                : "none",
            borderRadius: 10,
          }}
        >
          {_.truncate(props.persona.name, { length: 50 })}
        </Text>
      </Box>
      <Box sx={{ flexBasis: "7%" }}>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon radius="xl">
              <IconDots size="1.125rem" />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item onClick={props.onSettingsClick} icon={<IconSettings size={14} />}>Settings</Menu.Item>
            <Menu.Item onClick={props.onCloneClick} icon={<IconCopy size={14} />}>Clone</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Flex>
  );
}
