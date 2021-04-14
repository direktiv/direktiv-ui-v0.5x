import Editor from "@monaco-editor/react"

const val = `id: noop
description: "" 
states:
- id: hello
  type: noop
  transform: '{ result: "Hello World!" }'
`
export default function ReactEditor(props) {
    const {height, width} = props
    
    return(
        <Editor
          defaultLanguage="yaml"
          defaultValue={val}
          height={height}
          width={width}
          options={{
              minimap: {
                  enabled: false,
              },
              automaticLayout: true
          }}
        />
    )
}