import React, { useContext, useEffect, useState, useCallback } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import YAML from 'js-yaml'

import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { useHistory, useParams } from 'react-router-dom'
import Logs from './logs'
import InputOutput from './input-output'
import Diagram from '../workflow-page/diagram'
import Interactions from '../workflows-page/interactions'
import Modal from 'react-modal';

import MainContext from '../../context'
import { IoCode, IoEaselOutline, IoTerminal, IoHardwareChipSharp } from 'react-icons/io5'
import ButtonWithDropDownCmp from './actions-btn'


async function checkStartType(wf, setError) {
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
        setError(`Unable to parse workflow: ${e.message}`)
        // return true if an error happens as the yaml is not runnable in the first place
        return true
    }
}

export default function InstancePage() {
    const {fetch, namespace, handleError, checkPerm, permissions, instanceInteractions} = useContext(MainContext)
    const [init, setInit] = useState(null)
    const [instanceDetails, setInstanceDetails] = useState({})
    const [wf, setWf] = useState("")
    const [tab, setTab] = useState("logs")
    const [workflowErr, setWorkflowErr] = useState("")
    const [detailsErr, setDetailsErr] = useState("")
    const [, setActionErr] = useState("")
    
    // true starts with default false any other start type
    const [startType, setStartType] = useState(true)


    const params = useParams()
    const history = useHistory()

    const [modalOpen, setModalOpen] = useState(false)

    function toggleModal() {
        setModalOpen(!modalOpen)
    }

    function afterOpenModal(){
        console.log('modal open')
    }

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
                        let start = await checkStartType(wfn, setWorkflowErr)
                        setWf(wfn)
                        setStartType(start)
                    } else {
                        await handleError('fetch workflow', resp, 'getWorkflow')
                    }
                } catch(e) {
                    setWorkflowErr(`Failed to fetch workflow: ${e.message}`)
                }
            }
        }
        if(namespace !== ""){
        fetchWorkflow()
        }
    },[init, fetch, params.namespace, params.workflow, namespace, handleError])

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
                    await handleError('fetch instance details', resp, 'getInstance')
                }
            } catch(e) {
                setDetailsErr(`Fetch Instance details failed: ${e.message}`)
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
    },[instanceId, fetch, fetchWf, instanceDetails.status, params.instance, handleError])


    let listElements = [
        {
            name: "View Workflow",
            link: true,
            path: `/${params.namespace}/w/${params.workflow}`
        }
    ]
    if (instanceDetails.status === "failed" || instanceDetails.status === "cancelled" || instanceDetails.status === "crashed" || instanceDetails.status === "complete"){
        if(startType && checkPerm(permissions, "executeWorkflow")){
            listElements.push(
                {
                    name: "Rerun Workflow",
                    func: async ()=>{
                        try{
                            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                                method: "POST",
                                body: atob(instanceDetails.input)
                            })
                            if(resp.ok) {
                                if(document.getElementById("logs-test")){
                                    document.getElementById("logs-test").innerHTML = ""
                                }
                                let json = await resp.json()    
                                history.push(`/i/${json.instanceId}`)
                            } else {
                                await handleError('rerun workflow', resp, 'executeWorkflow')
                            }
                        } catch(e) {
                            setActionErr(`Unable to execute workflow: ${e.message}`)
                        }
                    }
                }
            )
          
        }
    } else {
        if(checkPerm(permissions, "cancelInstance")) {
            listElements.push(
              {
                  name: "Cancel Instance",
                  func: async ()=>{
                        try {
                            let resp = await fetch(`/instances/${instanceId}`, {
                                method: "DELETE"
                            })
                            if(!resp.ok) {
                                await handleError('cancel instance', resp, 'cancelInstance')
                            }
                        }  catch(e) {
                            setActionErr(`Instance cancelled error: ${e.message}`)
                        }
                  }
              }
            )
        }
    }
    return(
        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <Modal 
                isOpen={modalOpen}
                onAfterOpen={afterOpenModal}
                onRequestClose={toggleModal}
                contentLabel="API Interactions"
            >
                <Interactions interactions={instanceInteractions(params.namespace, params.workflow, params.instance)} type="Instance" />
            </Modal>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto", display: "flex" }}>
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs instanceId={instanceId} />
                    </div>
                    <>
                        {instanceDetails.status === "failed" || instanceDetails.status === "cancelled" || instanceDetails.status === "crashed" || instanceDetails.status === "complete" ? 
                            <>
                                {startType && checkPerm(permissions, "executeWorkflow") ?
                                ""
                               // <div id="" className="hover-gradient shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px"}}
                                    //     onClick={async () => {
                                    //     try{
                                    //         let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                                    //             method: "POST",
                                    //             body: atob(instanceDetails.input)
                                    //         })
                                    //         if(resp.ok) {
                                    //             if(document.getElementById("logs-test")){
                                    //                 document.getElementById("logs-test").innerHTML = ""
                                    //             }
                                    //             let json = await resp.json()    
                                    //             history.push(`/i/${json.instanceId}`)
                                    //         } else {
                                    //             await handleError('rerun workflow', resp, 'executeWorkflow')
                                    //         }
                                    //     } catch(e) {
                                    //         setActionErr(`Unable to execute workflow: ${e.message}`)
                                    //     }
                                    // }}>
                                    //     <div style={{ alignItems: "center" }}>
                                    //             Rerun Workflow
                                    //     </div>
                                    // </div>
                                    :
                                    ""
                                }
                            </> 
                            : 
                            <>
                                {/* {checkPerm(permissions, "cancelInstance") ?
                                    <div id="" className="hover-gradient shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px"}}
                                     onClick={async () => {
                                        try {
                                            let resp = await fetch(`/instances/${instanceId}`, {
                                                method: "DELETE"
                                            })
                                            if(!resp.ok) {
                                                await handleError('cancel instance', resp, 'cancelInstance')
                                            }
                                        }  catch(e) {
                                            setActionErr(`Instance cancelled error: ${e.message}`)
                                        }
                                    }}>
                                        <div style={{ alignItems: "center" }}>
                                                Cancel Execution
                                        </div>
                                    </div> 
                                    :
                                    ""
                                } */}
                            </>
                        }
                    </>
                    {/* <div id="" className="hover-gradient shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px"}}
                    onClick={() => {
                        history.push(`/${params.namespace}/w/${params.workflow}`)
                    }}>
                        <div style={{ alignItems: "center" }}>
                                View Workflow
                        </div>
                    </div> */}
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
                    <ButtonWithDropDownCmp data={listElements}/>
                    {/* <div onClick={() =>{toggleModal()}} title={"APIs"} className="shadow-soft rounded tile fit-content" style={{cursor:"pointer", zIndex: "5", maxHeight:"36px", display:"flex", alignItems:"center", height:"18px" }}>
                            <IoEllipsisVertical className={"toggled-switch"} style={{ fontSize: "11pt",  marginLeft: "0px" }} />
                    </div>  */}
                </div>
            </div>
            {instanceDetails.errorMessage !== "" && instanceDetails.errorMessage !== undefined ?
            <div className="container">
                <div className="shadow-soft rounded tile">
                    <div style={{fontSize:"12pt", background:"#f3b2b2", borderRadius:"4px", border:"1px solid red", padding:"5px"}}>
                        Workflow Error: {instanceDetails.errorCode} - {instanceDetails.errorMessage} 
                    </div>
                </div>
            </div>: ""}
            <div className="container" style={{ flexGrow: "1", flexDirection: "row" }}>
                <div className="container" style={{ flexGrow: "inherit" }}>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle actionsDiv={[<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "logs"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("logs") }} >
                        <IoTerminal />  Logs
        </div>,<div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "input"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("input") }} >
        <IoCode /> Input
        </div>, <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "output"? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab("output") }} >
        <IoCode /> Output
        </div>]}>
                            <IoHardwareChipSharp /> Instance Details
                        </TileTitle>
                        {tab === "input" ?
                        <InputOutput id="input" data={instanceDetails.input} status={instanceDetails.status} /> :""}
                        {tab === "output" ? 
                        <InputOutput id="output" data={instanceDetails.output} status={instanceDetails.status}/> :""}
                        {tab === "logs" ?
                        <Logs instanceId={instanceId} status={instanceDetails.status} />: ""}
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
                                    <Diagram flow={instanceDetails.flow} value={wf} status={instanceDetails.status} />   
                                    :
                                    <div style={{ marginTop:"28px", fontSize:"12pt"}}>
                                        Unable to fetch workflow have you renamed the workflow recently?
                                    </div>
                                }
                                </>
                                </div>

                        </div>}
                    </div>
                </div>
                {/* <div className="container" style={{ flexGrow: "inherit", maxWidth: "400px" }}>
                     <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Input">
                            <IoCode />
                        </TileTitle>
                        {
                                detailsErr !== "" ? 
                                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                    {detailsErr}
                                </div>
                                :
                        <InputOutput id="input" data={instanceDetails.input} status={instanceDetails.status} />
}
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Output">
                            <IoCode />
                        </TileTitle>
                        {
                                detailsErr !== "" ? 
                                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                    {detailsErr}
                                </div>
                                :
                        <InputOutput id="output" data={instanceDetails.output} status={instanceDetails.status}/>
                        }
                        </div>
                </div> */}
            </div>
        </div>
        :
                            ""}
        </>
    )
}