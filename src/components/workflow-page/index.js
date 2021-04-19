import React, { useContext, useState, useCallback, useEffect } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'


import TileTitle from '../tile-title'
import PencilSquare from 'react-bootstrap-icons/dist/icons/pencil-square'
import PieChartFill from 'react-bootstrap-icons/dist/icons/pie-chart-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { FileTextFill, Clipboard, Save, ToggleOn, ToggleOff } from "react-bootstrap-icons"

import { IoEaselOutline, IoList, IoPencil, IoPieChartSharp, IoSave, IoSaveOutline, IoPlaySharp, IoChevronForwardOutline } from 'react-icons/io5'

import {sendNotification} from '../notifications/index.js'
import PieChart, {MockData, NuePieLegend} from '../charts/pie'
import { useHistory, useParams } from 'react-router'
import MainContext from '../../context'
import Sankey from './sankey'

export default function WorkflowPage() {
    const {fetch, namespace} = useContext(MainContext)
    const [viewSankey, setViewSankey] = useState("")

    const [workflowValue, setWorkflowValue] = useState("")
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const [workflowInfo, setWorkflowInfo] = useState({uid: "", revision: 0, active: true, fetching: true,})
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
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}?name`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let wf = atob(json.workflow)
                    setWorkflowValue(wf)
                    setWorkflowValueOld(wf)
                    setWorkflowInfo((wfI) => {
                        wfI.uid = json.uid;
                        wfI.active = json.active
                        return {...wfI}
                    })
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                sendNotification("Failed to fetch workflow", e, 0)
            }
        }
        fetchWf().finally(()=>{setFetching(false)})
    },[namespace])

    const updateWorkflow = useCallback(()=>{
        if (workflowInfo.fetching){
            return // TODO - User Feedback
        }
        setFetching(true)

        console.log("workflowValue =", workflowValue)

        async function updateWf() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/${workflowInfo.uid}`, {
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
                    history.replace(`${json.id}`)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                sendNotification("Failed to update workflow", e.message, 0)
            }
        }
        updateWf().finally(()=>{setFetching(false)})
    },[namespace, workflowValue])

    useEffect(()=>{
        fetchWorkflow()
    },[namespace])

    useEffect(()=>{
        console.log("Workflow page has mounted")
    },[])

    let saveBtn = (
        <div className={workflowValueOld !== workflowValue ? "save-button" : "save-button-disable"} onClick={() => {updateWorkflow()}} >
            <FileTextFill/>
            <span>Save</span>
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
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification("Failed to execute workflow", e.message, 0)
        }
    }

    async function toggleWorkflow() {
        try{
            let resp = await fetch(`/namespaces/${namespace}/workflows/${workflowInfo.uid}/toggle`, {
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
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification("Failed to disable workflow", e.message, 0)
        }
    }

    console.log(workflowInfo)

    return(
        <>
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
                        <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "2" }}>
                            <TileTitle name={`Editor ${workflowValueOld !== workflowValue ? "*" : ""}`} >
                                <IoPencil />
                            </TileTitle>
                            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top:"-28px", position: "relative"}}>
                                <div style={{width: "100%", height: "100%", position: "relative"}}>
                                    <div style={{height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                                        <div id="editor-actions">
                                            <div className={workflowValueOld !== workflowValue ? "button success editor-action-btn enable" : "button disabled"} onClick={() => {updateWorkflow()}}>
                                                <span className="editor-action-btn-label">
                                                    Save
                                                </span>
                                                <span className="editor-action-btn-icon">
                                                    <IoSave/>
                                                </span>
                                            </div>
                                        </div>
                                        <Editor value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1" }}>
                            <TileTitle name="Execute Workflow">
                                <IoChevronForwardOutline />
                            </TileTitle>
                            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top:"-28px", position: "relative"}}>
                                <div style={{width: "100%", height: "100%", position: "relative"}}>
                                    <div style={{height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                                        <div id="editor-actions">
                                            <div className={workflowInfo.active ? "button success editor-action-btn": "button disabled"} onClick={() => {executeWorkflow()}}>
                                                <span className="editor-action-btn-label" style={{color: "white"}}>
                                                    Execute
                                                </span>
                                                <span className="editor-action-btn-icon">
                                                    <IoPlaySharp/>
                                                </span>
                                            </div>
                                        </div>
                                        <Editor value={jsonInput} setValue={setJsonInput} />
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
                        <div className="tile-contents">
                            <PieComponent/>
                        </div>
                    </div>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Events">
                            <IoList />
                        </TileTitle>
                        <div style={{ maxHeight: "80%", overflowY: "auto"}}>
                            <div id="events-tile" className="tile-contents">
                                <EventsList />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

function PieComponent() {
    const {fetch, namespace} = useContext(MainContext)
    const params = useParams()
    const [metrics, setMetrics] = useState([])

    useEffect(()=>{
        async function fetchMet() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/metrics`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    console.log(json, json.totalInstancesRun - json.successfulExecutions)
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
                    throw new Error( await resp.text())
                }
            } catch(e) {
                sendNotification(`Failed to fetch metrics for workflow: ${e.message}`, 0)
            }
        }
        fetchMet()
    },[])

    return(
        <PieChart lineWidth={40} data={metrics} />
    )
}

function EventsList() {

    let lines = [
        "example message 1",
        "lorem ipsum",
        "nu fone hu dis"
    ];

    let listItems = [];
    for (let i = 0; i < lines.length; i++) {

        let colorClass = "failed";
        let z = i % 3;
        switch (z) {
            case 0:
                colorClass = "failed";
                break;
            case 1:
                colorClass = "pending";
                break;
            case 2:
                colorClass = "success";
                break;
        }

        listItems.push(
            <li className="event-list-item">
                <div>
                    <span><CircleFill className={colorClass} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                    <span style={{ fontSize: "8pt", textAlign: "left", marginRight: "10px" }}>
                        10m ago
                    </span>
                    <span>    
                        {lines[i]}
                    </span>
                </div>
            </li>
        )
    }

    return(
        <div>
            <ul style={{ margin: "0px" }}>
                {listItems}
            </ul>
        </div>
    )
}

function WorkflowActions(props) {
    const {active, toggleWorkflow, setViewSankey, viewSankey} = props

    const [show, setShow] = useState(false)

    return(
        <div id="workflow-actions" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", padding: "0" }}>
            <div class="dropdown">
                <button onClick={(e)=>{
                    // e.stopPropagation()
                    setShow(!show)
                    }} class="dropbtn">Actions</button>

                {
                    show ? <>
                        <div class="dropdown-content-connector"></div>
                        <div class="dropdown-content">
                            {active ? 
                            <a onClick={()=>{
                                toggleWorkflow()
                                setShow(!show)
                            }}>Disable</a>
                            :
                            <a onClick={()=>{
                                toggleWorkflow()
                                setShow(!show)
                            }}>Enable</a>
                            }
                            {viewSankey ?
                            <a onClick={()=>{
                                setViewSankey(!viewSankey)
                                setShow(!show)
                            }}>Show Diagram</a>
                            :
                            <a onClick={()=>{
                                setViewSankey(!viewSankey)
                                setShow(!show)
                            }}>Show Sankey</a>
                            }
                        </div>
                    </>
                :
                (<></>)
                }
            </div> 
        </div>
    )
}