import { List, ThemeIcon, Text, Container, Stack, Flex, Title, useMantineTheme, Drawer, Group, Button } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useContext, useState } from "react";
import { useRecoilState } from "recoil";
import { SCREEN_SIZES } from "../../constants/data";
import { UserContext } from "../../contexts/user";
import { activePersonaState, linkedInCTAsDrawerOpenState, uploadDrawerOpenState } from "../atoms/personaAtoms";
import PageFrame from "../common/PageFrame";
import PersonaCard from "../common/persona/PersonaCard";
import LinkedInCTAsDrawer from "../drawers/LinkedInCTAsDrawer";
import PersonaUploadDrawer from "../drawers/PersonaUploadDrawer";

const PERSONAS = [{ value: '1', name: "Persona 1" }, { value: '2', name: "Persona 2" }, { value: '3', name: "Persona 3" }]

export default function AboutPage() {

  const theme = useMantineTheme();
  const smScreenOrLess = useMediaQuery(`(max-width: ${SCREEN_SIZES.SM})`);

  const [activePersona, setActivePersona] = useRecoilState(activePersonaState);

  return (
    <>
      <Container>
        <PageFrame>
          {PERSONAS.filter((persona) => persona.value === activePersona).map((persona) => (
            // Should always be only 1 active card
            <PersonaCard
              key={persona.value}
              value={persona.value}
              name={persona.name}
              active={true}
            />
          ))}
          {PERSONAS.filter((persona) => persona.value !== activePersona).map((persona) => (
            <PersonaCard
              key={persona.value}
              value={persona.value}
              name={persona.name}
            />
          ))}
        </PageFrame>
      </Container>
      
      <LinkedInCTAsDrawer />
      <PersonaUploadDrawer />
    </>
  );

}
