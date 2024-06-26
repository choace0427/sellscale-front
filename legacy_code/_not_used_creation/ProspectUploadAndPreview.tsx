import { userTokenState } from "@atoms/userAtoms";
import { logout } from "@auth/core";
import FlexSeparate from "@common/library/FlexSeparate";
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
  HoverCard,
  List,
  LoadingOverlay,
  Title,
} from "@mantine/core";
import { Dropzone, DropzoneProps, MIME_TYPES } from "@mantine/dropzone";
import { useForceUpdate } from "@mantine/hooks";
import { closeAllModals, openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import {
  IconUpload,
  IconX,
  IconTrashX,
  IconFileDescription,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconPlus,
} from "@tabler/icons";
import { convertFileToJSON } from "@utils/fileProcessing";
import createPersona from "@utils/requests/createPersona";
import uploadProspects from "@utils/requests/uploadProspects";
import _ from "lodash";
import { DataTable } from "mantine-datatable";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { QueryCache } from "@tanstack/react-query";

const MAX_FILE_SIZE_MB = 2;
const PREVIEW_FIRST_N_ROWS = 5;
const PROSPECT_DB_COLUMNS = [
  "linkedin_url",
  "email",
  "company",
  "company_url",
  "first_name",
  "full_name",
  "industry",
  "last_name",
  "last_position",
  "linkedin_bio",
  "title",
  "twitter_url",
];

function getDefaultColumnMappings(fileJSON: any[]) {
  const map = new Map<string, string>();
  if (fileJSON.length === 0) return map;
  Object.keys(fileJSON[0])
    .filter((key) => key !== "id")
    .forEach((key) => {
      const convertedKey = convertColumn(key);
      const defaultValue = PROSPECT_DB_COLUMNS.includes(convertedKey)
        ? convertedKey
        : "none";
      map.set(key.trim(), defaultValue);
    });
  return map;
}

function determineColumns(
  columnMappings: Map<string, string>,
  setColumnMappings: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  fileJSON: any[]
) {
  if (fileJSON.length === 0) return [];
  return Object.keys(fileJSON[0])
    .filter((key) => key !== "id")
    .map((key) => {
      return {
        width: 155,
        accessor: key,
        title: (
          <Stack>
            <Select
              value={columnMappings.get(key.trim())}
              data={[
                { label: "-", value: "none", group: "Skipped" },
                ...PROSPECT_DB_COLUMNS.map((column) => {
                  return {
                    label: _.startCase(column.replace("_", " ")).replace(
                      "Url",
                      "URL"
                    ),
                    value: column,
                    group:
                      column === "linkedin_url" || column === "email"
                        ? "Required Fields"
                        : "Additional Fields",
                  };
                }),
              ]}
              onChange={(value) => {
                setColumnMappings((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(key.trim(), value ? value : "none");
                  return newMap;
                });
              }}
            />
            <Text className="truncate">{key.trim()}</Text>
          </Stack>
        ),
        render: (value: any) => {
          return <Text sx={{ wordBreak: "break-word" }}>{value[key]}</Text>;
        },
      };
    });
}

function convertColumn(columnName: string) {
  return columnName
    .trim()
    .toLowerCase()
    .replace(/[\_\ \-\~\.\+]+/g, "_");
}

type FileDropAndPreviewProps = {
  onFileUpload?: (jsonData: any[]) => void;
  onColumnChange?: (jsonData: any[]) => void;
};

export default function ProspectUploadAndPreview(props: FileDropAndPreviewProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const userToken = useRecoilValue(userTokenState);
  const [fileJSON, setFileJSON] = useState<any[] | null>(null);
  const [columnMappings, setColumnMappings] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    if (fileJSON) {
      setColumnMappings(getDefaultColumnMappings(fileJSON));
      props.onFileUpload && props.onFileUpload(processJSON());
    }
  }, [fileJSON]);

  useEffect(() => {
    if (fileJSON) {
      props.onColumnChange && props.onColumnChange(processJSON());
    }
  }, [columnMappings]);

  const processJSON = () => {
    const uploadJSON = (fileJSON as any[])
    .map((row) => {
      const mappedRow = {};
      // Only include columns that are mapped to a prospect db column
      Object.keys(row)
        .filter((key) =>
          PROSPECT_DB_COLUMNS.includes(
            columnMappings.get(key.trim()) as string
          )
        )
        .forEach((key) => {
          // Use the mapped prospect db column intead of the original column name
          // @ts-ignore
          mappedRow[columnMappings.get(key.trim())] = row[key];
        });
      return mappedRow;
      // Remove prospects that don't have a linkedin_url or email column
    })
    .filter((row: any) => row.linkedin_url || row.email);

    return uploadJSON;
  }

  return (
    <>
      {!fileJSON && (
        <Dropzone
          loading={false}
          multiple={false}
          maxSize={MAX_FILE_SIZE_MB * 1024 ** 2}
          onDrop={async (files: any) => {
            const result = await convertFileToJSON(files[0]);
            if (result instanceof DOMException) {
              showNotification({
                id: "file-upload-error",
                title: `Error uploading file`,
                message: result.message,
                color: "red",
                autoClose: 5000,
              });
            } else {
              setFileJSON(
                result.map((row: any, index: number) => {
                  return {
                    id: index,
                    ...row,
                  };
                })
              );
            }
          }}
          onReject={(files: any) => {
            const error = files[0].errors[0];
            showNotification({
              id: "file-upload-error",
              title: `Error uploading file`,
              message: error.message,
              color: "red",
              autoClose: 5000,
            });
          }}
          accept={[
            MIME_TYPES.csv,
            MIME_TYPES.xls,
            MIME_TYPES.xlsx,
            "text/tsv",
            "text/tab-separated-values",
          ]}
        >
          <Group
            position="center"
            spacing="xl"
            style={{ minHeight: 220, pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                size={80}
                stroke={1.5}
                color={
                  theme.colors[theme.primaryColor][
                    theme.colorScheme === "dark" ? 4 : 6
                  ]
                }
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size={80}
                stroke={1.5}
                color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileDescription size={80} stroke={1.5} />
            </Dropzone.Idle>

            <div>
              <Text align="center" size="xl" inline>
                Drag CSV or Excel file here (or click to select)
              </Text>
              <Text align="center" size="sm" color="dimmed" inline mt={7}>
                Attached file should not exceed {MAX_FILE_SIZE_MB}mb
              </Text>
            </div>
          </Group>
        </Dropzone>
      )}
      {fileJSON && (
        <Stack spacing={0} mah={500}>
          <FlexSeparate>
            <Text fw={500} size="sm" pl={2}>
              Please map your file's columns to our system
            </Text>
            <ActionIcon
              color="red"
              size="sm"
              onClick={() => {
                setFileJSON(null);
                setColumnMappings(new Map());
              }}
            >
              <IconTrashX size="0.875rem" />
            </ActionIcon>
          </FlexSeparate>
          <DataTable
            mih={300}
            highlightOnHover
            columns={determineColumns(
              columnMappings,
              setColumnMappings,
              fileJSON
            )}
            records={fileJSON.slice(0, PREVIEW_FIRST_N_ROWS)}
          />
        </Stack>
      )}
    </>
  );
}
