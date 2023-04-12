import {
  createStyles,
  Text,
  Avatar,
  Group,
  TypographyStylesProvider,
  Paper,
  Badge,
  useMantineTheme,
  Title,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { openContextModal } from "@mantine/modals";
import { nameToInitials, valueToColor } from "@utils/general";
import _ from "lodash";

const useStyles = createStyles((theme) => ({
  comment: {
    padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
    marginTop: `5px`,
    marginBottom: `5px`,
  },

  body: {
    paddingTop: 5,
    fontSize: theme.fontSizes.sm,
  },

  content: {
    "& > p:last-child": {
      marginBottom: 0,
    },
  },
}));

export default function EmailThreadEntry(props: {
  name: string;
  postedAt: string;
  body: string;
  threadId: string;
  prospectId: number;
}) {
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const { hovered, ref } = useHover();
  return (
    <Paper
      ref={ref}
      withBorder
      radius="md"
      className={classes.comment}
      sx={{
        position: "relative",
        filter: hovered ? "brightness(125%)" : "brightness(100%)",
        cursor: "pointer",
      }}
      onClick={() => {
        openContextModal({
          modal: "viewEmailThread",
          title: <Title order={3}>{props.name}</Title>,
          innerProps: { prospectId: props.prospectId, threadId: props.threadId },
        });
      }}
    >
      <Title order={5}>{props.name}</Title>
      <Text
        size="xs"
        color="dimmed"
        sx={{ position: "absolute", top: 8, right: 12 }}
      >
        {props.postedAt}
      </Text>

      <TypographyStylesProvider className={classes.body}>
        <div
          className={classes.content}
          dangerouslySetInnerHTML={{ __html: _.truncate(props.body, {
            'length': 100,
            'separator': ' '
          }) }}
        />
      </TypographyStylesProvider>
    </Paper>
  );
}
