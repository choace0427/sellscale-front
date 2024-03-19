import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Flex,
  RingProgress,
  Select,
  Switch,
  Text,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBrandLinkedin,
  IconCalendar,
  IconChecks,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconCloudUpload,
  IconExternalLink,
  IconLetterT,
  IconLoader,
  IconMail,
  IconSend,
  IconTargetArrow,
  IconToggleRight,
} from '@tabler/icons';
import { IconInfoTriangle, IconMessageCheck, IconNumber12Small } from '@tabler/icons-react';
import { DataGrid } from 'mantine-data-grid';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { CampaignPersona } from '@common/campaigns/PersonaCampaigns';
import { getPersonasCampaignView } from '@utils/requests/getPersonas';
import { useRecoilValue } from 'recoil';
import { userDataState, userTokenState } from '@atoms/userAtoms';
import { API_URL } from '@constants/data';
import { Task } from '@pages/Overview/OperatorDash/OperatorDash';

export default function ClientCampaignView() {
  const theme = useMantineTheme();
  const userToken = useRecoilValue(userTokenState);
  const userData = useRecoilValue(userDataState);
  const [activeCampaignOpen, { toggle: activeCampaignToggle }] = useDisclosure(false);

  const [acPageSize, setAcPageSize] = useState('25');
  const [raPageSize, setRaPageSize] = useState('25');
  const [udPageSize, setUdPageSize] = useState('25');
  const [cdPageSize, setCdPageSize] = useState('25');

  const { data: campaigns } = useQuery({
    queryKey: [`query-get-campaigns`],
    queryFn: async () => {
      const response = await getPersonasCampaignView(userToken);
      const result = response.status === 'success' ? (response.data as CampaignPersona[]) : [];

      return result;
    },
  });

  const { data: opTasks } = useQuery({
    queryKey: [`query-get-op-task`],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/operator_dashboard/all`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      return (await response.json()).entries as Task[];
    },
  });

  const processedCampaigns =
    campaigns
      ?.map((c) => {
        return {
          status: c.active,
          percentage: Math.ceil((c.total_sent / c.total_prospects) * 100 || 0),
          campaign: c.name,
          sent: c.total_sent,
          open: c.total_opened,
          reply: c.total_replied,
          demo: c.total_demo,
          linkedin: c.linkedin_active,
          email: c.email_active,
        };
      })
      .sort((a, b) => (a.linkedin || a.email ? -1 : 1)) ?? [];

  const completedData =
    campaigns
      ?.map((c) => {
        return {
          status: c.active,
          percentage: Math.ceil((c.total_sent / c.total_prospects) * 100 || 0),
          campaign: c.name,
          sdr: c.sdr_name,
          last_send_date: c.created_at, // TODO
          num_sent: c.total_sent,
          linkedin: c.linkedin_active,
          email: c.email_active,
        };
      })
      .filter((c) => c.percentage === 100) ?? [];

  console.log(campaigns, opTasks, completedData);

  const repNeedData =
    opTasks
      ?.filter((t) => t.status === 'PENDING')
      .map((t) => {
        return {
          status: t.status === 'PENDING' ? 'rep action needed' : false,
          campaign: (t.task_data?.campaign_name as string) || false,
          campaign_id: t.task_data?.campaign_id ?? false,
          sdr: userData?.full_name,
          task: t.title,
          task_type: t.task_type,
          task_data: t.task_data,
        };
      })
      .filter((t) => t.status) ?? [];

  const upladingData =
    campaigns?.map((c) => {
      return {
        status: 'uploading by sellscale',
        campaign: c.name,
        sdr: userData?.full_name,
        campaign_id: c.id,
      };
    }) ?? []; // .filter((c) => repNeedData.find((r) => r.campaign_id === c.campaign_id))

  return (
    <div className='bg-white'>
      <Flex direction={'column'} mx={'5%'} py={'lg'} gap={'lg'}>
        <Flex direction={'column'} gap={'sm'}>
          <Text
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            color='gray'
            fw={700}
            size={'lg'}
          >
            <IconTargetArrow />
            Active Campaigns
          </Text>
          <DataGrid
            data={processedCampaigns.filter((c) => c.status)}
            highlightOnHover
            withPagination
            withSorting
            withColumnBorders
            withBorder
            sx={{
              cursor: 'pointer',
              '& .mantine-10xyzsm>tbody>tr>td': {
                padding: '0px',
              },
              '& tr': {
                background: 'white',
              },
            }}
            columns={[
              {
                accessorKey: 'Status',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLoader color='gray' size={'0.9rem'} />
                    <Text color='gray'>Status</Text>
                  </Flex>
                ),
                maxSize: 180,
                cell: (cell) => {
                  const { status, percentage } = cell.row.original;

                  return (
                    <Flex gap={'xs'} w={'100%'} h={'100%'} px={'sm'} align={'center'}>
                      <RingProgress
                        size={30}
                        thickness={4}
                        variant='animated'
                        sections={[
                          {
                            value: Math.floor(percentage),
                            color: Math.round(percentage) ? 'green' : 'blue',
                          },
                        ]}
                      />
                      <Text size='sm' align='center'>
                        {percentage}%
                      </Text>
                      <Badge color={status ? 'green' : 'red'}>active</Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'campaigns',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconTargetArrow color='gray' size={'0.9rem'} />
                    <Text color='gray'>Campaigns</Text>
                  </Flex>
                ),
                cell: (cell) => {
                  const { campaign } = cell.row.original;

                  return (
                    <Flex w={'100%'} px={'sm'} h={'100%'} align={'center'}>
                      <Text lineClamp={1}>{campaign}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'sent',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconSend color='#228be6' size={'0.9rem'} />
                    <Text color='gray'>Sent</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { sent } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'lg'}
                      w={'100%'}
                      h={'100%'}
                      bg={'#f9fbfe'}
                    >
                      <Text color='#228be6' fw={700}>
                        {sent}
                      </Text>
                      <Badge variant='light' color={theme.colors.blue[1]}>
                        {sent}%
                      </Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'open',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconChecks color='#db66f3' size={'0.9rem'} />
                    <Text color='gray'>Sent</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { open } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      w={'100%'}
                      py={'lg'}
                      h={'100%'}
                      bg={'#fdf9fe'}
                    >
                      <Text color={'#db66f3'} fw={700}>
                        {open}
                      </Text>
                      <Badge
                        variant='light'
                        bg='rgba(219,102,243, 0.1)'
                        style={{ color: '#db66f3' }}
                      >
                        {open}%
                      </Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'reply',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconMessageCheck color='#f0ab78' size={'0.9rem'} />
                    <Text color='gray'>Reply</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { reply } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'lg'}
                      w={'100%'}
                      h={'100%'}
                      bg={'#fffbf8'}
                    >
                      <Text color={'#f0ab78'} fw={700}>
                        {reply}
                      </Text>
                      <Badge
                        variant='light'
                        bg='rgba(240, 171, 120, 0.1)'
                        style={{ color: '#f0ab78' }}
                      >
                        {reply}%
                      </Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'demo',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconCalendar color='#73d0a5' size={'0.9rem'} />
                    <Text color='gray'>Demo</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { demo } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'lg'}
                      w={'100%'}
                      h={'100%'}
                      bg={'#f8fbf9'}
                    >
                      <Text color={'#73d0a5'} fw={700}>
                        {demo}
                      </Text>
                      <Badge
                        variant='light'
                        bg='rbga(115, 208, 165, 0.1)'
                        style={{ color: '#73d0a5' }}
                      >
                        {demo}%
                      </Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'channel',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconToggleRight color='gray' size={'0.9rem'} />
                    <Text color='gray'>Channels</Text>
                  </Flex>
                ),
                maxSize: 130,
                enableResizing: true,
                cell: (cell) => {
                  const { linkedin, email } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'lg'}
                      w={'100%'}
                      h={'100%'}
                    >
                      <Flex direction={'column'} gap={'3px'} align={'center'}>
                        <IconBrandLinkedin size={'1.3rem'} fill='#228be6' color='white' />
                        <Switch defaultChecked={linkedin} />
                      </Flex>
                      <Flex direction={'column'} gap={'3px'} align={'center'}>
                        <IconMail size={'1.3rem'} fill='#228be6' color='white' />
                        <Switch defaultChecked={email} />
                      </Flex>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'action',
                header: '',
                maxSize: 50,
                enableSorting: false,
                enableResizing: true,
                cell: (cell) => {
                  const { sent } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} h={'100%'} w={'100%'} justify={'center'}>
                      <Button
                        style={{ borderRadius: '100%', padding: '0px' }}
                        w={'fit-content'}
                        h={'fit-content'}
                      >
                        <IconChevronDown />
                      </Button>
                    </Flex>
                  );
                },
              },
            ]}
            options={{
              enableFilters: true,
            }}
            components={{
              pagination: ({ table }) => (
                <Flex
                  justify={'space-between'}
                  align={'center'}
                  px={'sm'}
                  py={'1.25rem'}
                  sx={(theme) => ({
                    border: `1px solid ${theme.colors.gray[4]}`,
                    borderTopWidth: 0,
                  })}
                >
                  <Select
                    style={{ width: '150px' }}
                    data={[
                      { label: 'Show 25 rows', value: '25' },
                      { label: 'Show 10 rows', value: '10' },
                      { label: 'Show 5 rows', value: '5' },
                    ]}
                    value={acPageSize}
                    onChange={(v) => {
                      setAcPageSize(v ?? '25');
                    }}
                  />
                  <Flex align={'center'} gap={'sm'}>
                    <Flex align={'center'}>
                      <Select
                        maw={100}
                        value={`${table.getState().pagination.pageIndex + 1}`}
                        data={new Array(table.getPageCount()).fill(0).map((i, idx) => ({
                          label: String(idx + 1),
                          value: String(idx + 1),
                        }))}
                        onChange={(v) => {
                          table.setPageIndex(Number(v) - 1);
                        }}
                      />
                      <Flex
                        sx={(theme) => ({
                          borderTop: `1px solid ${theme.colors.gray[4]}`,
                          borderRight: `1px solid ${theme.colors.gray[4]}`,
                          borderBottom: `1px solid ${theme.colors.gray[4]}`,
                          marginLeft: '-2px',
                          paddingLeft: '1rem',
                          paddingRight: '1rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem',
                        })}
                        h={36}
                      >
                        <Text color='gray.5' fw={500} fz={14}>
                          of {table.getPageCount()} pages
                        </Text>
                      </Flex>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={table.getState().pagination.pageIndex === 0}
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex - 1);
                        }}
                      >
                        <IconChevronLeft stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={
                          table.getState().pagination.pageIndex === table.getPageCount() - 1
                        }
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex + 1);
                        }}
                      >
                        <IconChevronRight stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                    </Flex>
                  </Flex>
                </Flex>
              ),
            }}
            w={'100%'}
            pageSizes={[acPageSize]}
            styles={(theme) => ({
              thead: {
                height: '44px',
                backgroundColor: theme.colors.gray[0],
                '::after': {
                  backgroundColor: 'transparent',
                },
              },

              wrapper: {
                gap: 0,
              },
              scrollArea: {
                paddingBottom: 0,
                gap: 0,
              },

              dataCellContent: {
                width: '100%',
              },
            })}
          />
          <Collapse in={activeCampaignOpen}>
            <DataGrid
              data={processedCampaigns.filter((c) => !c.status)}
              highlightOnHover
              withPagination
              withSorting
              withColumnBorders
              withBorder
              sx={{
                cursor: 'pointer',
                '& .mantine-10xyzsm>tbody>tr>td': {
                  padding: '0px',
                },
                '& tr': {
                  background: 'white',
                },
              }}
              columns={[
                {
                  accessorKey: 'Status',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconLoader color='gray' size={'0.9rem'} />
                      <Text color='gray'>Status</Text>
                    </Flex>
                  ),
                  maxSize: 180,
                  cell: (cell) => {
                    const { status, percentage } = cell.row.original;

                    return (
                      <Flex gap={'xs'} w={'100%'} h={'100%'} px={'sm'} align={'center'}>
                        <RingProgress
                          size={30}
                          thickness={4}
                          variant='animated'
                          sections={[
                            {
                              value: Math.floor(percentage),
                              color: Math.round(percentage) ? 'green' : 'blue',
                            },
                          ]}
                        />
                        <Text size='sm' align='center'>
                          {percentage}%
                        </Text>
                        <Badge color={status ? 'green' : 'red'}>
                          {status ? 'Active' : 'Inactive'}
                        </Badge>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'campaigns',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconTargetArrow color='gray' size={'0.9rem'} />
                      <Text color='gray'>Campaigns</Text>
                    </Flex>
                  ),
                  cell: (cell) => {
                    const { campaign } = cell.row.original;

                    return (
                      <Flex w={'100%'} px={'sm'} h={'100%'} align={'center'}>
                        <Text lineClamp={1}>{campaign}</Text>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'sent',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconSend color='#228be6' size={'0.9rem'} />
                      <Text color='gray'>Sent</Text>
                    </Flex>
                  ),
                  maxSize: 120,
                  enableResizing: true,
                  cell: (cell) => {
                    const { sent } = cell.row.original;

                    return (
                      <Flex
                        align={'center'}
                        justify={'center'}
                        gap={'xs'}
                        py={'lg'}
                        w={'100%'}
                        h={'100%'}
                        bg={'#f9fbfe'}
                      >
                        <Text color='#228be6' fw={700}>
                          {sent}
                        </Text>
                        <Badge variant='light' color={theme.colors.blue[1]}>
                          {sent}%
                        </Badge>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'open',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconChecks color='#db66f3' size={'0.9rem'} />
                      <Text color='gray'>Sent</Text>
                    </Flex>
                  ),
                  maxSize: 120,
                  enableResizing: true,
                  cell: (cell) => {
                    const { open } = cell.row.original;

                    return (
                      <Flex
                        align={'center'}
                        justify={'center'}
                        gap={'xs'}
                        w={'100%'}
                        py={'lg'}
                        h={'100%'}
                        bg={'#fdf9fe'}
                      >
                        <Text color={'#db66f3'} fw={700}>
                          {open}
                        </Text>
                        <Badge
                          variant='light'
                          bg='rgba(219,102,243, 0.1)'
                          style={{ color: '#db66f3' }}
                        >
                          {open}%
                        </Badge>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'reply',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconMessageCheck color='#f0ab78' size={'0.9rem'} />
                      <Text color='gray'>Reply</Text>
                    </Flex>
                  ),
                  maxSize: 120,
                  enableResizing: true,
                  cell: (cell) => {
                    const { reply } = cell.row.original;

                    return (
                      <Flex
                        align={'center'}
                        justify={'center'}
                        gap={'xs'}
                        py={'lg'}
                        w={'100%'}
                        h={'100%'}
                        bg={'#fffbf8'}
                      >
                        <Text color={'#f0ab78'} fw={700}>
                          {reply}
                        </Text>
                        <Badge
                          variant='light'
                          bg='rgba(240, 171, 120, 0.1)'
                          style={{ color: '#f0ab78' }}
                        >
                          {reply}%
                        </Badge>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'demo',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconCalendar color='#73d0a5' size={'0.9rem'} />
                      <Text color='gray'>Demo</Text>
                    </Flex>
                  ),
                  maxSize: 120,
                  enableResizing: true,
                  cell: (cell) => {
                    const { demo } = cell.row.original;

                    return (
                      <Flex
                        align={'center'}
                        justify={'center'}
                        gap={'xs'}
                        py={'lg'}
                        w={'100%'}
                        h={'100%'}
                        bg={'#f8fbf9'}
                      >
                        <Text color={'#73d0a5'} fw={700}>
                          {demo}
                        </Text>
                        <Badge
                          variant='light'
                          bg='rbga(115, 208, 165, 0.1)'
                          style={{ color: '#73d0a5' }}
                        >
                          {demo}%
                        </Badge>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'channel',
                  header: () => (
                    <Flex align={'center'} gap={'3px'}>
                      <IconToggleRight color='gray' size={'0.9rem'} />
                      <Text color='gray'>Channels</Text>
                    </Flex>
                  ),
                  maxSize: 130,
                  enableResizing: true,
                  cell: (cell) => {
                    const { linkedin, email } = cell.row.original;

                    return (
                      <Flex
                        align={'center'}
                        justify={'center'}
                        gap={'xs'}
                        py={'lg'}
                        w={'100%'}
                        h={'100%'}
                      >
                        <Flex direction={'column'} gap={'3px'} align={'center'}>
                          <IconBrandLinkedin size={'1.3rem'} fill='#228be6' color='white' />
                          <Switch defaultChecked={linkedin} />
                        </Flex>
                        <Flex direction={'column'} gap={'3px'} align={'center'}>
                          <IconMail size={'1.3rem'} fill='#228be6' color='white' />
                          <Switch defaultChecked={email} />
                        </Flex>
                      </Flex>
                    );
                  },
                },
                {
                  accessorKey: 'action',
                  header: '',
                  maxSize: 50,
                  enableSorting: false,
                  enableResizing: true,
                  cell: (cell) => {
                    const { sent } = cell.row.original;

                    return (
                      <Flex align={'center'} gap={'xs'} h={'100%'} w={'100%'} justify={'center'}>
                        <Button
                          style={{ borderRadius: '100%', padding: '0px' }}
                          w={'fit-content'}
                          h={'fit-content'}
                        >
                          <IconChevronDown />
                        </Button>
                      </Flex>
                    );
                  },
                },
              ]}
              options={{
                enableFilters: true,
              }}
              //   state={{
              //     columnFilters,
              //   }}
              components={{
                pagination: ({ table }) => (
                  <Flex
                    justify={'space-between'}
                    align={'center'}
                    px={'sm'}
                    py={'1.25rem'}
                    sx={(theme) => ({
                      border: `1px solid ${theme.colors.gray[4]}`,
                      borderTopWidth: 0,
                    })}
                  >
                    <Select
                      style={{ width: '150px' }}
                      data={[
                        { label: 'Show 25 rows', value: '25' },
                        { label: 'Show 10 rows', value: '10' },
                        { label: 'Show 5 rows', value: '5' },
                      ]}
                      value={acPageSize}
                      onChange={(v) => {
                        setAcPageSize(v ?? '25');
                      }}
                    />
                    <Flex align={'center'} gap={'sm'}>
                      <Flex align={'center'}>
                        <Select
                          maw={100}
                          value={`${table.getState().pagination.pageIndex + 1}`}
                          data={new Array(table.getPageCount()).fill(0).map((i, idx) => ({
                            label: String(idx + 1),
                            value: String(idx + 1),
                          }))}
                          onChange={(v) => {
                            table.setPageIndex(Number(v) - 1);
                          }}
                        />
                        <Flex
                          sx={(theme) => ({
                            borderTop: `1px solid ${theme.colors.gray[4]}`,
                            borderRight: `1px solid ${theme.colors.gray[4]}`,
                            borderBottom: `1px solid ${theme.colors.gray[4]}`,
                            marginLeft: '-2px',
                            paddingLeft: '1rem',
                            paddingRight: '1rem',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.25rem',
                          })}
                          h={36}
                        >
                          <Text color='gray.5' fw={500} fz={14}>
                            of {table.getPageCount()} pages
                          </Text>
                        </Flex>
                        <ActionIcon
                          variant='default'
                          color='gray.4'
                          h={36}
                          disabled={table.getState().pagination.pageIndex === 0}
                          onClick={() => {
                            table.setPageIndex(table.getState().pagination.pageIndex - 1);
                          }}
                        >
                          <IconChevronLeft stroke={theme.colors.gray[4]} />
                        </ActionIcon>
                        <ActionIcon
                          variant='default'
                          color='gray.4'
                          h={36}
                          disabled={
                            table.getState().pagination.pageIndex === table.getPageCount() - 1
                          }
                          onClick={() => {
                            table.setPageIndex(table.getState().pagination.pageIndex + 1);
                          }}
                        >
                          <IconChevronRight stroke={theme.colors.gray[4]} />
                        </ActionIcon>
                      </Flex>
                    </Flex>
                  </Flex>
                ),
              }}
              w={'100%'}
              pageSizes={[acPageSize]}
              styles={(theme) => ({
                thead: {
                  height: '44px',
                  backgroundColor: theme.colors.gray[0],
                  '::after': {
                    backgroundColor: 'transparent',
                  },
                },

                wrapper: {
                  gap: 0,
                },
                scrollArea: {
                  paddingBottom: 0,
                  gap: 0,
                },

                dataCellContent: {
                  width: '100%',
                },
              })}
            />
          </Collapse>
          <Button
            mx={'auto'}
            w={'fit-content'}
            color='gray'
            variant='outline'
            radius={'xl'}
            rightIcon={
              <IconChevronDown
                size={'0.8rem'}
                style={{
                  transitionDuration: '400ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeCampaignOpen
                    ? `rotate(${activeCampaignOpen ? 180 : 0}deg)`
                    : 'none',
                }}
              />
            }
            // onClick={() => setShouldShowInactiveCampaign((s) => !s)}
            onClick={activeCampaignToggle}
          >
            {/* {shouldShowInactiveCampaign ? 'Hide' : 'Show'} {triggers?.filter((t: any) => !t.active).length} Inactive Campaigns */}
            {activeCampaignOpen ? 'Hide' : 'Show'} {12} Inactive Campaigns
          </Button>
        </Flex>
        <Flex direction={'column'} gap={'sm'}>
          <Text
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            color='gray'
            fw={700}
            size={'lg'}
          >
            <IconInfoTriangle color='orange' />
            Rep Action Needed
          </Text>
          <DataGrid
            data={repNeedData}
            highlightOnHover
            withPagination
            withColumnBorders
            withSorting
            withBorder
            sx={{
              cursor: 'pointer',
              '& tr': {
                background: 'white',
              },
            }}
            columns={[
              {
                accessorKey: 'Status',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Status</Text>
                  </Flex>
                ),
                maxSize: 170,
                cell: (cell) => {
                  const { status } = cell.row.original;

                  return (
                    <Flex gap={'xs'} w={'100%'} h={'100%'} align={'center'}>
                      <Badge color={status ? 'orange' : 'red'}>{status}</Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'campaign',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Campaign</Text>
                  </Flex>
                ),
                cell: (cell) => {
                  const { campaign } = cell.row.original;

                  return (
                    <Flex w={'100%'} h={'100%'} align={'center'}>
                      <Text lineClamp={1}>{campaign}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'sdr',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>SDR</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { sdr } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{sdr}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'task',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Task</Text>
                  </Flex>
                ),
                enableResizing: true,
                cell: (cell) => {
                  const { task } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{task}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'action',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconToggleRight color='gray' size={'0.9rem'} />
                    <Text color='gray'>Action</Text>
                  </Flex>
                ),
                maxSize: 140,
                enableResizing: true,
                cell: () => {
                  return (
                    <Flex align={'center'} h={'100%'}>
                      <Button
                        rightIcon={<IconExternalLink size={'0.9rem'} />}
                        style={{ borderRadius: '16px', height: '1.3rem' }}
                        size='xs'
                      >
                        View Task
                      </Button>
                    </Flex>
                  );
                },
              },
            ]}
            options={{
              enableFilters: true,
            }}
            components={{
              pagination: ({ table }) => (
                <Flex
                  justify={'space-between'}
                  align={'center'}
                  px={'sm'}
                  py={'1.25rem'}
                  sx={(theme) => ({
                    border: `1px solid ${theme.colors.gray[4]}`,
                    borderTopWidth: 0,
                  })}
                >
                  <Select
                    style={{ width: '150px' }}
                    data={[
                      { label: 'Show 25 rows', value: '25' },
                      { label: 'Show 10 rows', value: '10' },
                      { label: 'Show 5 rows', value: '5' },
                    ]}
                    value={raPageSize}
                    onChange={(v) => {
                      setRaPageSize(v ?? '25');
                    }}
                  />

                  <Flex align={'center'} gap={'sm'}>
                    <Flex align={'center'}>
                      <Select
                        maw={100}
                        value={`${table.getState().pagination.pageIndex + 1}`}
                        data={new Array(table.getPageCount()).fill(0).map((i, idx) => ({
                          label: String(idx + 1),
                          value: String(idx + 1),
                        }))}
                        onChange={(v) => {
                          table.setPageIndex(Number(v) - 1);
                        }}
                      />
                      <Flex
                        sx={(theme) => ({
                          borderTop: `1px solid ${theme.colors.gray[4]}`,
                          borderRight: `1px solid ${theme.colors.gray[4]}`,
                          borderBottom: `1px solid ${theme.colors.gray[4]}`,
                          marginLeft: '-2px',
                          paddingLeft: '1rem',
                          paddingRight: '1rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem',
                        })}
                        h={36}
                      >
                        <Text color='gray.5' fw={500} fz={14}>
                          of {table.getPageCount()} pages
                        </Text>
                      </Flex>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={table.getState().pagination.pageIndex === 0}
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex - 1);
                        }}
                      >
                        <IconChevronLeft stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={
                          table.getState().pagination.pageIndex === table.getPageCount() - 1
                        }
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex + 1);
                        }}
                      >
                        <IconChevronRight stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                    </Flex>
                  </Flex>
                </Flex>
              ),
            }}
            w={'100%'}
            pageSizes={[raPageSize]}
            styles={(theme) => ({
              thead: {
                height: '44px',
                backgroundColor: theme.colors.gray[0],
                '::after': {
                  backgroundColor: 'transparent',
                },
              },

              wrapper: {
                gap: 0,
              },
              scrollArea: {
                paddingBottom: 0,
                gap: 0,
              },

              dataCellContent: {
                width: '100%',
              },
            })}
          />
        </Flex>
        <Flex direction={'column'} gap={'sm'}>
          <Text
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            color='gray'
            fw={700}
            size={'lg'}
          >
            <IconCloudUpload color='#228be6' />
            Uploading by SellScale
          </Text>
          <DataGrid
            data={upladingData}
            highlightOnHover
            withPagination
            withSorting
            withColumnBorders
            withBorder
            sx={{
              cursor: 'pointer',
              '& tr': {
                background: 'white',
              },
            }}
            columns={[
              {
                accessorKey: 'Status',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Status</Text>
                  </Flex>
                ),
                maxSize: 210,
                cell: (cell) => {
                  const { status } = cell.row.original;

                  return (
                    <Flex gap={'xs'} w={'100%'} h={'100%'} align={'center'}>
                      <Badge>{status}</Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'campaign',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Campaign</Text>
                  </Flex>
                ),
                cell: (cell) => {
                  const { campaign } = cell.row.original;

                  return (
                    <Flex w={'100%'} h={'100%'} align={'center'}>
                      <Text lineClamp={1}>{campaign}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'sdr',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>SDR</Text>
                  </Flex>
                ),
                maxSize: 120,
                enableResizing: true,
                cell: (cell) => {
                  const { sdr } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{sdr}</Text>
                    </Flex>
                  );
                },
              },
            ]}
            options={{
              enableFilters: true,
            }}
            components={{
              pagination: ({ table }) => (
                <Flex
                  justify={'space-between'}
                  align={'center'}
                  px={'sm'}
                  py={'1.25rem'}
                  sx={(theme) => ({
                    border: `1px solid ${theme.colors.gray[4]}`,
                    borderTopWidth: 0,
                  })}
                >
                  <Select
                    style={{ width: '150px' }}
                    data={[
                      { label: 'Show 25 rows', value: '25' },
                      { label: 'Show 10 rows', value: '10' },
                      { label: 'Show 5 rows', value: '5' },
                    ]}
                    value={udPageSize}
                    onChange={(v) => {
                      setUdPageSize(v ?? '25');
                    }}
                  />

                  <Flex align={'center'} gap={'sm'}>
                    <Flex align={'center'}>
                      <Select
                        maw={100}
                        value={`${table.getState().pagination.pageIndex + 1}`}
                        data={new Array(table.getPageCount()).fill(0).map((i, idx) => ({
                          label: String(idx + 1),
                          value: String(idx + 1),
                        }))}
                        onChange={(v) => {
                          table.setPageIndex(Number(v) - 1);
                        }}
                      />
                      <Flex
                        sx={(theme) => ({
                          borderTop: `1px solid ${theme.colors.gray[4]}`,
                          borderRight: `1px solid ${theme.colors.gray[4]}`,
                          borderBottom: `1px solid ${theme.colors.gray[4]}`,
                          marginLeft: '-2px',
                          paddingLeft: '1rem',
                          paddingRight: '1rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem',
                        })}
                        h={36}
                      >
                        <Text color='gray.5' fw={500} fz={14}>
                          of {table.getPageCount()} pages
                        </Text>
                      </Flex>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={table.getState().pagination.pageIndex === 0}
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex - 1);
                        }}
                      >
                        <IconChevronLeft stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={
                          table.getState().pagination.pageIndex === table.getPageCount() - 1
                        }
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex + 1);
                        }}
                      >
                        <IconChevronRight stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                    </Flex>
                  </Flex>
                </Flex>
              ),
            }}
            w={'100%'}
            pageSizes={[udPageSize]}
            styles={(theme) => ({
              thead: {
                height: '44px',
                backgroundColor: theme.colors.gray[0],
                '::after': {
                  backgroundColor: 'transparent',
                },
              },

              wrapper: {
                gap: 0,
              },
              scrollArea: {
                paddingBottom: 0,
                gap: 0,
              },

              dataCellContent: {
                width: '100%',
              },
            })}
          />
        </Flex>
        <Flex direction={'column'} gap={'sm'}>
          <Text
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            color='gray'
            fw={700}
            size={'lg'}
          >
            <IconCircleCheck color='green' />
            Completed
          </Text>
          <DataGrid
            data={completedData}
            highlightOnHover
            withPagination
            withSorting
            withColumnBorders
            withBorder
            sx={{
              cursor: 'pointer',
              '& tr': {
                background: 'white',
              },
            }}
            columns={[
              {
                accessorKey: 'Status',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Status</Text>
                  </Flex>
                ),
                maxSize: 170,
                cell: (cell) => {
                  const { status } = cell.row.original;

                  return (
                    <Flex gap={'xs'} w={'100%'} h={'100%'} align={'center'}>
                      <Badge color='green'>complete</Badge>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'campaign',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>Campaign</Text>
                  </Flex>
                ),
                cell: (cell) => {
                  const { campaign } = cell.row.original;

                  return (
                    <Flex w={'100%'} h={'100%'} align={'center'}>
                      <Text lineClamp={1}>{campaign}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'sdr',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconLetterT color='gray' size={'0.9rem'} />
                    <Text color='gray'>SDR</Text>
                  </Flex>
                ),
                enableResizing: true,
                cell: (cell) => {
                  const { sdr } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{sdr}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'last_send_date',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconCalendar color='gray' size={'0.9rem'} />
                    <Text color='gray'>Last Send Date</Text>
                  </Flex>
                ),
                enableResizing: true,
                cell: (cell) => {
                  const { last_send_date } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{last_send_date}</Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'num_sent',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconNumber12Small color='gray' size={'1.2rem'} />
                    <Text color='gray'>Num Sent</Text>
                  </Flex>
                ),
                enableResizing: true,
                cell: (cell) => {
                  const { num_sent } = cell.row.original;

                  return (
                    <Flex align={'center'} gap={'xs'} py={'sm'} w={'100%'} h={'100%'}>
                      <Text>{num_sent} Outreached to </Text>
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'linkedin',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconBrandLinkedin color='white' fill='#228be6' size={'1.2rem'} />
                    <Text color='gray'>Linkedin</Text>
                  </Flex>
                ),
                maxSize: 125,
                enableResizing: true,
                cell: (cell) => {
                  const { linkedin } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'sm'}
                      w={'100%'}
                      h={'100%'}
                    >
                      {linkedin ? <IconCircleCheck color='green' /> : <IconCircleX color='red' />}
                    </Flex>
                  );
                },
              },
              {
                accessorKey: 'email',
                header: () => (
                  <Flex align={'center'} gap={'3px'}>
                    <IconBrandLinkedin color='white' fill='#f79a26' size={'1.2rem'} />
                    <Text color='gray'>Email</Text>
                  </Flex>
                ),
                maxSize: 125,
                enableResizing: true,
                cell: (cell) => {
                  const { email } = cell.row.original;

                  return (
                    <Flex
                      align={'center'}
                      justify={'center'}
                      gap={'xs'}
                      py={'sm'}
                      w={'100%'}
                      h={'100%'}
                    >
                      {email ? <IconCircleCheck color='green' /> : <IconCircleX color='red' />}
                    </Flex>
                  );
                },
              },
            ]}
            options={{
              enableFilters: true,
            }}
            components={{
              pagination: ({ table }) => (
                <Flex
                  justify={'space-between'}
                  align={'center'}
                  px={'sm'}
                  py={'1.25rem'}
                  sx={(theme) => ({
                    border: `1px solid ${theme.colors.gray[4]}`,
                    borderTopWidth: 0,
                  })}
                >
                  <Select
                    style={{ width: '150px' }}
                    data={[
                      { label: 'Show 25 rows', value: '25' },
                      { label: 'Show 10 rows', value: '10' },
                      { label: 'Show 5 rows', value: '5' },
                    ]}
                    value={cdPageSize}
                    onChange={(v) => {
                      setCdPageSize(v ?? '25');
                    }}
                  />

                  <Flex align={'center'} gap={'sm'}>
                    <Flex align={'center'}>
                      <Select
                        maw={100}
                        value={`${table.getState().pagination.pageIndex + 1}`}
                        data={new Array(table.getPageCount()).fill(0).map((i, idx) => ({
                          label: String(idx + 1),
                          value: String(idx + 1),
                        }))}
                        onChange={(v) => {
                          table.setPageIndex(Number(v) - 1);
                        }}
                      />
                      <Flex
                        sx={(theme) => ({
                          borderTop: `1px solid ${theme.colors.gray[4]}`,
                          borderRight: `1px solid ${theme.colors.gray[4]}`,
                          borderBottom: `1px solid ${theme.colors.gray[4]}`,
                          marginLeft: '-2px',
                          paddingLeft: '1rem',
                          paddingRight: '1rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.25rem',
                        })}
                        h={36}
                      >
                        <Text color='gray.5' fw={500} fz={14}>
                          of {table.getPageCount()} pages
                        </Text>
                      </Flex>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={table.getState().pagination.pageIndex === 0}
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex - 1);
                        }}
                      >
                        <IconChevronLeft stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                      <ActionIcon
                        variant='default'
                        color='gray.4'
                        h={36}
                        disabled={
                          table.getState().pagination.pageIndex === table.getPageCount() - 1
                        }
                        onClick={() => {
                          table.setPageIndex(table.getState().pagination.pageIndex + 1);
                        }}
                      >
                        <IconChevronRight stroke={theme.colors.gray[4]} />
                      </ActionIcon>
                    </Flex>
                  </Flex>
                </Flex>
              ),
            }}
            w={'100%'}
            pageSizes={[cdPageSize]}
            styles={(theme) => ({
              thead: {
                height: '44px',
                backgroundColor: theme.colors.gray[0],
                '::after': {
                  backgroundColor: 'transparent',
                },
              },

              wrapper: {
                gap: 0,
              },
              scrollArea: {
                paddingBottom: 0,
                gap: 0,
              },

              dataCellContent: {
                width: '100%',
              },
            })}
          />
        </Flex>
      </Flex>
    </div>
  );
}
