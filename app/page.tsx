"use client"

import { useEditor, EditorContent, Extension, Editor } from "@tiptap/react"
import { Suggestion } from "@tiptap/suggestion"
import StarterKit from "@tiptap/starter-kit"
import { ReactRenderer } from "@tiptap/react"
import tippy, { Instance as TippyInstance } from "tippy.js"
import "tippy.js/dist/tippy.css"
import { useState, forwardRef } from "react"
import ApiKeyManager from "@/components/apikey_manager"

interface CommandsListProps {
  items: string[];
  command: (item: string) => void;
}

interface SuggestionProps {
  query: string;
}

interface CommandProps {
  editor: Editor;
  range: Range;
  props: string;
}

interface Range {
  from: number;
  to: number;
}

interface ReactRendererInstance {
  element: Element;
  ref?: {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  };
  updateProps: (props: Record<string, unknown>) => void;
  destroy: () => void;
}

interface SuggestionItem {
  items: string[];
  command: (item: string) => void;
  editor: Editor;
  clientRect: () => DOMRect;
}

// Suggestion component for the dropdown
const CommandsList = forwardRef<HTMLDivElement, CommandsListProps>((props, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
    >
      {props.items.map((item, index) => (
        <button
          key={index}
          onClick={() => props.command(item)}
          className="w-full p-2 text-left hover:bg-gray-100 flex items-center gap-2 text-black bg-white"
        >
          <span className="text-black">{item}</span>
        </button>
      ))}
    </div>
  )
})
CommandsList.displayName = "CommandsList"

// Suggestion configuration
const suggestion = {
  items: ({ query }: SuggestionProps) => {
    const commands = ["Summarize", "Translate", "Elaborate"]
    return commands.filter(item =>
      item.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 10)
  },

  render: () => {
    let component: ReactRendererInstance;
    let popup: TippyInstance[];

    return {
      onStart: (props: SuggestionItem) => {
        const commandsListProps = {
          items: props.items,
          command: props.command,
        };

        // Create the renderer and properly type cast it
        component = new ReactRenderer(CommandsList, {
          props: commandsListProps,
          editor: props.editor,
        }) as unknown as ReactRendererInstance;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: 'light',
        })
      },

      onUpdate(props: SuggestionItem) {
        const commandsListProps = {
          items: props.items,
          command: props.command,
        };
        
        component?.updateProps(commandsListProps)
        
        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === "Escape") {
          popup?.[0].hide()
          return true
        }

        return component?.ref?.onKeyDown(props)
      },

      onExit() {
        popup?.[0].destroy()
        component?.destroy()
      },
    }
  },
}

// Create the slash commands extension
const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("paragraph")
            .insertContent(` Executing ${props} command...`)
            .run()
        },
        ...suggestion,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default function NotionLikeEditor() {
  const [selectedCommand, setSelectedCommand] = useState<string>("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommands,
    ],
    content: "<p>Welcome to the Notion-like editor! Type / to see available commands.</p>",
    onUpdate: ({ editor }) => {
      if (!editor || !selectedCommand) return

      // Handle command execution
      if (selectedCommand === "Summarize") {
        editor.chain().focus().setContent("Summarizing the content...").run()
      } else if (selectedCommand === "Translate") {
        editor.chain().focus().setContent("Translating the content...").run()
      } else if (selectedCommand === "Elaborate") {
        editor.chain().focus().setContent("Elaborating on the content...").run()
      }
      
      setSelectedCommand("")
    },
  })

  if (!editor) return null

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notion-like Editor</h1>
        <ApiKeyManager />
      </div>
      <div className="border rounded-lg">
        <EditorContent editor={editor} className="prose max-w-none p-4" />
      </div>
    </div>
  )
}