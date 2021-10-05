import Breadcrumbs from '../breadcrumbs'
import { useContext, useEffect, useState, useRef } from "react"
import TileTitle from '../tile-title'
import { useHistory, useParams, useLocation } from 'react-router'
import LoadingWrapper from "../loading"
import { CopyToClipboard, isBodyStreamError } from "../../util-funcs"
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { IoList, IoCopy, IoEyeOffSharp, IoEyeSharp } from 'react-icons/io5'
import MainContext from '../../context'


import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
export default function Revision() {
    const { sse } = useContext(MainContext)
    let { revision, namespace, service, workflow } = useParams()
    const q = useQuery()
    const params = useParams()

    const [podSource, setPodSource] = useState(null)
    const [revisionSource, setRevisionSource] = useState(null)
    const history = useHistory()
    const [revisionDetails, setRevisionDetails] = useState(null)
    const [queryString, setQueryString] = useState("")

    const [pods, setPods] = useState([])
    const podsRef = useRef(pods)
    const [tab, setTab] = useState("")
    const [err, setErr] = useState("")

    if (q.get("rev")) {
        revision = q.get("rev")
    }

    useEffect(()=>{
        if(q.toString() !== queryString && podSource !== null && revisionSource !== null){
            podSource.close()
            revisionSource.close()
            setPodSource(null)
            setRevisionSource(null)
        } else {
            setQueryString(q.toString())
        }
    },[q, queryString])

    // set revision soruce
    useEffect(() => {
        if (revisionSource === null) {
            let service = params.service
            let revision = params.revision
            if (q.get("function")) {
                service = q.get("function")
            }
            if (q.get("rev")) {
                revision = q.get('rev')
            }
            let x = `/functions/${service}/revisions/${revision}`
            if (namespace && params[0] === undefined) {
                x = `/functions/namespaces/${namespace}/function/${service}/revisions/${revision}`
            } else if (params[0] !== undefined && q.get("rev") !== null) {
                if (q.get("function") === null || q.get('rev') === null) {
                    return
                }
                //TODO: Change to workflow watcher
                x = `/functions/namespaces/${namespace}/tree/${params[0]}?op=function-revision&svn=${q.get("function")}&rev=${q.get("rev")}`
                // x = `/watch/functions/${service}/revisions/${revision}`
            }
            if (service === undefined || revision === undefined) {
                return
            }
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // Check if body stream error
                if (isBodyStreamError(e)) {
                    // No need to comment body stream errors
                    console.log("Function Revision lost due to bodystream error")
                    eventConnection.close()
                    return
                }
                
                if (e.type === "error") {
                    // check for connection lost error
                    try {
                        let json = JSON.parse(e.data)
                        if (json["Code"]) {
                            setErr(`Error revision listen: ${json["Message"]}`)
                            eventConnection.close()
                            return
                        }
                    } catch (er) {
                        // TODO: We most likely dont need to worry about this error, but should keep an eye on it
                        console.log("Function Revision SSE connection closed with unhandled error: " + er)
                    }
                }
                if (e.status === 403) {
                    setErr("Permission denied.")
                }
            }

            async function getData(e) {
                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                if (json.event === "ADDED" || json.event === "MODIFIED") {
                    setRevisionDetails(json.revision)
                }
                if (json.event === "DELETED") {
                    history.goBack()
                }
            }

            eventConnection.onmessage = e => getData(e)
            setRevisionSource(eventConnection)
        }
    }, [q, params, revisionSource, history, namespace, revision, service, sse, workflow])

    // set the pod source
    useEffect(() => {


        if (podSource === null) {
            // setup
            let service = params.service
            let revision = params.revision
            if (q.get("function")) {
                service = q.get("function")
            }
            if (q.get("rev")) {
                revision = q.get('rev')
            }
            let x = `/functions/${service}/revisions/${revision}/pods`
            if (namespace && params[0] === undefined) {
                x = `/functions/namespaces/${namespace}/function/${service}/revisions/${revision}/pods`
            } else if (params[0] !== undefined && q.get("rev") !== null) {
                if (q.get("function") === null || q.get('rev') === null) {
                    return
                }
                x = `/functions/namespaces/${namespace}/tree/${params[0]}?op=pods&svn=${q.get("function")}&rev=${q.get("rev")}`
            }
            if (service === undefined || revision === undefined) {
                return
            }
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // Check if body stream error
                if (isBodyStreamError(e)) {
                    // No need to comment body stream errors
                    console.log("Pod connection lost due to bodystream error")
                    eventConnection.close()
                    return
                }

                if (e.type === "error") {
                    // check for connection lost error
                    try {
                        let json = JSON.parse(e.data)
                        if (json["Code"]) {
                            setErr(`Error pods listen: ${json["Message"]}`)
                            eventConnection.close()
                            return
                        }
                    } catch (er) {
                        // TODO: We most likely dont need to worry about this error, but should keep an eye on it
                        console.log("Pod SSE connection closed with unhandled error: " + er)
                    }
                }
                if (e.status === 403) {
                    setErr("Permission denied.")
                }
            }

            async function getData(e) {
                let podz = podsRef.current

                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)

                switch (json.event) {
                    case "DELETED":
                        for (var i = 0; i < pods.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                podz.splice(i, 1)
                                podsRef.current = pods
                                break
                            }
                        }
                        break
                    case "MODIFIED":
                        for (i = 0; i < podz.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                podz[i] = json.pod
                                podsRef.current = podz
                                break
                            }
                        }
                        break
                    default:
                        let found = false
                        for (i = 0; i < podz.length; i++) {
                            if (podz[i].name === json.pod.name) {
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            podz.push(json.pod)
                            podsRef.current = pods
                        }
                }
                // update tab to display first pod
                if (pods[0]) {
                    if (tab === "" && pods[0].status === "Running") {
                        setTab(pods[0].name)
                    }
                }

                setPods(JSON.parse(JSON.stringify(podsRef.current)))
            }

            eventConnection.onmessage = e => getData(e)
            setPodSource(eventConnection)
        }
    }, [q, params, podSource, namespace, pods, revision, service, sse, tab, workflow])

    // unmount the sources
    useEffect(() => {
        return () => {
            if (podSource !== null) {
                podSource.close()
            }
            if (revisionSource !== null) {
                revisionSource.close()
            }
        }
    }, [podSource, revisionSource])

    let podSubTabs = []
    for (let i = 0; i < pods.length; i++) {
        podSubTabs.push(
            <div style={{ display: "flex", alignItems: "center", fontSize: "10pt", color: tab === pods[i].name ? "#2396d8" : "" }} className={"workflow-expand "} onClick={() => { setTab(pods[i].name) }} >
                {pods[i].name.replace(`${revision}-deployment-`, "")}
            </div>
        )
    }

    if (service === undefined && q.get("rev") === null) {
        return ""
    }
    return (
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs appendQueryParams={true} />
                </div>
            </div>
            <div className="shadow-soft rounded tile" style={{ flex: 1, overflow: "hidden", maxHeight: "300px" }}>
                <TileTitle name={`Details for ${revision}`}>
                    <IoList />
                </TileTitle>
                <LoadingWrapper isLoading={false} text={"Loading Revision Details"}>
                    {err !== "" ?
                        <>
                            <div style={{ fontSize: "12px", paddingTop: "8px", paddingBottom: "5px", marginRight: "20px", color: "red" }}>
                                {err}
                            </div>
                        </>
                        :
                        <>
                            {revisionDetails !== null ? <DetailedRevision serviceName={revision} pods={pods} revision={revisionDetails} /> : ""}
                        </>}
                </LoadingWrapper>
            </div>
            {pods.length > 0 ?
                <div className="shadow-soft rounded tile" style={{ flex: 1, overflow: "hidden" }}>
                    <TileTitle actionsDiv={podSubTabs} name={`Pods`}>
                        <IoList />
                    </TileTitle>
                    <LoadingWrapper isLoading={false} text={"Loading Pod Logs"}>
                        <PodLogs sse={sse} pod={tab} service={service} namespace={namespace} revision={revision} />
                    </LoadingWrapper>
                </div> : ""}
        </div>
    )
}

