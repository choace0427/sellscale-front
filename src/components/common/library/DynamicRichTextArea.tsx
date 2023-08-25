import {
  RichTextEditor,
  Link,
  useRichTextEditorContext,
} from "@mantine/tiptap";
import {
  Editor,
  JSONContent,
  markInputRule,
  markPasteRule,
  useEditor,
} from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import { IconRobot } from "@tabler/icons";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import {
  MantineColor,
  MantineTheme,
  ScrollArea,
  useMantineTheme,
} from "@mantine/core";
import Code from "@tiptap/extension-code";
import { Mark, mergeAttributes } from "@tiptap/core";
import "./dynamic-rich-text-area.css";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { getCustomInserts, getSVGContent } from "./getCustomInserts";

const FORMAT_REGEX = /\[\[([^\[]+?)\]\]/g;

function InsertControl(props: { insert: DynamicInsert }) {
  const { editor } = useRichTextEditorContext();
  return (
    <RichTextEditor.Control
      onClick={() =>
        editor?.commands.insertContent(
          ` <div data-insert-key="${props.insert.key}">${props.insert.label}</div> `
        )
      }
      aria-label={props.insert.label}
      title={props.insert.label}
    >
      {props.insert.icon}
    </RichTextEditor.Control>
  );
}

// function findCodeInContent(content: string): string[] {
//   const regex = /{"type":"text","marks":\[{"type":"code"}\],"text":"(.+?)"}/gm;
//   const matches = content.matchAll(regex);

//   const found = [];
//   for (const match of matches) {
//     found.push(match[1]);
//   }

//   return found;

//   /* Old system that actually went through the content and found the code */
//   //
//   // const isCode = (marks: any) => {
//   //   if(!marks) return false;
//   //   return marks.some((mark: any) => mark.type === "code");
//   // }

//   // const found = [];
//   // for(const paragraph of content){
//   //   if(paragraph && paragraph.content){
//   //     for(const part of paragraph.content){
//   //       if(isCode(part.marks)){
//   //         found.push(part.text);
//   //       }
//   //     }
//   //   }
//   // }
//   // return found;
// }

function formatJSONContent(json: JSONContent, inserts: DynamicInsert[]) {
  const content = Object.values(json)[1];
  for (const paragraph of content) {
    if (paragraph && paragraph.content) {
      const parts: any[] = [];
      for (const part of paragraph.content) {
        // Split the text into insert parts
        const matches = [...part.text.matchAll(FORMAT_REGEX)];
        if (matches.length === 0) {
          parts.push(part);
          continue;
        }

        // Remove the first match and prefix text and add it to the parts
        let curText = part.text;
        for (const match of matches) {
          const newParts = curText.split(match[0]);
          if (newParts.length > 1) {
            curText = curText.replace(newParts[0], "").replace(match[0], "");
          }
          const insert =
            inserts.find((insert) => insert.key === match[1]) ||
            inserts.find((insert) => insert.key === "custom");
          if (!insert) {
            console.error(`Could not find custom insert!`);
            continue;
          }

          parts.push({
            type: "text",
            text: newParts[0],
          });
          parts.push({
            type: "text",
            text:
              insert.key === "custom"
                ? match[1].replace("custom=", "")
                : insert.label,
            marks: [{ type: `insert-${insert.key}` }],
          });
        }
        // Add the remaining text to the parts
        parts.push({
          type: "text",
          text: curText === "" ? " " : curText,
        });
      }
      // Set and remove empty text nodes
      paragraph.content = parts.filter((part) => part.text !== "");
    }
  }

  json.content = content;

  return json;
}

export type DynamicInsert = {
  key: string;
  label: string;
  icon: ReactNode;
  color: MantineColor;
};

export default function DynamicRichTextArea(props: {
  height?: number;
  value?: string | JSONContent;
  onChange?: (value: string, rawValue: JSONContent) => void;
  inserts: DynamicInsert[];
  placeholder?: string;
  signifyCustomInsert?: boolean;
}) {
  const theme = useMantineTheme();
  const insertsSet = new Set(props.inserts);
  insertsSet.add({
    key: "custom",
    label: "CUSTOM",
    icon: <IconRobot />,
    color: "dark",
  });
  const inserts = Array.from(insertsSet);

  let editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: props.placeholder ?? "Type here...",
      }),
      ...getCustomInserts(theme, inserts),
    ],
    content: props.value ?? "",
    onUpdate({ editor, transaction: tr }) {
      if (props.onChange) {
        // TODO: Parsing HTML via regex is slow and not the best way to do this
        const regex =
          /<button.+?class="dynamic-insert".+?data-insert-key="(.+?)" .+? name="insert-label-span">(.+?)<\/span>.+?<\/button>/gm;
        const convertedHTML = editor
          .getHTML()
          .replace(regex, (match, insertKey, insertLabel) => {
            if (insertKey === "custom") {
              return `[[${
                props.signifyCustomInsert === undefined ||
                props.signifyCustomInsert
                  ? `custom=`
                  : ``
              }${insertLabel}]]`;
            } else {
              return `[[${insertKey}]]`;
            }
          });

        props.onChange(convertedHTML, editor.getJSON());
      }

      // Format the text area to show the inserts
      setTimeout(() => {
        editor.commands.setContent(
          formatJSONContent(editor.getJSON(), inserts)
        );
        editor.commands.setTextSelection(tr.selection);
      });
    },
  });

  // If value updates, update the contents accordingly
  useEffect(() => {
    if (!editor || !props.value) return;
    const currentSelection = editor.state.selection;
    editor.commands.setContent(props.value);
    editor.commands.setTextSelection(currentSelection);

    // Format the text area to show the inserts
    setTimeout(() => {
      if (!editor) return;
      const currentSelection = editor.state.selection;
      editor.commands.setContent(formatJSONContent(editor.getJSON(), inserts));
      editor.commands.setTextSelection(currentSelection);
    });
  }, [props.value]);

  // On initial load, format the text area to show the inserts
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(formatJSONContent(editor.getJSON(), inserts));
  }, [editor]);

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        content: {
          p: {
            fontSize: 14,
          },
          minHeight: props.height || 200,
        },
      }}
    >
      <RichTextEditor.Toolbar sticky stickyOffset={60}>
        <RichTextEditor.ControlsGroup>
          {inserts
            .filter((insert) => insert.key !== "custom")
            .map((insert, index) => (
              <InsertControl key={index} insert={insert} />
            ))}
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Blockquote />
          <RichTextEditor.Hr />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <ScrollArea h={props.height || 200}>
        <RichTextEditor.Content />
      </ScrollArea>
    </RichTextEditor>
  );
}
