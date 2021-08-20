import Breadcrumbs from '../breadcrumbs'
import {useContext, useEffect, useState, useRef} from "react"
import TileTitle from '../tile-title'
import { useParams } from 'react-router'
import LoadingWrapper from "../loading"
import { CopyToClipboard } from "../../util-funcs"
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { IoList, IoCopy, IoEyeOffSharp, IoEyeSharp} from 'react-icons/io5'
import MainContext from '../../context'


import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function Revision() {
    const {sse} = useContext(MainContext)
    const {revision, namespace, service} = useParams()
    const [isLoading, setIsLoading] = useState(false)

    const [podSource, setPodSource] = useState(null)
    const [revisionSource, setRevisionSource] = useState(null)

    const [revisionDetails, setRevisionDetails] = useState(null)

    const [pods, setPods] = useState([])
    const podsRef = useRef(pods)
    const [tab, setTab] = useState("")

    // set revision soruce
    useEffect(()=>{
        if(revisionSource === null) {
            let x = `/watch/functions/${service}/revisions/${revision}`
            if (namespace) {
                x = `/watch/namespaces/${namespace}/functions/${service}/revisions/${revision}`
            }


            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                console.log("error on sse", e)
            }

            async function getData(e) {
                let json = JSON.parse(e.data)

                if (json.event === "ADDED") {
                    setRevisionDetails(json.revision)
                }
            }

            eventConnection.onmessage = e => getData(e)
            setRevisionSource(eventConnection)
        }
    },[revisionSource])

    // set the pod source
    useEffect(()=>{
 

        if(podSource === null) {
            // setup
            let x = `/watch/functions/${service}/revisions/${revision}/pods/`
            if (namespace) {
                x = `/watch/namespaces/${namespace}/functions/${service}/revisions/${revision}/pods/`
            }

            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                console.log("error on sse", e)
            }

            async function getData(e) {
                let pods = podsRef.current

                let json = JSON.parse(e.data)
                switch (json.event) {
                    default:
                        let found = false
                        for(var i=0; i < pods.length; i++) {
                            if(pods[i].name === json.pod.name) {
                                found = true 
                                break
                            }
                        }
                        if (!found){
                            pods.push(json.pod)
                            podsRef.current = pods
                        }
                }
                // update tab to display first pod
                if (tab === "") {
                    setTab(pods[i].name)
                }
                setPods(JSON.parse(JSON.stringify(podsRef.current)))
            }

            eventConnection.onmessage = e => getData(e)
            setPodSource(eventConnection)
        }
    },[podSource])

    // unmount the sources
    useEffect(()=>{
        return () => {
            if (podSource !== null) {
                podSource.close()
            }
            if(revisionSource !== null) {
                revisionSource.close()
            }
        }
    },[podSource, revisionSource])

    let podSubTabs = []
    for (let i=0; i < pods.length; i++) {
        podSubTabs.push(
            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === pods[i].name? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setTab(pods[i].name) }} >
                {pods[i].name.replace(`${revision}-deployment-`, "")}
            </div>
        )
    }

    console.log(revisionDetails, "REVISION")
    console.log(pods, "PODS")
    return(
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs />
                </div>
            </div>
            <div className="shadow-soft rounded tile" style={{ flex: 1, overflowX:"auto", maxHeight:"250px" }}>
                <TileTitle name={`Details for ${revision}`}>
                    <IoList />
                </TileTitle>
                <LoadingWrapper isLoading={isLoading} text={"Loading Revision Details"}>
                    { revisionDetails !== null ? <DetailedRevision serviceName={revision} pods={pods}  revision={revisionDetails} /> : "" }
                </LoadingWrapper>
            </div>
            <div className="shadow-soft rounded tile" style={{ flex: 1, overflow:"hidden" }}>
                <TileTitle actionsDiv={podSubTabs} name={`Pods`}>
                    <IoList />
                </TileTitle>
                <LoadingWrapper isLoading={isLoading} text={"Loading Pod Logs"}>
                    <PodLogs sse={sse} pod={tab} service={service} namespace={namespace} revision={revision} />
                </LoadingWrapper>
            </div>
        </div>
    )
}

