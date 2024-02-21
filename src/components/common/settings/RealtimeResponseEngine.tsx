import { userDataState, userTokenState } from '@atoms/userAtoms';
import { syncLocalStorage } from '@auth/core';
import { Box, Card, Flex, Switch, Text, Title, UnstyledButton } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons';
import { updateClientSDR } from '@utils/requests/updateClientSDR';
import { booleanFilterFn, DataGrid, stringFilterFn } from 'mantine-data-grid';
import { useRecoilState, useRecoilValue } from 'recoil';

export default function RealtimeResponseEngine() {
  const [userData, setUserData] = useRecoilState(userDataState);
  const userToken = useRecoilValue(userTokenState);

  const sdrMetadata = userData?.meta_data as
    | {
        response_options?: {
          use_objections: boolean;
          use_next_steps: boolean;
          use_revival: boolean;
          use_questions: boolean;
          use_scheduling: boolean;
          use_circle_back: boolean;
        };
        [key: string]: any;
      }
    | undefined;

  const update = async (meta_data: Record<string, any>) => {
    const response = await updateClientSDR(
      userToken,
      undefined,
      undefined,
      undefined,
      undefined,
      meta_data
    );
    await syncLocalStorage(userToken, setUserData);
  };

  console.log(userData);

  const data = [
    {
      emoji: '👍🏽',
      label: 'Objection',
      key: 'use_objections',
      content:
        "When prospects have hesitations. SellScale's AI uses a top objection-handling model to save deals.",
      automated: sdrMetadata?.response_options?.use_objections ?? true,
    },
    {
      emoji: '🔥',
      label: 'Next steps',
      key: 'use_next_steps',
      content:
        'When further action is required in the convo. SellScale AI will do its best to engage.',
      automated: sdrMetadata?.response_options?.use_next_steps ?? true,
    },
    {
      emoji: '🏥',
      label: 'Revival',
      key: 'use_revival',
      content: 'When prospects have not recently engaged. SellScale uses this status to re-engage.',
      automated: sdrMetadata?.response_options?.use_revival ?? true,
    },
    {
      emoji: '❓',
      label: 'Question',
      key: 'use_questions',
      content:
        'When prospects have a question. SellScale will answer generic questions, but specific ones like pricing will be redirected.',
      automated: sdrMetadata?.response_options?.use_questions ?? true,
    },
    {
      emoji: '🔄',
      label: 'Circle Back',
      key: 'use_circle_back',
      content:
        'When a prospect has not responded to a previous message. SellScale will use this status to re-engage.',
      automated: sdrMetadata?.response_options?.use_circle_back ?? true,
    },
    {
      emoji: '🗓️',
      label: 'Scheduling',
      key: 'use_scheduling',
      content:
        'When a prospect moves to scheduling, SellScale will help schedule the conversation.',
      automated: sdrMetadata?.response_options?.use_scheduling ?? true,
    },
  ];
  return (
    <Card withBorder shadow='md'>
      <Title order={4}>Realtime Response Engine (Coming soon ⚠️)</Title>
      <Flex align={'center'} gap={'xs'}>
        <Text color='gray' fz='sm'>
          Configure how you want SellScale AI to manage replies. Alternately, edit{' '}
          <a href='/campaigns' color='blue'>
            SellScale AI's responses <IconExternalLink color='#228be6' size={'1rem'} />
          </a>
        </Text>
      </Flex>
      <DataGrid
        data={data}
        highlightOnHover
        withSorting
        withBorder
        verticalSpacing={'xs'}
        withColumnBorders
        sx={{ cursor: 'pointer' }}
        mt={'lg'}
        styles={{
          headerCellContent: {},
        }}
        columns={[
          {
            accessorKey: 'reply_rate',
            header: `Reply Label`,
            enableSorting: true,
            maxSize: 180,
            filterFn: stringFilterFn,
            cell: (cell) => {
              const { emoji, label } = cell.row.original;
              return (
                <Flex
                  justify={'center'}
                  align={'center'}
                  direction={'row'}
                  gap={4}
                  w={'100%'}
                  h={'100%'}
                >
                  <div
                    style={{
                      backgroundColor: '#ECF3FE',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {emoji}
                  </div>
                  <Text fw={700} size={'lg'} ml='4px'>
                    {label}
                  </Text>
                </Flex>
              );
            },
          },
          {
            accessorKey: 'about',
            header: 'About',
            enableSorting: true,
            cell: (cell) => {
              const { content } = cell.row.original;

              return (
                <Flex
                  justify={'center'}
                  align={'center'}
                  direction={'column'}
                  gap={4}
                  w={'100%'}
                  h={'100%'}
                >
                  <Text
                    fw={500}
                    size={'sm'}
                    color='gray'
                    lineClamp={3}
                    className=' whitespace-pre-line'
                  >
                    {content}
                  </Text>
                </Flex>
              );
            },
            filterFn: stringFilterFn,
          },
          {
            accessorKey: 'respond_ai',
            header: `Respond with AI`,
            enableSorting: true,
            maxSize: 200,
            cell: (cell) => {
              const { automated } = cell.row.original;

              return (
                <Box>
                  <Flex justify={'left'} align={'left'} gap={'sm'} w={'100%'} h={'100%'}>
                    <Text fw={500} color='gray' lineClamp={3}>
                      SellScale AI:
                    </Text>
                    <Switch
                      defaultChecked={automated}
                      onChange={(e) => {
                        const newMetaData = {
                          response_options: {
                            ...sdrMetadata?.response_options,
                            [cell.row.original.key]: e.target.checked,
                          },
                        };
                        update(newMetaData);
                      }}
                    />
                  </Flex>
                  <Text fz='xs' color='gray' fw={500} mt='8px'>
                    Respond{automated ? ' with ' : ' by '}
                    <b style={{ color: automated ? '#2F98C1' : '#333' }}>
                      {automated ? 'SellScale AI' : 'myself'}
                    </b>
                  </Text>
                </Box>
              );
            },
            filterFn: booleanFilterFn,
          },
        ]}
      />
    </Card>
  );
}
