import React, { useContext, useState, useCallback, useEffect, useRef } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'
import YAML from 'js-yaml'


import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { IoExitOutline, IoEaselOutline, IoList, IoPencil, IoPieChartSharp, IoSave, IoPlaySharp, IoChevronForwardOutline, IoCheckmarkSharp, IoToggleOutline, IoToggle, IoCodeOutline, IoExpand, IoCodeWorkingOutline, IoFlash } from 'react-icons/io5'
import Modal from 'react-modal';

import PieChart from '../charts/pie'
import { useHistory, useParams } from 'react-router'
import { Link } from "react-router-dom"
import MainContext from '../../context'
import Sankey from './sankey'
import {NoResults} from '../../util-funcs'
import Interactions from '../workflows-page/interactions'
import ExportWorkflow from './export'
import {LoadingPage} from '../loading'


async function checkStartType(wf, setError) {
    // check for event start type
    try {
        let y = YAML.load(wf)
        if (y.start) {
            if (y.start.type !== "default") {
                // this file should not be able to be executed.
                return false
            }
        }
        return true
    } catch (e) {
        setError(`Unable to parse workflow: ${e.message}`)
        // return true if an error happens as the yaml is not runnable in the first place
        return true
    }
}

export default function WorkflowPage() {
    const { fetch, namespace, handleError, attributeAdd, checkPerm, permissions, workflowInteractions } = useContext(MainContext)
    const [viewSankey, setViewSankey] = useState("")

    const [showLogEvent, setShowLogEvent] = useState(false)
    const [logEvent, setLogEvent] = useState("hello-world")

    const [workflowValue, setWorkflowValue] = useState(null)
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const [executable, setExecutable] = useState(true)
    const [fullscrenEditor, setFullScreenEditor] = useState(localStorage.getItem('fullscrenEditor') === "true")
    const [workflowInfo, setWorkflowInfo] = useState({ revision: 0, active: true, fetching: true })

    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")
    const [executeErr, setExecuteErr] = useState("")
    const [toggleErr, setToggleErr] = useState("")
    const codemirrorRef = useRef();
    const [tab, setTab] = useState("functions")
    const [functions, setFunctions] = useState(null)

    const history = useHistory()
    const params = useParams()
    const [apiModalOpen, setAPIModalOpen] = useState(false)
    const [exportModalOpen, setExportModalOpen] = useState(false)
    const [waitCount, setWaitCount] = useState(0)


    function toggleAPIModal() {
        setAPIModalOpen(!apiModalOpen)
    }

    function toggleExportModal() {
        setExportModalOpen(!exportModalOpen)
    }




    function setFetching(fetchState) {
        setWorkflowInfo((wfI) => {
            wfI.fetching = fetchState;
            return { ...wfI }
        })
    }

    const fetchKnativeFunctions = useCallback(()=>{
        setFetching(true)
        async function fetchKnativeFuncs() {
            try {
                let resp = await fetch(`/functions/`, {
                    method: "POST",
                    body: JSON.stringify({
                        workflow: params.workflow,
                        namespace: namespace, 
                        scope: "w"
                    })
                })
                if(resp.ok) {
                    let arr = await resp.json()
                    if (arr.length > 0) {
                        setFunctions(arr)
                    } else {
                        setFunctions([])
                    }
                } else {
                    await handleError('fetch knative functions', resp, "fetchKnativeFunctions")
                }
            } catch(e) {
                setErr(`Unable to fetch knative functions: ${e.message}`)
            }
        }

        return fetchKnativeFuncs().finally(()=>{setFetching(false)})
    },[fetch, namespace, params.workflow, handleError])

    const fetchWorkflow = useCallback(() => {
        setFetching(true)
        async function fetchWf() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let wf = atob(json.workflow)


                    let exec = await checkStartType(wf)

                    setExecutable(exec)
                    setWorkflowValue(wf)
                    setWorkflowValueOld(wf)
                    setWorkflowInfo((wfI) => {
                        wfI.active = json.active
                        return { ...wfI }
                    })
                    setLogEvent(json.logToEvents)
                } else {
                    await handleError('fetch workflow', resp, 'getWorkflow')
                }
            } catch (e) {
                // sendNotification("Failed to fetch workflow", e.message, 0)
                setErr(`Failed to fetch workflow: ${e.message}`)
            }
        }
        return fetchWf().finally(() => { setFetching(false);})
    }, [namespace, fetch, params.workflow, handleError])

    const updateWorkflow = useCallback(() => {
        if (workflowInfo.fetching) {
            return // TODO - User Feedback
        }
        setFetching(true)

        async function updateWf() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}`, {
                    method: "put",
                    headers: {
                        "Content-type": "text/yaml",
                        "Content-Length": workflowValue.length,
                    },
                    body: workflowValue
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setWorkflowInfo((wfI) => {
                        wfI.active = json.active;
                        wfI.revision = json.revision;
                        return { ...wfI }
                    })
                    setWorkflowValueOld(workflowValue)
                    let exec = await checkStartType(workflowValue)
                    setExecutable(exec)
                    setActionErr("")
                    history.replace(`${json.id}`)
                } else {
                    await handleError('update workflow', resp, 'updateWorkflow')
                }
            } catch (e) {
                setActionErr(`Failed to update workflow: ${e.message}`)
            }
            return
        }
        updateWf().finally(() => { setFetching(false) })
    }, [namespace, workflowValue, fetch, history, workflowInfo.fetching, params.workflow, handleError])

    const updateLogEvent = useCallback(() => {
        if (workflowInfo.fetching) {
            return // TODO - User Feedback
        }
        setFetching(true)

        async function postLogEvent() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}?logEvent=${logEvent}`, {
                    method: "put",
                    headers: {
                        "Content-type": "text/yaml",
                        "Content-Length": workflowValueOld.length,
                    },
                    body: workflowValueOld
                })
                if (!resp.ok) {
                    await handleError('post log event', resp, 'updateWorkflow')
                } else {
                    setActionErr("")
                }
            } catch (e) {
                setActionErr(`Failed to set log event: ${e.message}`)
            }
            return
        }
        return postLogEvent().finally(() => { setFetching(false) })
    }, [namespace, workflowValueOld, fetch, workflowInfo.fetching, logEvent, params.workflow, handleError])

    // polling knative functions
    useEffect(()=>{
            let interval = setInterval(()=>{
                console.log('polling knative funcs')
                fetchKnativeFunctions()
            }, 3000)
        return () => {
            clearInterval(interval)
        }
    },[fetchKnativeFunctions, namespace, functions])

    // Initial fetchKnativeFunctions Fetch
    useEffect(() => {
        if (namespace !== "" && functions === null) {
            fetchKnativeFunctions().finally(()=> {setWaitCount((wc)=>{return wc +1})})
        }
    }, [fetchKnativeFunctions, namespace, functions])

    // Initial fetchWorkflow Fetch
    useEffect(() => {
        if (namespace !== "" && workflowValue === null) {
            fetchWorkflow().finally(()=> {setWaitCount((wc)=>{return wc +1})})
        }
    }, [fetchWorkflow, namespace, workflowValue])

    useEffect(() => {
        localStorage.setItem('fullscrenEditor', fullscrenEditor);
    }, [fullscrenEditor])

    let saveButton = (
        <div className={workflowValueOld !== workflowValue ? "editor-footer-button" : "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { updateWorkflow() }}>
            <span style={{}} >Save</span>
            <IoSave style={{ marginLeft: "5px" }} />
        </div>
    );

    let logButton = (
        <>
            {!showLogEvent ?
                <div className="editor-footer-button" style={{ maxHeight: "%", padding: "0 10px 0 10px" }} onClick={() => {
                    setTimeout(function () { document.getElementById('log-input').focus(); }, 100);
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
    );

    let executeButton = (
        <div className={workflowInfo.active && executable ? "editor-footer-button" : "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => {
            if (workflowInfo.active && executable) {
                executeWorkflow()
            }
        }}>
            <span style={{}} >Execute</span>
            <IoPlaySharp style={{ marginLeft: "5px" }} />
        </div>
    );

    async function executeWorkflow() {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                method: "POST",
                body: jsonInput
            })
            if (resp.ok) {
                let json = await resp.json()
                history.push(`/i/${json.instanceId}`)
            } else {
                await handleError('execute workflow', resp, 'executeWorkflow')
            }
        } catch (e) {
            setExecuteErr(`Failed to execute workflow: ${e.message}`)
        }
    }

    async function toggleWorkflow() {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/toggle`, {
                method: "PUT",
            })
            if (resp.ok) {
                // fetch workflow
                // fetchWorkflow()
                let json = await resp.json()
                setWorkflowInfo((wfI) => {
                    wfI.active = json.active;
                    return { ...wfI }
                })
                setToggleErr("")

            } else {
                await handleError('toggle workflow', resp, 'toggleWorkflow')
            }
        } catch (e) {
            setToggleErr(`Failed to toggle workflow: ${e.message}`)
        }
    }

    let WorkflowExpandButton = (
        <div className={"workflow-expand "} onClick={() => { 
            setFullScreenEditor(!fullscrenEditor)
            }} >
            <IoExpand/>
        </div>
    )

    // Refresh editor whenever fullscreen is activated
    useEffect(()=>{
        if (codemirrorRef) {
            codemirrorRef.current.editor.refresh()
        }
    }, [codemirrorRef, fullscrenEditor])

    const Actions = [logButton, saveButton]

    return (
        <>
            <LoadingPage waitCount={waitCount} waitGroup={2} text={`Loading Workflow ${params.workflow}`}/>
            {namespace !== "" ?
                <div className="container" style={{ flex: "auto", padding: "10px" }}>
                    <Modal 
                        isOpen={apiModalOpen}
                        onRequestClose={toggleAPIModal}
                        contentLabel="API Interactions"
                    >
                        <Interactions interactions={workflowInteractions(namespace, params.workflow)} type="Workflow" />
                    </Modal>
                    <Modal 
                        isOpen={exportModalOpen}
                        onRequestClose={toggleExportModal}
                        contentLabel="Export Workflow"
                    >
                        <ExportWorkflow workflow={params.workflow} namespace={namespace} toggleModal={toggleExportModal}/>
                    </Modal>
                    <div className="flex-row" style={{ maxHeight: "64px" }}>

                        <div style={{ flex: "auto" }}>
                            <Breadcrumbs elements={["Workflows", "Example"]} />
                        </div>
                        {toggleErr !== "" ? <div style={{ fontSize: "12px", marginRight: "20px", paddingTop: "5px", paddingBottom: "5px", color: "red", display: "flex", alignItems: "center" }}>
                            {toggleErr}
                        </div> : ""
                        }
                        <WorkflowActions toggleExportModal={toggleExportModal} toggleAPIModal={toggleAPIModal} checkPerm={checkPerm} permissions={permissions} viewSankey={viewSankey} setViewSankey={setViewSankey} fetchWorkflow={fetchWorkflow} active={workflowInfo.active} toggleWorkflow={toggleWorkflow} 
                        namespace={namespace} workflowName={params.workflow}/>
                    </div>
                    <div id="workflows-page">
                        <div className="container" style={{ flexGrow: "2" }}>
                            <div className="container" style={fullscrenEditor ? { flexDirection: "row", height: "100%"} : { flexDirection: "row"}}>
                                <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "2", minWidth: "350px" }}>
                                    <TileTitle actionsDiv={WorkflowExpandButton} name={`Editor ${workflowValueOld !== workflowValue ? "*" : ""}`} >
                                        <IoPencil/>
                                    </TileTitle>
                                    {err !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                        {err}
                                    </div>
                                        :
                                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative" }}>
                                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                                <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                                    <Editor functions={functions} editorRef={codemirrorRef} err={actionErr} value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow} showFooter={true} actions={fullscrenEditor ? [logButton, executeButton, saveButton] : [logButton, saveButton]} commentKey={"#"}/>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                                {!fullscrenEditor ?
                                <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1", minWidth: "350px" }}>
                                    <TileTitle name="Execute Workflow">
                                        <IoChevronForwardOutline />
                                    </TileTitle>
                                    {checkPerm(permissions, "executeWorkflow") ?
                                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative" }}>
                                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                                <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                                    <Editor err={executeErr} value={jsonInput} setValue={setJsonInput} showFooter={true} actions={[executeButton]} />
                                                </div>
                                            </div>
                                        </div> :
                                        <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                            You are unable to 'execute workflow', contact system admin to grant 'executeWorkflow'.
                            </div>
                                    }
                                </div> : <></>}
                            </div>
                            {!fullscrenEditor ?
                            <>
                            {viewSankey ?
                                <div className="item-0 shadow-soft rounded tile">
                                    <TileTitle name="Sankey">
                                        <IoEaselOutline />
                                    </TileTitle>
                                    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                                        <div style={{ width: "100%", position: "absolute", display: "flex", flexDirection: "row-reverse" }}>
                                            <div onClick={() => setViewSankey(false)} title="Swap to Graph View" className="circle button toggled-switch shadow-soft-inverse" style={{ marginLeft: "10px", position: "relative", top: "30px", zIndex: "5" }}>
                                                <span style={{ flex: "auto" }}>
                                                    <IoToggle style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ flex: "auto" }}>
                                            <Sankey />
                                        </div>
                                    </div>
                                </div>
                                :
                                <div className="item-0 shadow-soft rounded tile">
                                    <TileTitle name="Graph">
                                        <IoEaselOutline />
                                    </TileTitle>
                                    {err !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                        {err}
                                    </div> :
                                        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>

                                            <><div style={{ width: "100%", position: "absolute", display: "flex", flexDirection: "row-reverse" }}>
                                                <div onClick={() => setViewSankey(true)} title="Swap to Sankey View" className="circle button" style={{ marginLeft: "10px", position: "relative", top: "30px", zIndex: "5" }}>
                                                    <span style={{ flex: "auto" }}>
                                                        <IoToggleOutline style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                                    </span>
                                                </div>
                                            </div>

                                                <div style={{ flex: "auto" }}>
                                                    {/* THIS CHECK IS HERE SO THE GRAPH LOADS PROPERLY */}
                                                    {workflowValueOld !== null && functions !== null ?
                                                        <Diagram functions={functions} value={workflowValueOld} />
                                                        :
                                                        ""
                                                    }
                                                </div></>
                                        </div>
                                    }
                                </div>
                            }</>  : <></>}
                        </div>
                        {!fullscrenEditor ?
                        <div className="container graph-contents" style={{ width: "300px" }}>
                            <div className="item-1 shadow-soft rounded tile" style={{ height: "280px" }}>
                                <TileTitle name="Executed Workflows">
                                    <IoPieChartSharp />
                                </TileTitle>
                                <div id="pie-dish" className="tile-contents">
                                    <PieComponent />
                                </div>
                            </div>
                            <div className="item-0 shadow-soft rounded tile">
                                <TileTitle actionsDiv={[<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "events"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("events") }} >
                        <IoFlash />  Instances
        </div>,<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "functions"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("functions") }} >
        <IoCodeWorkingOutline /> Functions
        </div>]}>
                                    <IoList /> Details
                                </TileTitle>
                                {tab === "events"?
                                    <div id="workflow-page-events" style={{ maxHeight: "512px", overflowY: "auto" }}>
                                        <div id="events-tile" className="tile-contents">
                                            <EventsList />
                                        </div>
                                    </div>:""
                                }
                                {tab === "functions" ?
                                     <div id="workflow-page-events" style={{ maxHeight: "512px", overflowY: "auto" }}>
                                     <div id="events-tile" className="tile-contents">
                                         <FuncComponent functions={functions}/>
                                     </div>
                                 </div>:""
                                }
                            </div>
                            {attributeAdd ? attributeAdd : ""}
                        </div> : <></>}
                    </div>
                </div> : ""}
        </>
    )
}



function PieComponent() {
    const { fetch, namespace, handleError } = useContext(MainContext)
    const params = useParams()
    const [metrics, setMetrics] = useState(null)
    const [err, setErr] = useState("")

    useEffect(() => {
        async function fetchMet() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/metrics`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let met = [
                        {
                            title: "Completed",
                            value: json.successfulExecutions
                        },
                        {
                            title: "Failed",
                            value: json.totalInstancesRun - json.successfulExecutions
                        }
                    ]
                    setMetrics(met)
                } else {
                    await handleError('fetch metrics', resp, 'getWorkflowMetrics')
                }
            } catch (e) {
                setErr(`Failed to fetch metrics for workflow: ${e.message}`)
            }
        }
        if (metrics === null) {
            fetchMet()
        }
    }, [fetch, namespace, params.workflow, metrics, handleError])

    if (err !== "") {
        return (
            <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                {err}
            </div>
        )
    }

    if (metrics === null) {
        return ""
    }



    return (
        <PieChart lineWidth={40} data={metrics} />
    )
}

