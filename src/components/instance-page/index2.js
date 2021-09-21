import React, { useContext, useEffect, useState, useCallback } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { useHistory, useParams } from 'react-router-dom'
import Logs from './logs'
import Diagram from '../workflow-page/diagram'

import MainContext from '../../context'
import { IoCode, IoEaselOutline, IoTerminal, IoHardwareChipSharp } from 'react-icons/io5'
import ButtonWithDropDownCmp from './actions-btn'
import { Workflow, checkStartType, WorkflowStateMillisecondMetrics, WorkflowExecute } from '../workflows-page/api'
import { sendNotification } from '../notifications'
import LoadingWrapper from '../loading'
import InstanceInputOutput from './instance-input-output'

export default function Instance() {
    const {fetch, namespace, handleError, extraLinks, sse, checkPerm, permissions} = useContext(MainContext)
    const [init, setInit] = useState(null)
    const [instanceDetails, setInstanceDetails] = useState({})
    const [wf, setWf] = useState("")
    const [tab, setTab] = useState("logs")
    const [workflowErr, setWorkflowErr] = useState("")
    const [detailsErr, setDetailsErr] = useState("")
    const [,setActionErr] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [detailsLoad, setDetailsLoad] = useState(true)
    const [metricsLoading, setMetricsLoading] = useState(true)
    const [stateMetrics, setStateMetrics] = useState([])
    const [iid, setIid] = useState("")
    const [startType, setStartType] = useState(true)
    const [timer, setTimer] = useState(null)

    const [instanceSource, setInstanceSource] = useState(null)

    const params = useParams()
    const history = useHistory()

    // fetch the workflow for that instance
    const fetchWorkflow = useCallback((id)=>{
        async function fetchDetails() {
            setInit(true)
            if(!init) {
                try {
                    let wf = await Workflow(fetch, params.namespace, id, handleError)
                    let start = await checkStartType(wf, setWorkflowErr)
                    setWf(wf)
                    setStartType(start)
                } catch(e) {
                    setWorkflowErr(`${e.message}`)
                }
            }
        }
        if(params.namespace !== "" && wf === "") {
            fetchDetails()
        }
    },[fetch, handleError, init,  params.namespace, wf])

    // get metrics for diagram
    useEffect(()=>{
        async function getStateMetrics(){
            // todo
            try {
                let json = await WorkflowStateMillisecondMetrics(fetch, namespace, instanceDetails.as, handleError)
            } catch(e) {
                sendNotification("Error: ", e.message, 0)
            }
        }
        if(metricsLoading && instanceDetails.as !== undefined) {
            getStateMetrics().finally(()=>{setMetricsLoading(false)})
        }
    },[fetch, handleError, instanceDetails.as, metricsLoading, namespace])

    useEffect(()=>{
        if(instanceSource === null && params.id !== iid) {
            let x = `/stream/flow/namespaces/${namespace}/instances/${params.id}`

            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                if(e.status === 403) {
                    setDetailsErr("You are unable to stream the instance")
                    return
                }
            }

            async function getData(e) {
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
               
                json["instance"]["flow"] = json.flow
                setInstanceDetails(json.instance)
                fetchWorkflow(json.instance.as)
                setDetailsLoad(false)
            }

            eventConnection.onmessage = e => getData(e)
            setInstanceSource(eventConnection)
            setIid(params.id)
        }
    },[instanceSource, iid, fetchWorkflow, namespace, params.id, sse])

    useEffect(()=>{
        return ()=>{
            if(instanceSource !== null) {
                instanceSource.close()
            }
        }
    },[instanceSource])
    useEffect(()=>{
        if(instanceDetails && Object.keys(instanceDetails).length > 0 && isLoading) {
            setIsLoading(false)
        }
    },[instanceDetails, isLoading])

    for(var i=0; i < extraLinks.length; i++) {
        let x = extraLinks[i]
        let path = x.path
        for (var j=0; j < x.replace.length; j++) {
            if(x.replace[j].key === "namespace") {
                path = path.replaceAll(x.replace[j].val, params.namespace)
            }
            if(x.replace[j].key === "workflow") {
                path = path.replaceAll(x.replace[j].val, params.workflow)
            }
            if(x.replace[j].key === "instance") {

                path = path.replaceAll(x.replace[j].val, params.instance)
            }
        }
        x.path = path
        extraLinks[i] = x
    }

    let listElements = [
        {
            name: "View Workflow",
            link: true,
            path: `/n/${params.namespace}/explorer/${instanceDetails.as}`
        }, ...extraLinks
    ]

    if (instanceDetails.status === "failed" || instanceDetails.status === "cancelled" || instanceDetails.status === "crashed" || instanceDetails.status === "complete") {
        if(startType && checkPerm(permissions, "executeWorkflow")) {
            listElements.push(
                {
                    name: "Rerun Workflow",
                    func: async ()=>{
                        try {
                            let id = await WorkflowExecute(fetch, namespace, instanceDetails.as, handleError, "{}")
                            if(document.getElementById("logs-test")){
                                document.getElementById("logs-test").innerHTML = ""
                            }
                            instanceSource.close()
                            history.push(`/n/${namespace}/i/${id}`)
                        } catch(e) {
                            setActionErr(e.message)
                        }
                    }
                }
            )
        }
    }

    return(
        <LoadingWrapper isLoading={isLoading} text={`Loading Instance Details`}>
               <div className="container" style={{  padding: "10px" }}>
                    <div className="flex-row" style={{ maxHeight: "64px" }}>
                        <div style={{ flex: "auto", display: "flex" }}>
                                <div style={{ flex: "auto" }}>
                                    <Breadcrumbs instanceId={params.id} />
                                </div>
                        </div>
                        <div id="instance-status-tile" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span id="instance-status-text" style={{ marginRight: "10px" }}>
                                    Instance status: 
                                </span>
                                <span style={{display:"flex", alignItems:"center"}} title={instanceDetails.status}>
                                    <CircleFill  style={{ fontSize: "12pt" }} className={instanceDetails.status}/>
                                </span>
                            </div>
                        </div>
                        <ButtonWithDropDownCmp height={"-80px"} data={listElements}/>
                    </div>
               </div>
               {instanceDetails.errMessage !== "" && instanceDetails.errMessage !== undefined ?
                    <div className="container">
                        <div className="shadow-soft rounded tile">
                            <div style={{fontSize:"12pt", background:"#f3b2b2", borderRadius:"4px", border:"1px solid red", padding:"5px"}}>
                                Workflow Error: {instanceDetails.errCode} - {instanceDetails.errMessage} 
                            </div>
                        </div>
                    </div>
                  :""
               }
               <div className="container" style={{ flexGrow: "1", flexDirection: "row" }}>
                    <div className="container" style={{ flexGrow: "inherit" }}>
                        <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                            <TileTitle actionsDiv={[
                                <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "logs"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("logs") }} >
                                    <IoTerminal />  Logs
                                </div>,
                                <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "input"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("input") }} >
                                    <IoCode /> Input
                                </div>,
                                <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "output"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("output") }} >
                                    <IoCode /> Output
                                </div>
                            ]}>
                                <IoHardwareChipSharp /> Instance Details
                            </TileTitle>
                            {tab === "input" ?
                                <InstanceInputOutput id="input" status={instanceDetails.status}  fetch={fetch} namespace={namespace} instance={params.id} handleError={handleError} /> : ""}
                            {tab === "output" ? 
                                <InstanceInputOutput id="output" status={instanceDetails.status} fetch={fetch} namespace={namespace} instance={params.id} handleError={handleError} /> : "" }
                            {tab === "logs" ?
                                <Logs instanceId={params.id} status={instanceDetails.status} />: ""}
                        </div>
                        <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit", flex: 1 }}>
                            <TileTitle name="Graph">
                                <IoEaselOutline />
                            </TileTitle>
                            {
                                detailsErr !== "" || workflowErr !== "" ? 
                                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                    {detailsErr !== "" ? detailsErr : workflowErr}
                                </div>
                            :
                                <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                                    <div style={{ flex: "auto" }}>
                                            <>
                                            {instanceDetails.flow && wf ? 
                                                <Diagram metrics={stateMetrics} flow={instanceDetails.flow} value={wf} status={instanceDetails.status} />   
                                                :
                                                <div style={{ marginTop:"28px", fontSize:"12pt"}}>
                                                    Unable to fetch workflow have you renamed the workflow recently?
                                                </div>
                                            }
                                            </>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
        </LoadingWrapper>
    )
}