import {Controlled as CodeMirror} from "react-codemirror2";
import React, { useState, useEffect } from "react";

// style editor
import 'codemirror/lib/codemirror.css';
// linting yaml
import "codemirror/mode/yaml/yaml.js";
import "codemirror/addon/lint/yaml-lint";

const val = `id: noop
description: "" 
states:
- id: hello
  type: noop
  transform: '{ result: "Hello World!" }'
`

export default function ReactEditor() {
    const [debugValue, setDebugValue] = useState(val);

    return(
        <div className="codearea">

            <CodeMirror
                value={debugValue}
                options={{
                    mode: 'yaml',
                    lineNumbers: true,
                    lineWrapping: true
                }}
                onBeforeChange={(editor, data, value)=>{
                    setDebugValue(value)
                }}
            />
            </div>
    )
}