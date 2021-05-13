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
    const { value, setValue, saveCallback, readOnly, showFooter, actions, loading, err } = props;
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

    return (
        <div className="editor-wrapper">
            {loading ? <div className="editor-loading"></div> : <></>}
            <div className={showFooter ? "editor-small" : "editor-full"}>
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
                    onBeforeChange={(editor, data, val) => {
                        setValue(val)
                    }}
                />
            </div>

            {showFooter !== undefined && showFooter ? (<>
                <div id="test" className="editor-footer">
                 
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                    {err !== "" ?<div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", marginRight:"20px", color: "red" }}>
                        {err}
                        </div>:""}
                        {actions !== undefined ? (
                            actions.map(function (Action, i) {
                                return (
                                    <div key={`editor-action-${i}`}>
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