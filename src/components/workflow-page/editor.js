import { Controlled as CodeMirror } from "react-codemirror2";
import React, { useEffect, useState } from "react";


// style editor
import 'codemirror/lib/codemirror.css';

// theme
import '../../style/editor-theme.css'

// linting yaml
import "codemirror/mode/yaml/yaml.js";
import "codemirror/addon/lint/yaml-lint";

export default function ReactEditor(props) {
    const { value, setValue, saveCallback, readOnly, showFooter, actions } = props;
    const [height, setHeight] = useState("93%")

    useEffect(() => {
        if (showFooter) {
            setHeight("93%")
        } else {
            setHeight("100%")
        }
    }, [showFooter]);

    function editorSave() {
        if (saveCallback) {
            saveCallback()
            return
        }

        console.warn("Editor: saveCallback not set")
    }

    console.log("actions =", actions)

    return (
        <div className="editor-wrapper">
            <div style={{ height: `${height}`, minHeight: `${height}` }}>
                <CodeMirror
                    value={value}
                    options={{
                        theme: 'editor-theme',
                        mode: 'yaml',
                        lineNumbers: true,
                        lineWrapping: true,
                        readOnly: readOnly ? "nocursor" : false,
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
                    onBeforeChange={(editor, data, value) => {
                        setValue(value)
                    }}
                />
            </div>
            {showFooter !== undefined && showFooter ? (<>
                <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                        {actions !== undefined ? (
                            actions.map(function (Action, i) {
                                return (
                                    <div>
                                        {/* <div> */}
                                            {Action}
                                        {/* </div> */}
                                    </div>
                                );
                            })
                        ) : (<></>)}
                    </div>
                </div>
                </>) : (<></>)}

        </div>
    )
}