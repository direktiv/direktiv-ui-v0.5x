import { Controlled as CodeMirror } from "react-codemirror2";
import React from "react";


// style editor
import 'codemirror/lib/codemirror.css';
import "../../style/editor-theme.css"


// linting yaml
import "codemirror/mode/yaml/yaml.js";
import "codemirror/addon/lint/yaml-lint";

export default function ReactEditor(props) {
    const { value, setValue, saveCallback, readOnly, showFooter, actions, loading, err, commentKey } = props;

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
                        cursorBlinkRate: readOnly ? 0 : 530,
                        theme: 'editor-theme',
                        mode: 'yaml',
                        lineNumbers: true,
                        lineWrapping: true,
                        readOnly: readOnly ? "readOnly" : false,
                        indentWithTabs: false,
                        smartIndent: true,
                        extraKeys: {
                            "Ctrl-S": editorSave,
                            Tab: (cm) => {
                            if (cm.getMode().name === 'null') {
                                cm.execCommand('insertTab');
                            } else {
                                cm.execCommand('indentMore');
                            }
                            },
                            'Shift-Tab': (cm) => cm.execCommand('indentLess'),
                            "Ctrl-/": function (cm) {
                                // Check if commentKey prop has been passed
                                if (!commentKey || commentKey === "") {
                                    return
                                }

                                if (cm.somethingSelected()) {
                                    let selections = cm.listSelections()
                                    if (!selections) {
                                        return
                                    }

                                    // Get selection lines
                                    const head = selections[0].head.line
                                    const anchor = selections[0].anchor.line

                                    // Orientate lines
                                    const start = head < anchor ? head : anchor
                                    const end = head < anchor ? anchor : head

                                    let positionList = []
                                    let unsetComment = true

                                    // Check if all lines start with comment key
                                    for (let line = start; line <= end; line++) {
                                        let position = {line: line, ch: 0};
                                        if (cm.getRange(position, {...position, ch: commentKey.length}) !== commentKey) {
                                            unsetComment = false
                                        }
                                        positionList.push(position)
                                    }    

                                    // set or unset comments
                                    for (let i in positionList){
                                        const startPos = positionList[i]
                                        if (unsetComment){
                                            cm.replaceRange("", startPos, {...startPos, ch: commentKey.length})
                                        } else {
                                            cm.replaceRange(commentKey, startPos)
                                        }
                                    }

                                } else {
                                    const startPos = {line: cm.getCursor().line, ch: 0}
                                    const endPos =  {line: cm.getCursor().line, ch: commentKey.length}

                                    if (cm.getRange(startPos, endPos) === commentKey) {
                                        cm.replaceRange("", startPos, endPos)
                                    } else {
                                        cm.replaceRange(commentKey, startPos)
                                    }
                                }
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