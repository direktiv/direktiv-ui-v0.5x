import {Controlled as CodeMirror} from "react-codemirror2";

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

    return(
        <div style={{height:"100%", width:"100%"}}>
            <CodeMirror
                height="auto"
                value={val}
                options={{
                    mode: 'yaml',
                    lineNumbers: true,
                }}
                onChange={(editor, data, value)=>{

                }}
            />
        </div>

    )
}