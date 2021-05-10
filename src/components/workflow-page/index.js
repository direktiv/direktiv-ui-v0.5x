import React, { useContext, useState, useCallback, useEffect } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'
import YAML from 'js-yaml'


import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { IoEaselOutline, IoList, IoPencil, IoPieChartSharp, IoSave, IoPlaySharp, IoChevronForwardOutline, IoCheckmarkSharp, IoToggleOutline, IoToggle } from 'react-icons/io5'

import {sendNotification} from '../notifications'
import PieChart from '../charts/pie'
import { useHistory, useParams } from 'react-router'
import {Link} from "react-router-dom"
import MainContext from '../../context'
import Sankey from './sankey'
import * as dayjs from "dayjs"
import {NoResults} from '../../util-funcs'


async function checkStartType(wf) {
    // check for event start type
    try {
        let y = YAML.load(wf)
        if(y.start) {
            if(y.start.type !== "default") {
                // this file should not be able to be executed.
                return false
            }
        }
        return true
    } catch(e) {
        sendNotification("Unable to parse workflow", e.message, 0)
        // return true if an error happens as the yaml is not runnable in the first place
        return true
    }
}

export default function WorkflowPage() {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const [viewSankey, setViewSankey] = useState("")

    const [showLogEvent, setShowLogEvent] = useState(false)
    const [logEvent, setLogEvent] = useState("hello-world")

    const [workflowValue, setWorkflowValue] = useState("")
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const [executable, setExecutable] = useState(true)
    const [workflowInfo, setWorkflowInfo] = useState({revision: 0, active: true, fetching: true})
    const history = useHistory()
    const params = useParams()

    function setFetching(fetchState) {
        setWorkflowInfo((wfI) => {
            wfI.fetching = fetchState;
            return {...wfI}
        })
    }

    const fetchWorkflow = useCallback(()=>{
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
                        return {...wfI}
                    })
                    setLogEvent(json.logToEvents)
                } else {
                // 400 should have json response
                await handleError('fetch workflow', resp)
                }
            } catch(e) {
                sendNotification("Failed to fetch workflow", e.message, 0)
            }
        }
        fetchWf().finally(()=>{setFetching(false)})
    },[namespace, fetch, params.workflow, handleError])

    const updateWorkflow = useCallback(()=>{
        if (workflowInfo.fetching){
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
                        return {...wfI}
                    })
                    setWorkflowValueOld(workflowValue)
                    let exec = await checkStartType(workflowValue)
                    setExecutable(exec)

                    history.replace(`${json.id}`)
                } else {
                    await handleError('update workflow', resp)
                }
            } catch(e) {
                sendNotification("Failed to update workflow", e.message, 0)
            }
            return
        }
        updateWf().finally(()=>{setFetching(false)})
    },[namespace, workflowValue, fetch, history, workflowInfo.fetching, params.workflow, handleError])