function FuncComponent(props) {
    const {functions} = props

    return(
      <div>
              <ul style={{margin:"0px"}}>
                {functions !== null ?
                    <>
                        {functions.length > 0 ?
                            <>
                                {functions.map((obj) => {
                                    console.log("knative func", obj)
                                    return(
                                        <li title={obj.statusMessage}  className="event-list-item">
                                            <div>
                                                <span><CircleFill className={obj.status === "True" ? "success": "failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                <span>
                                                    {obj.info.name}({obj.info.image})
                                                </span>
                                            </div>
                                        </li>
                                    )
                                })}
                            </>
                            : <NoResults />}
                    </> : ""}
              </ul>
      </div>
    )
}

function EventsList(props) {
    const { fetch, namespace, handleError } = useContext(MainContext)
    const params = useParams()
    const [instances, setInstances] = useState(null)
    const [err, setErr] = useState("")

    useEffect(() => {
        async function fetchd() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/instances/`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.workflowInstances) {
                        setInstances(json.workflowInstances)
                    } else {
                        setInstances([])
                    }
                } else {
                    await handleError('fetch workflow instances', resp, 'listWorkflowInstances')
                }
            } catch (e) {
                setErr(`Unable to fetch workflow instances: ${e.message}`)
            }
        }
        if (instances === null) {
            fetchd()
        }
    }, [fetch, namespace, params.workflow, instances, handleError])

    return (
        <div>
            {
                err !== "" ?
                    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                        {err}
                    </div>
                    :
                    <ul style={{ margin: "0px" }}>
                        {instances !== null ?
                            <>
                                {instances.length > 0 ?
                                    <>
                                        {instances.map((obj) => {
                                            return (
                                                <Link key={obj.id} to={`/i/${obj.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                                                    <li style={{ cursor: "pointer" }} className="event-list-item">
                                                        <div>
                                                            <span><CircleFill className={obj.status} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                            <span>
                                                                {obj.id}
                                                            </span>
                                                        </div>
                                                    </li>
                                                </Link>
                                            )
                                        })}
                                    </>
                                    : <NoResults />}
                            </> : ""}
                    </ul>}
        </div>
    )
}

