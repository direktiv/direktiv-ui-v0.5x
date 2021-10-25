import Sankey from '../../workflow-page/sankey'
import Diagram from '../../workflow-page/diagram'
import Editor from "../../workflow-page/editor"
import { IoCheckmarkSharp,  IoSave} from "react-icons/io5";
import { useHistory } from 'react-router';

export default function EditorDetails(props) {
    const { namespace, path, editorTab, wfRefValue, functions, codemirrorRef, actionErr, workflowValue, setWorkflowValue, updateWorkflow, workflowValueOld, metricsLoading, stateMetrics, showLogEvent, updateLogEvent, setShowLogEvent, logEvent, setLogEvent} = props
    return(
        <>
            {editorTab === "editor" ? 
                        <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "100%", minHeight: "300px", top: "-28px", position: "relative", flex: 1 }}>
                            <div style={{ width: "100%", flex: "1", height: "100%", position: "relative" }}>
                                <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: "-25px" }}>
                                    <Editor refValSet={wfRefValue} functions={functions} editorRef={codemirrorRef} err={actionErr} value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow} showFooter={true} actions={[
                                    <WorkflowBuilderButton namespace={namespace} path={path} />,
                                    <LogButton showLogEvent={showLogEvent} updateLogEvent={updateLogEvent} setShowLogEvent={setShowLogEvent} logEvent={logEvent} setLogEvent={setLogEvent} />,
                                    <SaveButton workflowValueOld={workflowValueOld} workflowValue={workflowValue} updateWorkflow={updateWorkflow} />]} commentKey={"#"}/>
                                </div>
                            </div>
                        </div>
                        :
                        ""
            }
            {editorTab === "diagram" ?
                    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative" }}>
                    {/* THIS CHECK IS HERE SO THE GRAPH LOADS PROPERLY */}
                    {workflowValueOld !== null && !metricsLoading ?
                        <Diagram metrics={stateMetrics} functions={functions} value={workflowValueOld} />
                        :
                        ""
                    }
                  </div>
                :
                ""
            }
            {editorTab === "sankey" ?
                <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                    <div style={{ flex: "auto" }}>
                        <Sankey />
                    </div>
                </div>
                :
                ""
            }
        </>
    )
}


let SaveButton = (props) => {
    const {workflowValueOld, workflowValue, updateWorkflow} = props
    return (
        <div className={workflowValueOld !== workflowValue ? "editor-footer-button" : "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { updateWorkflow() }}>
            <span style={{}} >Save</span>
            <IoSave style={{ marginLeft: "5px" }} />
        </div>
    )
};

let WorkflowBuilderButton = (props) => {
    const history = useHistory()
    const {path, namespace} = props
    return (
        <div className="editor-footer-button"   style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { 
            history.push(`/n/${namespace}/flowy/${path}`)
         }}>
            <span style={{}} >Workflow Builder</span>
        </div>
    )
}

let LogButton = (props) => {
    const {showLogEvent, updateLogEvent, setShowLogEvent, logEvent, setLogEvent} = props
    return(
        <>
            {!showLogEvent ?
                <div className="editor-footer-button" style={{ maxHeight: "%", padding: "0 10px 0 10px" }} onClick={() => {
                    setTimeout(function () { document.getElementById('log-input').focus(); }, 500);
                    setShowLogEvent(true)
                }}>
                    Log To Event
            </div> :
                <div className="editor-footer-button" style={{ display: "flex", alignItems: "center", padding: "0 0 0 0" }}>
                    <input id="log-input" style={{ height: "20px", border: "none", borderRadius: "0px", backgroundColor: "#303030", color: "white", margin: "0px", fontSize: "12pt" }} placeholder={`Target Log Event`} value={logEvent} onChange={(e) => setLogEvent(e.target.value)} />
                    <div style={{ padding: "0 10px 0 10px", height: "100%", display: "flex", alignItems: "center" }} onClick={() => {
                        updateLogEvent().then(() => {
                            setShowLogEvent(false)
                        })
                    }}>
                        <IoCheckmarkSharp />
                    </div>
                </div>
            }
        </>
    )
};