const updateLogEvent = useCallback(()=>{
    if (workflowInfo.fetching){
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
                await handleError('post log event', resp)
            }
        } catch(e) {
            sendNotification("Failed to set log event", e.message, 0)
        }
        return
    }
    return postLogEvent().finally(()=>{setFetching(false)})
},[namespace, workflowValueOld, fetch,  workflowInfo.fetching, logEvent, params.workflow, handleError])

    useEffect(()=>{
        if (namespace !== "") {
            fetchWorkflow()
        }
    },[fetchWorkflow, namespace])

    let saveButton = (
        <div className={workflowValueOld !== workflowValue ? "editor-footer-button": "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { updateWorkflow() }}>
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
        <div className={workflowInfo.active && executable ? "editor-footer-button": "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => {
            if (workflowInfo.active && executable) {
                executeWorkflow()
            }
            }}>
            <span style={{}} >Execute</span>
            <IoPlaySharp style={{ marginLeft: "5px" }} />
        </div>
    );

    async function executeWorkflow() {
        try{
            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                method: "POST",
                body: jsonInput
            })
            if(resp.ok) {
                let json = await resp.json()    
                history.push(`/i/${json.instanceId}`)
            } else {
                await handleError('execute workflow', resp)
            }
        } catch(e) {
            sendNotification("Failed to execute workflow", e.message, 0)
        }
    }

    async function toggleWorkflow() {
        try{
            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/toggle`, {
                method: "PUT",
            })
            if(resp.ok) {
                // fetch workflow
                // fetchWorkflow()
                let json = await resp.json()
                setWorkflowInfo((wfI) => {
                    wfI.active = json.active;
                    return {...wfI}
                })
            } else {
                await handleError('toggle workflow', resp)
            }
        } catch(e) {
            sendNotification("Failed to disable workflow", e.message, 0)
        }
    }

    const Actions = [logButton, saveButton]

    return(
        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows", "Example"]} />
                </div>
                <WorkflowActions viewSankey={viewSankey} setViewSankey={setViewSankey} fetchWorkflow={fetchWorkflow} active={workflowInfo.active} toggleWorkflow={toggleWorkflow}/>
            </div>
            <div id="workflows-page">
                <div className="container" style={{ flexGrow: "2" }}>
                    <div className="container" style={{ flexDirection: "row" }}>
                        <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "2", minWidth: "350px" }}>
                            <TileTitle name={`Editor ${workflowValueOld !== workflowValue ? "*" : ""}`} >
                                <IoPencil />
                            </TileTitle>
                            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top:"-28px", position: "relative"}}>
                                <div style={{width: "100%", height: "100%", position: "relative"}}>
                                    <div style={{height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                                        <Editor value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow} showFooter={true} actions={Actions}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1", minWidth: "350px" }}>
                            <TileTitle name="Execute Workflow">
                                <IoChevronForwardOutline />
                            </TileTitle>
                            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top:"-28px", position: "relative"}}>
                                <div style={{width: "100%", height: "100%", position: "relative"}}>
                                    <div style={{height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                                        <Editor value={jsonInput} setValue={setJsonInput} showFooter={true} actions={[executeButton]}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {viewSankey ?
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Sankey">
                            <IoEaselOutline />
                        </TileTitle>
                        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                        <div style={{width: "100%", position: "absolute", display: "flex", flexDirection: "row-reverse"}}>
                                <div onClick={()=>setViewSankey(false)} title="Swap to Graph View" className="circle button toggled-switch shadow-soft-inverse" style={{ marginLeft: "10px", position: "relative", top: "30px", zIndex: "5" }}>
                                    <span style={{ flex: "auto" }}>
                                        <IoToggle style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                                    </span>
                                </div>
                            </div>
                            <div style={{ flex: "auto" }}>
                                <Sankey/>
                            </div>
                        </div>
                    </div>
                    :
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Graph">
                            <IoEaselOutline />
                        </TileTitle>
                        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                            <div style={{width: "100%", position: "absolute", display: "flex", flexDirection: "row-reverse"}}>
                                <div onClick={()=>setViewSankey(true)} title="Swap to Sankey View" className="circle button" style={{ marginLeft: "10px", position: "relative", top: "30px", zIndex: "5" }}>
                                    <span style={{ flex: "auto" }}>
                                        <IoToggleOutline style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                    </span>
                                </div>
                            </div>
                            <div style={{ flex: "auto" }}>
                                {/* THIS CHECK IS HERE SO THE GRAPH LOADS PROPERLY */}
                                    {workflowValueOld !== "" ?
                                        <Diagram value={workflowValueOld}/>   
                                        :
                                        ""
                                    }
                            </div>
                        </div>
                    </div>
                    }
                </div>
                <div className="container graph-contents" style={{ width: "300px" }}>
                    <div className="item-1 shadow-soft rounded tile" style={{ height: "280px" }}>
                        <TileTitle name="Executed Workflows">
                            <IoPieChartSharp />
                        </TileTitle>
                        <div id="pie-dish" className="tile-contents">
                            <PieComponent/>
                        </div>
                    </div>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Instances">
                            <IoList />
                        </TileTitle>
                        <div style={{ maxHeight: "450px", overflowY: "auto"}}>
                            <div id="events-tile" className="tile-contents">
                                <EventsList/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>:""}
        </>
    )
}

function PieComponent() {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const params = useParams()
    const [metrics, setMetrics] = useState(null)

    useEffect(()=>{
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
                    await handleError('fetch metrics', resp)
                }
            } catch(e) {
                sendNotification(`Failed to fetch metrics for workflow: ${e.message}`, 0)
            }
        }
        if(metrics === null) {
            fetchMet()
        }
    },[fetch, namespace, params.workflow, metrics, handleError])

    if (metrics === null) {
        return ""
    }
    
    return(
        <PieChart lineWidth={40} data={metrics} />
    )
}

function EventsList(props) {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const params = useParams()
    const [instances, setInstances] = useState(null)

    useEffect(()=>{
        async function fetchd() {
            try{
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/instances/`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if(json.workflowInstances){
                        setInstances(json.workflowInstances)
                    } else {
                        setInstances([])                        
                    }
                } else {
                    await handleError('fetch workflow instances', resp)
                }
            }catch(e){
                sendNotification("Unable to fetch workflow instances", e.message, 0)
            }
        }
        if(instances === null){
            fetchd()
        }
    },[fetch, namespace, params.workflow, instances, handleError])    

    return(
        <div>
            <ul style={{ margin: "0px" }}>
                {instances !== null ?
                <>
                {instances.length > 0 ?
                <>
                {instances.map((obj)=>{
                    return(
                        <Link key={obj.id} to={`/i/${obj.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                            <li style={{ cursor: "pointer" }} className="event-list-item">
                                <div>
                                    <span><CircleFill className={obj.status} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                    <span style={{ fontSize: "8pt", textAlign: "left", marginRight: "10px" }}>
                                        {dayjs.unix(obj.beginTime.seconds).fromNow()}
                                    </span>
                                    <span>
                                        {obj.id}
                                    </span>
                                </div>
                            </li>
                        </Link>
                    )
                })}
                </>
                : <NoResults/>}
</>:""}
            </ul>
        </div>
    )
}

function WorkflowActions(props) {
    const {active, toggleWorkflow} = props

    return(
        <div style={{display: "flex", flexDirection: "row-reverse", alignItems:"center", marginRight:"12px"}}>
            <div onClick={()=>toggleWorkflow()} title={active ? "Disable":"Enable"} className="circle button" style={{  position: "relative", zIndex: "5" }}>
           
                    {
                        active ?
                        <span style={{ flex: "auto"}}>
                        <IoToggle style={{ fontSize: "12pt", marginBottom: "6px", fill:"green" }} />
                        </span>
                        :
                        <span style={{ flex: "auto"}}>
                        <IoToggleOutline className={"toggled-switch"} style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                </span>

                    }
            </div>
        </div>
  
    )
}