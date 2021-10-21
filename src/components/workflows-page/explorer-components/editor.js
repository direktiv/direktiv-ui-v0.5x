import Sankey from '../../workflow-page/sankey'
import Diagram from '../../workflow-page/diagram'
import Editor from "../../workflow-page/editor"
import { IoCheckmarkSharp,  IoClose,  IoGitCommitSharp,  IoSave} from "react-icons/io5";
import { useEffect, useState } from 'react';
import { WorkflowEditRoute, WorkflowRoute } from '../api';

export default function EditorDetails(props) {
    const {fetch, setErr, active, showError, namespace, refs, workflow, handleError, editorTab, wfRefValue, discardWorkflow, saveWorkflow, ref, functions, codemirrorRef, actionErr, workflowValue, setWorkflowValue, updateWorkflow, workflowValueOld, metricsLoading, stateMetrics, showLogEvent, updateLogEvent, setShowLogEvent, logEvent, setLogEvent} = props
    return(
        <>
            {editorTab === "routing" ?
                <WorkflowRouting active={active} showError={showError} setErr={setErr} refs={refs} fetch={fetch} namespace={namespace} workflow={workflow} handleError={handleError} />
                :""
            }
            {editorTab === "editor" ? 
                        <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "100%", minHeight: "300px", top: "-28px", position: "relative", flex: 1 }}>
                            <div style={{ width: "100%", flex: "1", height: "100%", position: "relative" }}>
                                <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: "-25px" }}>
                                    <Editor refValSet={wfRefValue} functions={functions} editorRef={codemirrorRef} err={actionErr} value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow} showFooter={true} actions={[
                                    <LogButton showLogEvent={showLogEvent} updateLogEvent={updateLogEvent} setShowLogEvent={setShowLogEvent} logEvent={logEvent} setLogEvent={setLogEvent} />,
                                    <DiscardButton rev={ref} discardWorkflow={discardWorkflow} />,
                                    <CommitButton rev={ref} saveWorkflow={saveWorkflow} />,
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

export  function WorkflowRouting(props) {
    const {refs, fetch, namespace, workflow, handleError, setErr, active, showError} = props

    const [load, setLoad] = useState(true)
    const [routes, setRoutes] = useState([])

    useEffect(()=>{
        async function getWfRouter() {
            let json = await WorkflowRoute(fetch, namespace, workflow, handleError)

            let rrs = refs
            let routes = json.routes

            // check if ref already exists in routes
            for(var i=0; i < routes.length; i++) {
                for(var x=0; x < rrs.length; x++) {
                    if(routes[i].ref === rrs[x].node.name) {
                        delete rrs[x]
                    }
                }
            }

            // add extra refs with weight of 0
            for(var i=0; i < rrs.length; i++) {
                routes.push({
                    weight: 0,
                    ref: rrs[i].node.name,
                })
            }

            setRoutes(routes)
        }
        if (load) {
            getWfRouter()
            setLoad(false)
        }
    },[routes])

    async function editRouter() {
        let nroutes = []
        try {
            for (var i=0; i < routes.length; i++) {
                nroutes.push({
                    weight: document.getElementById(routes[i].ref).value !== "" ? parseInt(document.getElementById(routes[i].ref).value) : 0,
                    ref: routes[i].ref
                })
            }
    
            await WorkflowEditRoute(fetch, namespace, workflow, handleError, nroutes, active)
            setRoutes(nroutes)
        }catch(e) {
            showError(e.message, setErr)
        }
 
    }



    return (
        <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "100%", minHeight: "300px", top: "-28px", position: "relative", flex: 1 }}>
            <div style={{ width: "100%", flex: "1", height: "100%", position: "relative" }}>
                <div style={{ height: "auto", position:  "absolute", left: 0, right: 0, top: "25px", bottom: "-25px", fontSize:"12pt" }}>
                    <table style={{paddingBottom:"20px",borderBottom: "solid 1px var(--light-divider-color)",textAlign:"left", width:"100%"}}>
                        <thead>
                            <tr>
                                <th>
                                    Revisions
                                </th>
                                <th style={{textAlign:'center', width:"30px"}}>
                                    Traffic
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                routes.map((obj)=>{
                                    return(
                                        <tr key={obj.ref}>
                                            <td>{obj.ref}</td>
                                            <td style={{textAlign:'center'}}>
                                                <input type="text" style={{paddingLeft:"0px", width:"50px", textAlign:'center'}} defaultValue={obj.weight} id={obj.ref}/>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                    <div style={{width:"100%", textAlign:"right", paddingTop:"10px"}}>
                        <div style={{ textAlign: "right" }}>
                            <input type="submit" value="Update Routing" onClick={() => {editRouter()}} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
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

let DiscardButton = (props) => {
    const {discardWorkflow} = props
    return(
        <div className={"editor-footer-button"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { discardWorkflow() }}>
            <span style={{}}>Discard</span>
            <IoClose style={{marginLeft:"5px"}}/>
        </div>
    )
}

let CommitButton = (props) => {
    const {saveWorkflow} = props
    return(
        <div className={"editor-footer-button"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { saveWorkflow() }}>
            <span style={{}}>Commit</span>
            <IoGitCommitSharp style={{ marginLeft: "5px" }} />
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