import Editor, { useMonaco } from "@monaco-editor/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useResizeDetector } from "react-resize-detector"

const val = `id: noop
description: "" 
states:
- id: hello
  type: noop
  transform: '{ result: "Hello World!" }'
`

export default function ReactEditor() {

    const editorRef = useRef(null)   
    const onResize = useCallback(()=>{
        if(editorRef.current !== null) {
            editorRef.current.layout();
        }
    },[])

    // useResizeDetector
    const {ref} = useResizeDetector({
        handleHeight: true,
        handleWidth: true,
        refreshRate: 1000,
        onResize
    })

    // On editor mount
    function handlerEditorDidMount(editor, monaco) {
        editorRef.current = editor
        editorRef.current.layout();
    }

    return(
        <div ref={ref} style={{maxWidth:"100%", overflow: "hidden", maxHeight:"100%"}}>
            <Editor
                ref={ref}
                defaultLanguage="yaml"
                defaultValue={val}
                onMount={handlerEditorDidMount}
                options={{
                    minimap: {
                        enabled: false,
                    },
                    scrollBeyondLastLine: false,
                    automaticLayout: false,
                }}
                loading=""
            />
        </div>

    )
}