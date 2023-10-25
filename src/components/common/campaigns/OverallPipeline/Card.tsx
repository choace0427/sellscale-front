import { Box, Flex, Text } from "@mantine/core";
import { IconChevronsRight } from "@tabler/icons-react";
import React, { ReactNode } from "react";
const blue = "#228be6";

const Card: React.FC<{
  title: string;
  icon: ReactNode;
  value: number;
  hook: boolean;
}> = ({ title, icon, value, hook }) => {
  return (
    <Flex
      justify={"center"}
      align={"center"}
      direction={"column"}
      pos={"relative"}
      px={"0.5rem"}
      style={{
        flex: 1,
        borderRightWidth: hook ? "2px" : 0,
        borderLeft: 0,
        borderStyle: "solid",
        borderImage: `linear-gradient(#FFFFFF, ${blue}, #FFFFFF) 0 100%`,
      }}
    >
      <Box justify={"center"} align={"center"} gap={"0.5rem"} mb={"0.5rem"}>
        <Flex>
          {icon}
          <Text size={"0.7rem"} color="gray.6" fw={600} ml='4px'>
            {title}
          </Text>
        </Flex>

        <Text weight={700} size={"0.75rem"}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

export default Card;
