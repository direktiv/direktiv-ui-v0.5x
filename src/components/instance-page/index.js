import React, { useContext, useEffect, useState, useCallback } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { useHistory, useParams } from 'react-router-dom'
import Logs from './logs'
import InputOutput from './input-output'
import Diagram from '../workflow-page/diagram'

import MainContext from '../../context'
import { IoCode, IoEaselOutline, IoTerminal } from 'react-icons/io5'
import { sendNotification } from '../notifications'

export default function InstancePage() {
    const {fetch, namespace} = useContext(MainContext)
    console.log('hello')
    const [init, setInit] = useState(null)
    const [instanceDetails, setInstanceDetails] = useState({})
    const [wf, setWf] = useState("")

    const params = useParams()
    const history = useHistory()
    let instanceId = `${params.namespace}/${params.workflow}/${params.instance}`
   
    const fetchWf = useCallback(()=>{
        async function fetchWorkflow() {
            setInit(true)
            if(!init) {
                try {
                    let resp = await fetch(`/namespaces/${params.namespace}/workflows/${params.workflow}?name`, {
                        method: "get",
                    })
                    if (resp.ok) {
                        let json = await resp.json()
                        let wfn = atob(json.workflow)
                        setWf(wfn)
                    } else {
                        // 400 should have json response
                        if(resp.status === 400) {
                            let json = await resp.json()
                            throw new Error(json.Message)
                        } else {
                            throw new Error(`response code was ${resp.status}`)
                        }
                    }
                } catch(e) {
                    sendNotification("Failed to fetch workflow", e.message, 0)
                }
            }
        }
        if(namespace !== ""){
        fetchWorkflow()
        }
    },[init, fetch, params.namespace, params.workflow, namespace])

    useEffect(()=>{
        async function fetchInstanceDetails() {
            try{
                let resp = await fetch(`/instances/${instanceId}`, {
                    method: "GET",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setInstanceDetails(json)
                } else {
                        // 400 should have json response
                    if(resp.status === 400) {
                        let json = await resp.json()
                        throw new Error(json.Message)
                    } else {
                        throw new Error(`response code was ${resp.status}`)
                    }
                }
            } catch(e) {
                sendNotification("Fetch Instance details failed ", e.message, 0)
            }

        }
        let timer = setInterval(()=>{
            fetchInstanceDetails()
        }, 2000)
        if (instanceDetails.status !== "pending" && instanceDetails.status !== undefined) {
            clearInterval(timer)
        }
        fetchInstanceDetails()    
        fetchWf()

        return function cleanup() {
            clearInterval(timer)
        }
    },[instanceId, fetch, fetchWf, instanceDetails.status, params.instance])

    
    return(
        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto", display: "flex" }}>
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs instanceId={instanceId} />
                    </div>
                    <div id="" className="hover-gradient shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px"}}
                    onClick={async () => {
                        try{
                            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                                method: "POST",
                                body: atob(instanceDetails.input)
                            })
                            if(resp.ok) {
                                let json = await resp.json()    
                                sendNotification("Rerun", `Successfully executed ${params.workflow}`, 0)
                                history.push(`/i/${json.instanceId}`)
                            } else {
                         // 400 should have json response
                         if(resp.status === 400) {
                            let json = await resp.json()
                            throw new Error(json.Message)
                          } else {
                            throw new Error(`response code was ${resp.status}`)
                          }
                            }
                        } catch(e) {
                            sendNotification("Failed to execute workflow", e.message, 0)
                        }
                    }}>
                        <div style={{ alignItems: "center" }}>
                                Rerun Workflow
                        </div>
                    </div>
                    <div id="" className="hover-gradient shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px"}}
                    onClick={() => {
                        history.push(`/${params.namespace}/w/${params.workflow}`)
                    }}>
                        <div style={{ alignItems: "center" }}>
                                View Workflow
                        </div>
                    </div>
                    <div id="" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ marginRight: "10px" }}>
                                Instance status: 
                            </span>
                            <span style={{display:"flex", alignItems:"center"}} title={instanceDetails.status}>
                                <CircleFill  style={{ fontSize: "12pt" }} className={instanceDetails.status}/>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container" style={{ flexGrow: "1", flexDirection: "row" }}>
                <div className="container" style={{ flexGrow: "inherit" }}>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Logs">
                            <IoTerminal />
                        </TileTitle>
                        <Logs instanceId={instanceId} status={instanceDetails.status} />
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Graph">
                            <IoEaselOutline />
                        </TileTitle>
                        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                            <div style={{ flex: "auto" }}>
                                {instanceDetails.flow && wf ? 
                                    <Diagram flow={instanceDetails.flow} value={wf} status={instanceDetails.status} />   
                                    :
                                    <div style={{ marginTop:"28px", fontSize:"12pt"}}>
                                        Unable to fetch workflow have you renamed the workflow recently?
                                    </div>
                                }
                                </div>
                        </div>
                    </div>
                </div>
                <div className="container" style={{ flexGrow: "inherit", maxWidth: "400px" }}>
                     <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Input">
                            <IoCode />
                        </TileTitle>
                        <InputOutput data={instanceDetails.input} status={instanceDetails.status} />
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Output">
                            <IoCode />
                        </TileTitle>
                        <InputOutput data={instanceDetails.output} status={instanceDetails.status}/>
                    </div>
                </div>
            </div>
        </div>
        :
                            ""}
        </>
    )
}