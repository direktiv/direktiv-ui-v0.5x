import React, { useContext, useEffect, useState, useCallback } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'
import Braces from 'react-bootstrap-icons/dist/icons/braces'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { Link, useParams } from 'react-router-dom'
import Logs from './logs'
import InputOutput from './input-output'
import Diagram from '../workflow-page/diagram'

import MainContext from '../../context'
import { IoCode, IoEaselOutline, IoTerminal } from 'react-icons/io5'
import { sendNotification } from '../notifications'

export default function InstancePage() {
    const {fetch} = useContext(MainContext)
    
    const [instanceDetails, setInstanceDetails] = useState({})
    const [wf, setWf] = useState("")

    const params = useParams()
    let instanceId = `${params.namespace}/${params.workflow}/${params.instance}`
   
    const fetchWf = useCallback(()=>{
        async function fetchWorkflow() {
            try {
                let resp = await fetch(`/namespaces/${params.namespace}/workflows/${params.workflow}?name`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let wfn = atob(json.workflow)
                    setWf(wfn)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                sendNotification("Failed to fetch workflow", e.message, 0)
            }
        }
        fetchWorkflow()
    },[])

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
                    throw new Error(await resp.text())
                }
            } catch(e) {
                console.log(e, 'err test')
            }

        }
        let timer = setInterval(()=>{
            fetchInstanceDetails()
        }, 2000)
        if (instanceDetails.status === "complete" || instanceDetails.status === "cancelled") {
            clearInterval(timer)
        }
        fetchInstanceDetails()    
        fetchWf()

        return function cleanup() {
            clearInterval(timer)
        }
    },[instanceId])

    console.log(instanceDetails.status)
    
    return(
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto", display: "flex" }}>
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs instanceId={instanceId} />
                    </div>
                    <div id="" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px" }}>
                        <div style={{ alignItems: "center" }}>
                            <Link className="dashboard-btn" to={`/${params.namespace}/w/${params.workflow}`}>
                                View Workflow
                            </Link>
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
                        <Logs instanceId={instanceId} />
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
                                    ""
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
                        <InputOutput data={instanceDetails.input} />
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Output">
                            <IoCode />
                        </TileTitle>
                        <InputOutput data={instanceDetails.output} />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}