function DetailedRevision(props) {
    const { revision, pods, serviceName } = props
    let size = ""
    if (revision.size === 0) {
        size = "small"
    } else if (revision.size === 1) {
        size = "medium"
    } else if (revision.size === 2) {
        size = "large"
    }
    return (
        <div style={{ fontSize: "11pt" }}>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Created:</b></span>  {dayjs.unix(revision.created).format('h:mm a, DD-MM-YYYY')}</p>
                    {size !== "" ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Size:</b></span> {size}</p> : ""}
                    {revision.generation ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Generation:</b></span> {revision.generation}</p> : ""}
                    {revision.cmd !== "" ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Cmd:</b></span> {revision.cmd}</p> : ""}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                    {revision.image !== "" ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Image:</b></span> {revision.image}</p> : ""}
                    {revision.minScale ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Scale:</b></span> {revision.minScale}</p> : ""}
                    {revision.actualReplicas ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Actual Replicas:</b></span> {revision.actualReplicas}</p> : ""}
                    {revision.desiredReplicas ? <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Desired Replicas:</b></span> {revision.desiredReplicas}</p> : ""}
                </div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Conditions:</b></span></p>
                    <ul style={{ margin: "5px", fontSize: "10pt" }}>
                        {revision.conditions.map((obj) => {
                            let circleFill = "success"
                            if (obj.status === "False") {
                                circleFill = "failed"
                            }
                            if (obj.status === "Unknown") {
                                circleFill = "crashed"
                            }
                            return (
                                <li key={obj.name} style={{ lineHeight: "24px" }}>
                                    <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                    <span style={{ fontWeight: 500 }}>{obj.name}</span> {obj.reason !== "" ? <i style={{ fontSize: "12px" }}>({obj.reason})</i> : ""} <span style={{ fontSize: '12px' }}>{obj.message}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                {pods.length > 0 ?
                    <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ margin: "5px" }}><span style={{ width: "150px", display: "inline-block" }}><b>Pods:</b></span></p>
                        <ul style={{ margin: "5px", fontSize: "10pt" }}>
                            {pods.map((obj) => {
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
                                return (
                                    <li key={obj.name} style={{ lineHeight: "24px" }}>
                                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                        <span style={{ fontWeight: 500 }}>{obj.name.replace(`${serviceName}-deployment-`, "")}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div> : ""}
            </div>
        </div>
    )
}

function PodLogs(props) {
    const { service, namespace, revision, pod, sse } = props

    const [logSource, setLogSource] = useState(null)
    const [tail, setTail] = useState(true)
    const tailRef = useRef(tail)
    const [logs, setLogs] = useState("")
    const logsRef = useRef(logs)
    const [err, setErr] = useState("")

    // set new log watcher on pod
    useEffect(() => {
        if (pod !== "") {
            let x = `/functions/logs/pod/${pod}`
            if (namespace) {
                x = `/functions/logs/pod/${pod}`
            }
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // Check if body stream error
                if (isBodyStreamError(e)) {
                    // No need to comment body stream errors
                    console.log("Pod Log connection lost due to bodystream error")
                    eventConnection.close()
                    return
                }

                if (e.status === 403) {
                    setErr("Permission denied.")
                    return
                }
                if (e.data) {
                    try {
                        let json = JSON.parse(e.data)
                        if (json.Message.includes("could not get logs")) {
                            setErr(`Container still starting: ${json.Message}`)
                        }
                    } catch (er) {
                        // TODO: We most likely dont need to worry about this error, but should keep an eye on it
                        console.log("Pod Log SSE connection closed with unhandled error: " + er)
                    }
                }

                document.getElementById("pod-logs").innerHTML = ""
                setLogs("")
            }

            async function getRealtimeData(e) {
                let log = logsRef.current
                if (e.data === "") {
                    return
                }

                let json = JSON.parse(e.data)
                log += "\n" + json.data
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
    }, [pod, namespace, revision, service, sse])

    // clean up log watch
    // unmount the sources
    useEffect(() => {
        return () => {
            if (logSource !== null) {
                logSource.close()
                setLogs("")
                if (document.getElementById("pod-logs")) {
                    document.getElementById("pod-logs").innerHTML = ""
                }
            }
        }
    }, [logSource])

    return (
        <div id="logs-toggle" className="editor-wrapper" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative", boxShadow: "none" }}>
            <div style={{ width: "100%", height: "100%" }}>
                <div style={{ background: "#2a2a2a", height: "100%", top: "28px", marginTop: "28px" }}>
                    <div id="logs" style={{ position: "absolute", right: "0", left: "0", borderRadius: "8px", overflow: tail ? "hidden" : "auto", textAlign: "left", height: "auto", color: "white", fontSize: "12pt", padding: "5px", background: "#2a2a2a", top: "28px", bottom: "30px", paddingBottom: "10px" }}>
                        <pre id="pod-logs" style={{ marginTop: "-14px" }} >
                            {err !== "" ? err : ""}

                        </pre>
                    </div>
                </div>
            </div>
            <div id="test" className="editor-footer">
                <div className="editor-footer-buffer" />
                <div className="editor-footer-actions">
                    <div className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => {
                        if (!tail) {
                            document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                        }
                        tailRef.current = !tail
                        setTail(!tail)
                    }}>
                        <span style={{}} >{tail ? "Stop Watching" : "Watch"}</span>
                        {tail ?
                            <IoEyeOffSharp style={{ marginLeft: "5px" }} />
                            :
                            <IoEyeSharp style={{ marginLeft: "5px" }} />
                        }
                    </div>
                    <div className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => {
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