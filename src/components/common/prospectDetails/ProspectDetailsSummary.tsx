import { createStyles, Avatar, Text, Group } from "@mantine/core";
import {
  IconPhoneCall,
  IconAt,
  IconBriefcase,
  IconMail,
  IconSocial,
} from "@tabler/icons";

const useStyles = createStyles((theme) => ({
  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[5],
  },

  name: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },
}));

type ProspectDetailsSummaryProps = {
  full_name: string;
  title: string | null;
  email: string | null;
  linkedin: string | null;
  profile_pic: string | null;
};

export default function ProspectDetailsSummary(
  props: ProspectDetailsSummaryProps
) {
  const { classes } = useStyles();
  return (
    <div>
      <Group noWrap align='flex-start'>
        <Avatar
          src={
            props.profile_pic
              ? props.profile_pic
              : `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(props.full_name)}`
          }
          size={94}
          radius="md"
        />
        <div>
          <Group noWrap spacing={10} mt={3}>
            <IconBriefcase stroke={1.5} size={16} className={classes.icon} />
            <Text size="xs" color="dimmed">
              {props.title}
            </Text>
          </Group>

          {props.email && (
            <Group noWrap spacing={10} mt={5}>
              <IconMail stroke={1.5} size={16} className={classes.icon} />
              <Text size="xs" color="dimmed">
                {props.email}
              </Text>
            </Group>
          )}

          {props.linkedin && (
            <Group noWrap spacing={10} mt={5}>
              <IconSocial stroke={1.5} size={16} className={classes.icon} />
              <Text size="xs" color="dimmed">
                {props.linkedin}
              </Text>
            </Group>
          )}
        </div>
      </Group>
    </div>
  );
}
