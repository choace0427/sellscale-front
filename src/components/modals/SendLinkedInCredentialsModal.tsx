import {
  Anchor,
  Button,
  Group,
  Text,
  Paper,
  useMantineTheme,
  Avatar,
  Stack,
  Select,
  Collapse,
  Divider,
  Container,
  Center,
  ActionIcon,
  TextInput,
  Flex,
  Textarea,
  FocusTrap,
  LoadingOverlay,
  PasswordInput,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropzone, DropzoneProps, MIME_TYPES } from "@mantine/dropzone";
import {
  IconUpload,
  IconX,
  IconTrashX,
  IconFileDescription,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconPlus,
  IconUsers,
  IconLock,
  IconUser,
} from "@tabler/icons";
import { DataTable } from "mantine-datatable";
import FileDropAndPreview from "./upload-prospects/FileDropAndPreview";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { userTokenState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import { Archetype } from "src/main";
import { EMAIL_REGEX } from "@constants/data";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

export default function SendLinkedInCredentialsModal({
  context,
  id,
  innerProps,
}: ContextModalProps) {
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userToken = useRecoilValue(userTokenState);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {

    setLoading(true);

    const response = await fetch(`${process.env.REACT_APP_API_URI}/integration/linkedin/send-credentials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: values.username,
        password: values.password,
      }),
    });
    const res = await response.json();

    setLoading(false);

    if(response.status === 200){
      showNotification({
        id: 'linkedin-credentials-sent',
        title: 'Credentials successfully saved',
        message: 'It may take up to 24 hours for everything to be connected.',
        color: 'blue',
        autoClose: false,
      });
    } else {
      showNotification({
        id: 'linkedin-credentials-sent-error',
        title: 'Error while saving credentials',
        message: 'Please contact an administrator.',
        color: 'red',
        autoClose: false,
      });
    }
    
    context.closeModal(id);

  };

  return (
    <Paper
      p={0}
      style={{
        position: "relative",
        backgroundColor: theme.colors.dark[7],
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loading} />

        <Text>While your credentials will be protected securely, we recommend first setting your LinkedIn password to something unique and non-identifiable.</Text>

        <TextInput
          mt="md"
          required
          placeholder='LinkedIn Username'
          label='Username'
          icon={<IconUser size={16} stroke={1.5} />}
          {...form.getInputProps('username')}
        />

        <PasswordInput
          mt="md"
          required
          placeholder='LinkedIn Password'
          label='Password'
          icon={<IconLock size={16} stroke={1.5} />}
          {...form.getInputProps('password')}
        />

        {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )}

        {(
          <Group position="apart" mt="xl">
            <Anchor
              component="button"
              type="button"
              color="dimmed"
              size="sm"
            >
              {/* Need help? */}
            </Anchor>

            <Button variant="light" radius="md" type="submit">
              Complete
            </Button>

          </Group>
        )}
      </form>
    </Paper>
  );
}
