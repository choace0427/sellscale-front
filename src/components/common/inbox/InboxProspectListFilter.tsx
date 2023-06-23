import { Modal, Title, Text, Stack, Select, Checkbox } from "@mantine/core";
import { useEffect, useRef } from "react";
import { Channel } from "src";

export type InboxProspectListFilterState = {
  recentlyContacted: 'ALL' | 'HIDE' | 'SHOW';
  channel: Channel;
  personaId: string | undefined;
  nurturingMode: boolean;
}

export const defaultInboxProspectListFilterState: InboxProspectListFilterState = {
  recentlyContacted: 'ALL',
  channel: 'SELLSCALE',
  personaId: undefined,
  nurturingMode: false,
};

export default function InboxProspectListFilter(props: {
  open: boolean,
  setOpen: (open: boolean) => void
  filters?: InboxProspectListFilterState,
  setFilters: (filters: InboxProspectListFilterState) => void
}) {

  const filterState = useRef<InboxProspectListFilterState>(defaultInboxProspectListFilterState);

  useEffect(() => {
    if (props.filters){
      filterState.current = props.filters;
    }
  }, [props.filters]);

  return (
    <Modal
      opened={props.open}
      onClose={() => props.setOpen(false)}
      title={<Title order={4}>Advanced Filters</Title>}
    >
      <Stack>
        <Select
          label='Recently Contacted'
          defaultValue={filterState.current.recentlyContacted}
          data={[
            { value: 'ALL', label: 'Show everyone' },
            { value: 'HIDE', label: 'Hide recently contacted' },
            { value: 'SHOW', label: 'Show only recently contacted' },
          ]}
          onChange={(value) => {
            if (value === 'ALL' || value === 'HIDE' || value === 'SHOW') {
              filterState.current.recentlyContacted = value;
              props.setFilters(filterState.current);
            }
          }}
        />

        <Select
          label='Channel'
          defaultValue={filterState.current.channel}
          data={[
            { value: 'SELLSCALE', label: 'All' },
            { value: 'LINKEDIN', label: 'LinkedIn' },
            { value: 'EMAIL', label: 'Email' },
          ]}
          onChange={(value) => {
            if (value === 'SELLSCALE' || value === 'LINKEDIN' || value === 'EMAIL') {
              filterState.current.channel = value;
              props.setFilters(filterState.current);
            }
          }}
        />

        <Select
          label='Persona'
          placeholder='Filter by persona'
          defaultValue={filterState.current.personaId}
          searchable
          clearable
          onSearchChange={() => {}}
          searchValue={undefined}
          nothingFound='No persona found'
          data={[]}
          onChange={(value) => {
            if (value) {
              filterState.current.personaId = value;
              props.setFilters(filterState.current);
            }
          }}
        />

        <div style={{ paddingTop: 10, paddingBottom: 10 }}>
          <Checkbox
            defaultChecked={filterState.current.nurturingMode}
            label={
              <Text fw={500} fz='xs'>
                Nurturing Mode
              </Text>
            }
            size='xs'
            onChange={(event) => {
              filterState.current.nurturingMode = event.currentTarget.checked;
              props.setFilters(filterState.current);
            }}
          />
        </div>
      </Stack>
    </Modal>
  );
}
