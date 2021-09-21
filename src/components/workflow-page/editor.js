import { Controlled as CodeMirror} from "react-codemirror2";
import React, {  useCallback, useEffect, useState   } from 'react'


// style editor
import 'codemirror/lib/codemirror.css';
import "../../style/editor-theme.css"

import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/foldgutter.css';

// linting yaml
import "codemirror/mode/yaml/yaml.js";
import "codemirror/addon/lint/yaml-lint";

function getFunctionLines(str){
    var arr = str.split("\n");
    var fLines = {};
    var inF = false;
    var fTabs = 0
    var fChildTabs = 0;
    var fInfoSink = {id: null, type: null, service: null}

    for (var i = 0; i < arr.length; i++)
    {
        if (inF){
            var numberOfTabs = arr[i].match(/^[\s-]*/)[0].length
            
            if (numberOfTabs <= fTabs) {
                break // Left function 
            }

            if (fChildTabs === 0){
                fChildTabs = numberOfTabs
            } else if(numberOfTabs < fChildTabs){
                break // Left function
            }

            // Check if this line contains id, service, type
            var fID = arr[i].replace(/^[\s-]*id:/, "")
            var fService = arr[i].replace(/^[\s-]*service:/, "")
            var fType = arr[i].replace(/^[\s-]*type:/, "")
            if (fID !== arr[i]) {
                // If id was extracted from line, push it
                let startPos = arr[i].match(/^[\s-]*id:\s*/)[0].length
                let endPos = arr[i].match(/^[\s-]*id:\s*[\w-]*/)[0].length
                fLines[fID.trim()] =  {line: i, start: startPos, end: endPos}
                fInfoSink.id = fID.trim()
            } else if (fService !== arr[i]) {
                fInfoSink.service = fService.trim()
            } else if (fType !== arr[i]) {
                fInfoSink.type = fType.trim()
            }

            // Set Type
            if (fInfoSink.id && fInfoSink.type) {
                if (fInfoSink.type !== "knative-namespace" && fInfoSink.type !== "knative-global") {
                    fLines[fInfoSink.id].type = fInfoSink.type
                    fInfoSink = {id: null, type: null, service: null}
                } else if (fInfoSink.service){
                    fLines[fInfoSink.id].type = fInfoSink.type
                    fLines[fInfoSink.id].service = fInfoSink.service
                    fInfoSink = {id: null, type: null, service: null}
                }

            }
        } else if (/^\s*functions:/.test(arr[i])){
            inF  = true; // Entered Function
            fTabs = arr[i].match(/^\s*/)[0].length
        }
    }

    return fLines
}

function makeGutterError(msg) {
    var tooltip = document.createElement("div");
    var tooltipText = document.createElement("div");
    tooltip.style.color = "#FF4040";
    tooltip.innerHTML = "●";
    tooltip.setAttribute('class', 'tooltip')

    tooltipText.setAttribute('class', 'tooltiptext')
    tooltipText.innerHTML = msg

    tooltip.appendChild(tooltipText)
    return tooltip;
}

export default function ReactEditor(props) {
    const { refValSet, value, setValue, saveCallback, readOnly, showFooter, actions, loading, err, commentKey, editorRef, functions } = props;
    console.log(refValSet)
    const [cmEditor, setCMEditor] = useState(null)
    const [marks, setMarks] = useState(null)
    const [init, setInit] = useState(false)


    const setFunctionErrors = useCallback((cm)=>{
        if(init) {
            let fLines = null;
            let markedTexts = []
            cm.clearGutter('Custom-Errors');
            for (var i = 0; i < functions.length; i++)
            {
                var errorMsg = ""
                if(functions[i].conditions){
                    for (const fCondition of functions[i].conditions) {
                        if (errorMsg !== "") {
                            errorMsg += "<br>"
                        }
        
                        if (fCondition.status === "False"){
                            errorMsg += `${fCondition.name}<br>├─Status: ${fCondition.status}<br>${fCondition.reason ? `├─Reason: ${fCondition.reason}<br>` : ""}`
                            errorMsg += `└─Message: ${fCondition.message.length < 60 ? fCondition.message : "Too large to preview"}<br>`
                        }
                    }
                }
           
    
                let foundFunction = false
                if (errorMsg !== "") {
                    // Get functions lines on first error
                    if (fLines === null){
                        fLines = getFunctionLines(value);
                    }
    
                    // Extra check to make sure that value still has function
                    let invalidF = fLines[functions[i].info.name]
                    if (invalidF !== undefined && invalidF.type === "reusable") {
                        cm.setGutterMarker(invalidF.line, 'Custom-Errors', makeGutterError(errorMsg));
                        markedTexts.push(cm.markText({ch: invalidF.start, line: invalidF.line}, {ch: invalidF.end, line: invalidF.line}, {className: 'line-error'}))
                        foundFunction = true
                    }
    
                    // Did not find function, look for global / namespace services
                    if (!foundFunction) {
                        for (const [val] of Object.values(fLines)) {
                            if (val.type === "knative-namespace" && functions[i].info.namespace !== "" && (val.service === functions[i].serviceName || `ns-${functions[i].info.namespace}-${val.service}` === functions[i].serviceName)) {
                                // found namespace service
                                cm.setGutterMarker(val.line, 'Custom-Errors', makeGutterError(errorMsg));
                                markedTexts.push(cm.markText({ch: val.start, line: val.line}, {ch: val.end, line: val.line}, {className: 'line-error'}))
                                foundFunction = true
                                break
                            } else if (val.type === "knative-global" && functions[i].info.namespace === ""  && (val.service === functions[i].serviceName || `g-${val.service}` === functions[i].serviceName)) {
                                // found global service
                                cm.setGutterMarker(val.line, 'Custom-Errors', makeGutterError(errorMsg));
                                markedTexts.push(cm.markText({ch: val.start, line: val.line}, {ch: val.end, line: val.line}, {className: 'line-error'}))
                                foundFunction = true
                                break
                            }
                        }
                    }
               }
            }
    
            // Clear old marks
            for (i = 0; i < marks.length; i++){
                marks[i].clear()
            }
            
            // Save new marks
            setMarks(markedTexts)
            setInit(true)
        }
    },[functions,marks,value,init])


    function editorSave(cm) {
        if (functions) {
            setFunctionErrors(cm)
        }

        if (saveCallback) {
            saveCallback()
            return
        }

        console.warn("Editor: saveCallback not set")
    }

    useEffect(() => {
        if (functions && cmEditor && value && value.length > 0) {
            setFunctionErrors(cmEditor)
        }
    }, [functions, cmEditor, value, setFunctionErrors])

    return (
        <div className="editor-wrapper">
            {loading ? <div className="editor-loading"></div> : <></>}
            <div className={showFooter ? "editor-small" : "editor-full"}>
                <CodeMirror
                    ref={editorRef}
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
                        foldGutter: true,
                        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "Custom-Errors"],
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
                                if (!commentKey) {
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
                        refValSet.current = val
                    }}
                    editorDidMount={(cm, val)=>{
                        setCMEditor(cm)
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