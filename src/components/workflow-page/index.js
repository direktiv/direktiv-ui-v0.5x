import React, { useContext, useState, useCallback, useEffect, useRef } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'
import YAML from 'js-yaml'


import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { IoExitOutline, IoEaselOutline, IoList, IoPencil,  IoSave, IoPlaySharp, IoChevronForwardOutline, IoCheckmarkSharp, IoToggleOutline, IoToggle, IoCodeOutline, IoExpand, IoCodeWorkingOutline, IoFlash, IoBuildSharp } from 'react-icons/io5'
import Modal from 'react-modal';

import { useHistory, useParams } from 'react-router'
import { Link } from "react-router-dom"
import MainContext from '../../context'
import Sankey from './sankey'
import {NoResults} from '../../util-funcs'
import Interactions from '../workflows-page/interactions'
import ExportWorkflow from './export'
import {LoadingPage} from '../loading'
import { SuccessOrFailedWorkflows } from '../dashboard-page'
import { sendNotification } from '../notifications'


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
        // return true if an error happens as the yaml is not runnable in the first place
        return true
    }
}

export default function WorkflowPage() {
    const { sse,fetch, namespace, handleError, attributeAdd, checkPerm, permissions, workflowInteractions } = useContext(MainContext)
    const [viewSankey, setViewSankey] = useState("")

    const [showLogEvent, setShowLogEvent] = useState(false)
    const [logEvent, setLogEvent] = useState("hello-world")
    const [workflowValue, setWorkflowValue] = useState(null)
    const wfRefValue = useRef(workflowValue)
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const [executable, setExecutable] = useState(true)
    const [fullscrenEditor, setFullScreenEditor] = useState(localStorage.getItem('fullscrenEditor') === "true")
    const [workflowInfo, setWorkflowInfo] = useState({ revision: 0, active: true, fetching: true })

    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")
    const [executeErr, setExecuteErr] = useState("")
    const [toggleErr, setToggleErr] = useState("")
    const [workflowFuncErr, setWorkflowFuncErr] = useState("")
    const codemirrorRef = useRef();
    const [tab, setTab] = useState("functions")
    const [functions, setFunctions] = useState(null)
    const functionsRef = useRef(functions ? functions: [])
    const [funcSource, setFuncSource] = useState(null)
    const history = useHistory()
    const params = useParams()
    const [apiModalOpen, setAPIModalOpen] = useState(false)
    const [exportModalOpen, setExportModalOpen] = useState(false)
    const [waitCount, setWaitCount] = useState(0)

    const workflowRef = useRef()

    const [metricsLoading, setMetricsLoading] = useState(true)
    const [stateMetrics, setStateMetrics] = useState([])
    workflowRef.current = params.workflow
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

    useEffect(()=>{
        if(functions !== null && funcSource === null) {
            // TODO: update route
            let x = `/watch/namespaces/${namespace}/workflows/${workflowRef.current}/functions/`

            let eventConnection = sse(`${x}`,{})
            eventConnection.onerror = (e) => {
                if(e.status === 403) {
                    setWorkflowFuncErr("Permission denied.")
                }
            }

            async function getData(e) {
                let funcs = functionsRef.current
                if (e.data === "") {
                    return
                }
                // process the data here
                // pass it to state to be rendered
                let json = JSON.parse(e.data)
                switch (json.event) {
                case "DELETED":
                    for (var i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            funcs.splice(i, 1)
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                case "MODIFIED":
                    for(i=0; i < funcs.length; i++) {
                        if (funcs[i].serviceName === json.function.serviceName) {
                            funcs[i] = json.function
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                default:
                    let found = false
                    for(i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            found = true 
                            break
                        }
                    }
                    if (!found){
                        funcs.push(json.function)
                        functionsRef.current = funcs
                    }
                }
                let actFailed = true
                for ( i=0; i < functionsRef.current.length; i++) {
                    if (functionsRef.current[i].status === "False") {
                        actFailed = false
                    }
                }
                x = await checkStartType(wfRefValue.current)
                if (!x) {
                    actFailed = false
                }
                setExecutable(JSON.parse(JSON.stringify(actFailed)))
                setFunctions(JSON.parse(JSON.stringify(functionsRef.current)))
            }

            eventConnection.onmessage = e => getData(e)
            setFuncSource(eventConnection)
        }   
    },[functions, funcSource, namespace, sse])
    useEffect(()=>{
        return () => {
            if (funcSource !== null) {
                funcSource.close()
            }
        }
    },[funcSource])

    const fetchKnativeFunctions = useCallback(()=>{
        setFetching(true)
        async function fetchKnativeFuncs() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${workflowRef.current}/functions`, {
                    method: "GET",
                })
                if(resp.ok) {
                    let arr = await resp.json()
                    if (arr.length > 0) {
                        setFunctions(arr)
                    } else {
                        setFunctions([])
                    }
                } else {
                    await handleError('get workflow functions', resp, "listServices")
                }
            } catch(e) {
                setWorkflowFuncErr(e.message)
            }
        }

        return fetchKnativeFuncs().finally(()=>{setFetching(false)})
    },[fetch, handleError, namespace])

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



                    // setExecutable(exec)
                    setWorkflowValue(wf)
                    wfRefValue.current = wf
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
                    let x = await checkStartType(workflowValue)
   
                    setExecutable(x)
                    setWorkflowInfo((wfI) => {
                        wfI.active = json.active;
                        wfI.revision = json.revision;
                        return { ...wfI }
                    })
                    setWorkflowValueOld(workflowValue)
                    setActionErr("")
                    history.replace(`${json.id}`)
                } else {
                    await handleError('update workflow', resp, 'updateWorkflow')
                }
            } catch (e) {
                setActionErr(`Failed to update workflow: ${e.message}`)
            }
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
        }
        return postLogEvent().finally(() => { setFetching(false) })
    }, [namespace, workflowValueOld, fetch, workflowInfo.fetching, logEvent, params.workflow, handleError])

    useEffect(()=>{
        async function getStateMetrics() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/tree/${params.workflow}?op=metrics-state-milliseconds`, {})
                if(resp.ok) {
                    let json = await resp.json()
                    setStateMetrics(json.results)
                } else {
                    await handleError("unable to get state metrics", resp, "getMetrics")
                }
            } catch(e) {
                sendNotification("Error:", e.message, 0)
            }
        }
        if(metricsLoading) {
            getStateMetrics().finally(()=>{setMetricsLoading(false)})
        }
    },[handleError, fetch, metricsLoading, namespace, params.workflow])

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

    let diagramBuildButton = (
        <div onClick={()=>history.push(`/${namespace}/w/${params.workflow}/flowy`)} className={"editor-footer-button"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} >
            <span style={{}} >Workflow Builder</span>
            <IoBuildSharp style={{ marginLeft: "5px" }} />
        </div>
    )

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
                                                    <Editor refValSet={wfRefValue} functions={functions} editorRef={codemirrorRef} err={actionErr} value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow} showFooter={true} actions={fullscrenEditor ? [logButton, executeButton, saveButton] : [logButton, diagramBuildButton, saveButton]} commentKey={"#"}/>
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
                                                    {workflowValueOld !== null && !metricsLoading ?
                                                        <Diagram metrics={stateMetrics} functions={functions} value={workflowValueOld} />
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
                            <SuccessOrFailedWorkflows namespace={namespace} fetch={fetch} workflow={params.workflow} handleError={handleError}/>
                            <div className="item-0 shadow-soft rounded tile">
                                <TileTitle actionsDiv={[<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "events"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("events") }} >
                        <IoFlash />  Instances
        </div>,<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "functions"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("functions") }} >
        <IoCodeWorkingOutline /> Functions
        </div>]}>
                                    <IoList /> Details
                                </TileTitle>
                                {tab === "events"?
                                    <div id="workflow-page-events" style={{ maxHeight: "512px", maxWidth:"255px", overflowY: "auto" }}>
                                        <div id="events-tile" className="tile-contents">
                                            <EventsList />
                                        </div>
                                    </div>:""
                                }
                                {tab === "functions" ?
                                     <div id="workflow-page-events" style={{ maxHeight: "512px", maxWidth:"255px", overflowY: "auto" }}>
                                     {
                                         workflowFuncErr !== "" ? 
                                         <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                         {workflowFuncErr}
                                     </div> 
                                     :
<div id="events-tile" className="tile-contents">
                                         <FuncComponent namespace={namespace} workflow={params.workflow} functions={functions}/>
                                     </div>
                                        }
                                     
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

function FuncComponent(props) {
    const {functions, namespace, workflow} = props

    return(
      <div>
              <ul style={{margin:"0px"}}>
                {functions !== null ?
                    <>
                        {functions.length > 0 ?
                            <>
                                {functions.map((obj) => {

let statusMessage = ""
                                    if(obj.conditions){
                                        for(var x=0; x < obj.conditions.length; x++) {
                                            statusMessage += `${obj.conditions[x].name}: ${obj.conditions[x].message}\n`
                                        }
                                    }

                                    return(
                                        <li key={obj.info.name} title={statusMessage}  className="event-list-item">
                                           <Link style={{textDecoration:"none", color:"#4a4e4e"}} to={`/n/${namespace}/w/${workflow}/functions/${obj.serviceName}`}>
                                                <div>
                                                    <span><CircleFill className={obj.status === "True" ? "success": "failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                    <span>
                                                        {obj.info.name !== "" ? obj.info.name : obj.serviceName}({obj.info.image})
                                                    </span>
                                                </div>
                                            </Link>
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
                    await handleError('fetch workflow instances', resp, 'listInstances')
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
                to={`/n/${namespace}/w/${workflowName}/variables`}>
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