function DetailedRevision(props) {
    const {revision, pods, serviceName} = props
    let size = ""
    if(revision.size === 0) {
        size = "small"
    } else if (revision.size === 1) {
        size = "medium"
    } else if (revision.size === 2) {
        size = "large"
    }
    console.log(size)
    return(
        <div style={{fontSize:"11pt"}}>
            <div style={{display:"flex", width:"100%"}}>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Created:</b></div>  {dayjs.unix(revision.created).format('h:mm a, DD-MM-YYYY')}</p>
                    {size !== "" ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Size:</b></div> {size}</p> : ""}
                    {revision.generation ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Generation:</b></div> {revision.generation}</p> : ""}
                    {revision.cmd !== "" ?  <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Cmd:</b></div> {revision.cmd}</p> : ""}
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    {revision.image !== "" ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Image:</b></div> {revision.image}</p> : ""}
                    {revision.minScale ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Scale:</b></div> {revision.minScale}</p> : ""}
                    {revision.actualReplicas ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Actual Replicas:</b></div> {revision.actualReplicas}</p> : ""}
                    {revision.desiredReplicas ? <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Desired Replicas:</b></div> {revision.desiredReplicas}</p> : ""}
                </div>
            </div>
            <div style={{display:"flex", width:"100%"}}>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Conditions:</b></div></p>
                    <ul style={{margin:"5px", fontSize:"10pt"}}>
                        {revision.conditions.map((obj)=>{
                            let circleFill = "success"
                            if (obj.status === "False") {
                                circleFill = "failed"
                            }
                            if (obj.status === "Unknown"){
                                circleFill = "crashed"
                            }
                            return(
                                <li style={{lineHeight:"24px"}}>
                                    <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                    <span style={{fontWeight:500}}>{obj.name}</span> {obj.reason!==""?<i style={{fontSize:"12px"}}>({obj.reason})</i>:""} <span style={{fontSize:'12px'}}>{obj.message}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p style={{margin:"5px"}}><div style={{width:"150px", display:"inline-block"}}><b>Pods:</b></div></p>
                    <ul style={{margin:"5px", fontSize:"10pt"}}>
                        {pods.map((obj)=>{
                            console.log(obj, "pod log")
                            let circleFill = "crashed"
                            if (obj.status === "Succeeded" || obj.status === "Running") {
                                circleFill = "success"
                            }
                            if (obj.status === "Failed") {
                                circleFill = "failed"
                            }
                            if (obj.status === "Pending") {
                                circleFill = "pending"
                            }
                            console.log(obj.name, `${serviceName}-deployment-`)
                            return(
                                <li style={{lineHeight:"24px"}}>
                                    <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                    <span style={{fontWeight:500}}>{obj.name.replace(`${serviceName}-deployment-`, "")}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}

function PodLogs(props) {
    const {service, namespace, revision, pod, sse} = props

    const [logSource, setLogSource] = useState(null)
    const [tail, setTail] = useState(true)
    const tailRef = useRef(tail)
    const [logs, setLogs] = useState("")
    const logsRef = useRef(logs)

    // set new log watcher on pod
    useEffect(()=>{
        if(pod !== "") {
            let x = `/watch/functions/${service}/revisions/${revision}/pods/${pod}/logs/`
            if (namespace) {
                x = `/watch/namespaces/${namespace}/functions/${service}/revisions/${revision}/pods/${pod}/logs/`
            }

            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                console.log('error on sse', e)
                document.getElementById("pod-logs").innerHTML = ""
                setLogs("")
            }

            async function getRealtimeData(e) {
                let log = logsRef.current
                log += "\n"+e.data
                document.getElementById("pod-logs").innerHTML += log
                setLogs(log)
                if (tailRef.current) {
                    if (document.getElementById('logs')) {
                        document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                    }
                }
            }

            eventConnection.onmessage = e => getRealtimeData(e)
            setLogSource(eventConnection)
        }
    },[pod])

    // clean up log watch
    // unmount the sources
    useEffect(()=>{
        return () => {
            if (logSource !== null) {
                logSource.close()
                setLogs("")
                if (document.getElementById("pod-logs")) {
                    document.getElementById("pod-logs").innerHTML = ""
                }
            }
        }
    },[logSource])

    return(
        <div id="logs-toggle" className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
            <div style={{width: "100%", height: "100%"}}>
                <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                    <div id="logs" style={{ position: "absolute", right:"0", left:"0", borderRadius:"8px", overflow: tail ? "hidden":"auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a",  top:"28px", bottom:"30px", paddingBottom:"10px" }}>
                        <pre id="pod-logs" style={{marginTop:"-14px"}} />
                    </div>
                </div>
            </div>
            <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                        <div  className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { 
                            if(!tail){
                                document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                            }
                            tailRef.current = !tail
                            setTail(!tail)
                        }}>
                            <span style={{}} >{tail ? "Stop Watching": "Watch"}</span>
                            {tail ? 
                                <IoEyeOffSharp style={{marginLeft:"5px"}}/>
                                :
                                <IoEyeSharp style={{marginLeft:"5px"}}/>
                            }
                        </div>
                        <div  className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { 
                            CopyToClipboard(logs)
                         }}>
                            <span style={{}} >Copy</span>
                            <IoCopy style={{ marginLeft: "5px" }} />
                        </div>
                </div>
            </div>
        </div>
    )
}