import {Controlled as CodeMirror} from "react-codemirror2";
import React from "react";

// style editor
import 'codemirror/lib/codemirror.css';

// theme
import '../../style/editor-theme.css'

// linting yaml
import "codemirror/mode/yaml/yaml.js";
import "codemirror/addon/lint/yaml-lint";

export default function ReactEditor(props) {
    const {value, setValue, saveCallback, readOnly} = props;

    function editorSave() {
        if (saveCallback) {
            saveCallback()
            return
        }

        console.warn("Editor: saveCallback not set")
    }

    return(
        <>
            <CodeMirror
                value={value}
                options={{
                    theme:'editor-theme',
                    mode: 'yaml',
                    lineNumbers: true,
                    lineWrapping: true,
                    readOnly: readOnly ? "nocursor": false,
                    extraKeys: {
                        "Ctrl-S": editorSave,
                        "Shift-Tab": "indentLess",
                        Tab: function (cm) {
                          var spaces = Array(cm.getOption("indentUnit") + 1).join(
                            " "
                          );
                          cm.replaceSelection(spaces);
                        },
                    },
                }}
                onBeforeChange={(editor, data, value)=>{
                    setValue(value)
                }}
            />
        </>
    )
}