function WorkflowActions(props) {
    const { workflowButtons } = useContext(MainContext)
    const { checkPerm, permissions, active, toggleWorkflow, toggleAPIModal, toggleExportModal, workflowName, namespace } = props

    return (
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", marginRight: "12px" }}>
            <div onClick={() => toggleExportModal()} title={"Export Workflow"} className="circle button" style={{ position: "relative", zIndex: "5" }}>
                    <span style={{ flex: "auto" }}>
                        <IoExitOutline style={{ fontSize: "12pt", marginBottom: "6px", fill: "green" }} />
                    </span>
            </div>
            <div onClick={() => toggleAPIModal()} title={"API Interactions"} className="circle button" style={{ position: "relative", zIndex: "5", marginRight: "10px" }}>
                    <span style={{ flex: "auto" }}>
                        <IoCodeOutline style={{ fontSize: "12pt", marginBottom: "6px", fill: "green" }} />
                    </span>
            </div>
            {checkPerm(permissions, "getWorkflow") ?
            <>
            <div title="Workflow Variables" >
                <Link className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit", marginRight: "10px"}} 
                to={`/${namespace}/w/${workflowName}/variables`}>
                    <span style={{fontWeight: "bold"}}>
                        VAR
                    </span>
                </Link>
                </div>
            </>: ""}
            {checkPerm(permissions, "toggleWorkflow") ?
                <div onClick={() => toggleWorkflow()} title={active ? "Disable" : "Enable"} className="circle button" style={{ position: "relative", zIndex: "5", marginRight:"10px" }}>
                    {
                        active ?
                            <span style={{ flex: "auto" }}>
                                <IoToggle style={{ fontSize: "12pt", marginBottom: "6px", fill: "green" }} />
                            </span>
                            :
                            <span style={{ flex: "auto" }}>
                                <IoToggleOutline className={"toggled-switch"} style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                            </span>

                    }
                </div> : ""}
            {workflowButtons.map((obj)=>{
                let url = obj.url
                for (var i=0; i < obj.replace.length; i++) {
                    if (obj.replace[i].key === "namespace") {
                        url = url.replaceAll(obj.replace[i].val, namespace)
                    }
                    if (obj.replace[i].key === "workflow") {
                        url = url.replaceAll(obj.replace[i].val, workflowName)
                    }
                }
                return obj.element(url)
            })}
        </div>

    )
}