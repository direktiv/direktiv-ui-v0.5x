import { useCallback, useEffect, useContext, useState } from "react"
import MainContext from "../../context"
import * as dayjs from "dayjs"
import { sendNotification } from "../notifications"
import { IoCopy } from "react-icons/io5"
import { CopyToClipboard } from "../../util"
import { useParams } from "react-router"
import { useRef } from "react"

export default function Logs(props) {
    const {instanceId, status} = props

    // const params = useParams()
    const {fetch} = useContext(MainContext)

    // const [logs, setLogs] = useState([])

    const statusRef = useRef()
    const timerRef = useRef()
    const offsetRef = useRef(0)
    const limitRef = useRef(300)
    const scrollRef = useRef(false)
    // const logsRef = useRef([])

    
    
    const [logs, setLogs] = useState([])
    // const [logsOffset, setLogsOffset] = useState(0)
    // const [timer, setTimer] = useState(null)

    // const [scrolled, setScrolled] = useState(false)
    // const [init, setInit] = useState(false)
    // const [limit, setLimit] = useState(300)

    const fetchLogs = useCallback(()=> {
        async function getLogs() {
            try {
                let resp = await fetch(`/instances/${instanceId}/logs?offset=${offsetRef.current}&limit=${limitRef.current}`, {
                    method: "GET"
                })
                if(!resp.ok) {
                    let text = await resp.text()
                    throw (new Error(text))
                } else {
                    let json = await resp.json()
                    
                    if (json.workflowInstanceLogs && json.workflowInstanceLogs.length > 0) {
                        offsetRef.current = offsetRef.current + json.workflowInstanceLogs.length
                        // let arr = [...logsRef, ...json.workflowInstanceLogs]
                        setLogs((arr)=>{
                            return [...arr, ...json.workflowInstanceLogs]
                        })
                    } 
                }

                if (!scrollRef.current) {
                    if (document.getElementById('logs')) {
                        document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                    }
                }
            } catch(e) {
                sendNotification("Failed to fetch logs", e.message, 0)
            }
        }
        getLogs()
    },[instanceId,fetch])

    useEffect(()=>{
        statusRef.current = status
        if(status !== undefined){
            if(status === "pending") {
                let timer = setInterval(async ()=>{
                    fetchLogs()
                    if(statusRef.current !== "pending") {
                            clearInterval(timer)
                    }
                }, 2000)
                timerRef.current = timer
            }
        }
        fetchLogs()
    },[status, fetchLogs])

    // Handle rerunning to set back to default values
    useEffect(()=>{
        // component will unmount
        return function cleanup() {
            console.log(instanceId, "new test")
            clearInterval(timerRef.current)
            offsetRef.current = 0
            setLogs([])
        }
    },[instanceId])

    console.log(logs, "VALUE OF LOGS")

    function checkIfScrollAtBottom(event) {
        if (event.target.offsetHeight + event.target.scrollTop === event.target.scrollHeight) {
            return true
        }
    }

    let checkScrollDirection = useCallback((event) => {
        if (checkScrollDirectionIsUp(event)) {
            // setScrolled(true)
            scrollRef.current = true
            console.log('true up')
        } else if (checkIfScrollAtBottom(event)) {
            console.log('scroll bot')
            // setScrolled(false)
            scrollRef.current = false
        }
    }, [])

    function checkScrollDirectionIsUp(event) {
        if (event.wheelDelta) {
            return event.wheelDelta > 0;
        }
        return event.deltaY < 0;
    }


    useEffect(() => {
        let scrollableElement = document.getElementById('logs')
        scrollableElement.addEventListener('wheel', checkScrollDirection);
        return function cleanup() {
            scrollableElement.removeEventListener("wheel", checkScrollDirection)
        }
    }, [checkScrollDirection])

    return(
        <div className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
            <div style={{width: "100%", height: "100%", position: "relative"}}>
                <div id="logs" style={{borderRadius:"8px", overflow:"auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0, paddingBottom:"40px" }}>
                    <pre>
                        {logs.map((obj, i) => {
                                let time = dayjs.unix(`${obj.timestamp.seconds}.${obj.timestamp.nanos}`).format("h:mm:ss.SSS")
                                console.log(time)
                                return (
                                    <div style={{fontFamily:"monospace"}} key={obj.timestamp.seconds +i}>
                                        <span style={{ color: "#b5b5b5" }}>
                                            [{time}]
                                            </span>
                                        {" "}
                                        {obj.message}
                                        { obj.context && obj.context.constructor === Object && Object.keys(obj.context).length > 0 ?
                                            <span style={{ color: "#b5b5b5" }}>
                                                {"  ( "}
                                                <span style={{ color: "#b5b5b5" }}>
                                                    {Object.keys(obj.context).map((k) => {
                                                        return (
                                                            `${k}=${obj.context[k]} `
                                                        )
                                                    })}
                                                </span>
                                                {")"}
                                            </span>
                                            :
                                            <></>
                                        }
                                    </div>
                                )
                            })}
                    </pre>
                </div>
            </div>
            <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                        <div>
                        <div  className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { 
                            let stringLogs = ""
                            for(let i=0; i < logs.length; i++) {
                                let time = dayjs.unix(logs[i].timestamp.seconds).format("h:mm:ss")
                                stringLogs += `[${time}] ${logs[i].message} `
                                if (logs[i].context && logs[i].context.constructor === Object && Object.keys(logs[i].context).length > 0) {
                                    stringLogs += `(${Object.keys(logs[i].context).map((k)=>`${k}=${logs[i].context[k]} `)})`
                                }
                                stringLogs += "\n"
                            }
                            CopyToClipboard(stringLogs)
                         }}>
                            <span style={{}} >Copy</span>
                            <IoCopy style={{ marginLeft: "5px" }} />
                        </div>
                        </div>
                    </div>
                </div>
        </div>
    )
}

