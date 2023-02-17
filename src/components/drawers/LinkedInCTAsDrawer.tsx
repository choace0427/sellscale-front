import {
  Drawer,
  Title,
  Text,
  Center,
  Button,
  Switch,
  Container,
  Badge,
  Stack,
  Group,
} from "@mantine/core";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentPersonaIdState, linkedInCTAsDrawerOpenState } from "../atoms/personaAtoms";
import { faker } from "@faker-js/faker";
import { useQuery } from "react-query";
import { percentageToColor, temp_delay } from "../../utils/general";
import { chunk, sortBy } from "lodash";
import { IconPencil, IconTrashX } from "@tabler/icons";
import { showNotification } from "@mantine/notifications";
import { closeAllModals, openModal } from "@mantine/modals";
import { userTokenState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import { CTA } from "src/main";

const PAGE_SIZE = 20;

export default function LinkedInCTAsDrawer(props: {}) {
  const [opened, setOpened] = useRecoilState(linkedInCTAsDrawerOpenState);
  const [currentPersonaId, setCurrentPersonaId] = useRecoilState(currentPersonaIdState);
  const userToken = useRecoilValue(userTokenState);

  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "percentage",
    direction: "desc",
  });
  const totalRecords = useRef(0);

  const handleSortStatusChange = (status: DataTableSortStatus) => {
    setPage(1);
    setSortStatus(status);
  };

  const { data, isFetching, refetch } = useQuery({
    queryKey: [`query-cta-data-${currentPersonaId}`, { page, sortStatus }],
    queryFn: async ({ queryKey }) => {
      // @ts-ignore
      // eslint-disable-next-line
      const [_key, { page, sortStatus }] = queryKey;

      const response = await fetch(
        `${process.env.REACT_APP_API_URI}/client/archetype/${currentPersonaId}/get_ctas`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      if (response.status === 401) {
        logout();
      }
      const res = await response.json();
      console.log(res);
      if (!res || !res.ctas) {
        return [];
      }
      
      totalRecords.current = res.ctas.length;
      let pageData = chunk(res.ctas as CTA[], PAGE_SIZE)[page - 1]?.map((cta) => {
        let totalResponded = 0;
        if(cta.performance){
          for(const status in cta.performance.status_map) {
            if(status !== 'SENT_OUTREACH' && status !== 'NOT_INTERESTED') {
              totalResponded += cta.performance.status_map[status];
            }
          }
        }
        return {
          ...cta,
          percentage: cta.performance?.total_count ? Math.round((totalResponded / cta.performance.total_count) * 100) : 0,
        };
      });
      if(!pageData) { return []; }

      pageData = sortBy(pageData, sortStatus.columnAccessor);
      return (sortStatus.direction === 'desc' ? pageData.reverse() : pageData);
    },
    refetchOnWindowFocus: false,
    enabled: currentPersonaId !== -1,
  });

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        setCurrentPersonaId(-1);
        setOpened(false);
      }}
      title={<Title order={2}>LinkedIn CTAs</Title>}
      padding="xl"
      size="xl"
      position="right"
    >
      <div style={{ height: "90vh" }}>
        <DataTable
          verticalAlignment="top"
          loaderColor="teal"
          noRecordsText={"No CTAs found"}
          fetching={isFetching}
          columns={[
            {
              accessor: "text_value",
              title: "Call-to-Action",
              sortable: true,
            },
            {
              accessor: "percentage",
              title: "%",
              ellipsis: true,
              sortable: true,
              width: 80,
              render: ({ percentage }) => `${percentage}%`,
            },
            {
              accessor: "active",
              title: "Active",
              render: ({ active, id }) => (
                <Switch
                  color="teal"
                  checked={active}
                  onClick={(e) => {
                    if (data) {
                      const entry = data.filter((d) => d.id === id)[0];
                      entry.active = !entry.active;
                      refetch();
                    }
                  }}
                  styles={(theme) => ({
                    track: {
                      cursor: "pointer",
                    },
                  })}
                />
              ),
            },
          ]}
          records={data}
          page={page}
          onPageChange={setPage}
          totalRecords={totalRecords.current}
          recordsPerPage={PAGE_SIZE}
          paginationColor="teal"
          sortStatus={sortStatus}
          onSortStatusChange={handleSortStatusChange}
          onRowClick={({ id, text_value, percentage, active }) =>
            openModal({
              title: (
                <Group position="apart" mt="md" mb="xs">
                  <Title order={3}>Call-to-Action</Title>
                  <Badge color={active ? 'teal' : 'red'} variant="light">
                    {active ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
              ),
              children: (
                <>
                  <Text size="sm" py='xs'>
                    <Text fw={700} span>Acceptance Rate: </Text>
                    <Text c={percentageToColor(percentage)} span>{`${percentage}%`}</Text>
                  </Text>
                  <Text size="sm" color="dimmed">{text_value}</Text>
                </>
              ),
              styles: (theme) => ({
                title: {
                  width: '100%',
                },
                header: {
                  margin: 0,
                }
              }),
            })
          }
          rowContextMenu={{
            items: ({ id }) => [
              {
                key: "edit",
                icon: <IconPencil size={14} />,
                title: `Edit CTA`,
                onClick: () =>
                  showNotification({
                    color: "orange",
                    message: `Should edit CTA #${id}`,
                  }),
              },
              {
                key: "delete",
                title: `Delete CTA`,
                icon: <IconTrashX size={14} />,
                color: "red",
                onClick: () =>
                  showNotification({
                    color: "red",
                    message: `Should delete CTA #${id}`,
                  }),
              },
            ],
          }}
        />
      </div>
    </Drawer>
  );
}
