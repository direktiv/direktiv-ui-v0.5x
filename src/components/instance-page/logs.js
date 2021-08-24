import { useCallback, useEffect, useContext, useState } from "react"
import MainContext from "../../context"
import * as dayjs from "dayjs"
import { IoCopy, IoEyeOffSharp, IoEyeSharp } from "react-icons/io5"
import { CopyToClipboard } from "../../util-funcs"
import { useRef } from "react"
import AnsiUp from "ansi_up"

var ansi_up = new AnsiUp();

export default function Logs(props) {
    const {instanceId, status} = props

    // const params = useParams()
    const {fetch, handleError, sse} = useContext(MainContext)

    // const [logs, setLogs] = useState([])

    const statusRef = useRef()
    const timerRef = useRef()
    const offsetRef = useRef(0)
    const limitRef = useRef(300)
    // const scrollRef = useRef(false)
    // const logsRef = useRef([])

    
    // const [logs, setLogs] = useState("")
    const [err, setErr] = useState("")
    const [tail, setTail] = useState(true)
    const tailRef = useRef(true)
    // const [logsOffset, setLogsOffset] = useState(0)
    // const [timer, setTimer] = useState(null)

    // const [scrolled, setScrolled] = useState(false)
    // const [init, setInit] = useState(false)
    // const [limit, setLimit] = useState(300)
    const [logs, setLogs] = useState("")
    const logsRef = useRef(logs)

    const [logSource, setLogSource] = useState(null)

    useEffect(()=>{
        if (logSource === null) {
            let x = `/watch/instance/${instanceId}`

                     
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                console.log('error on sse', e)
                document.getElementById("logs-test").innerHTML = ""
                setLogs("")
            }
            
            async function getData(e) {
                let log = logsRef.current
                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data) 
                if(json.exit === 0) {
                        eventConnection.close()
                    return
                }
                log += `\u001b[38;5;248m[${dayjs.unix(`${json.timestamp.seconds}.${json.timestamp.nanos}`).format("h:mm:ss.SSS")}]\u001b[0m `
                log += `${json.message} `
                if(json.context && json.context.constructor === Object && Object.keys(json.context).length > 0){
                    log += `\u001b[38;5;248m( `
                    log += Object.keys(json.context).map((k) => {
                        return (
                            `${k}=${json.context[k]} `
                        )
                    })
                    log += ` )\u001b[0m`
                }
                log += `\n`

                let x = ansi_up.ansi_to_html(log)
                document.getElementById("logs-test").innerHTML += x

                // used for copying later
                setLogs((str) => {return str + log})

                if (tailRef.current) {
                    if (document.getElementById('logs')) {
                        document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                    }
                }
            }
            eventConnection.onmessage = e => getData(e);
            setLogSource(eventConnection)
        }
    },[logSource])

    useEffect(()=>{
        return ()=>{
            if(logSource !== null) {
                logSource.close()
                setLogs("")
                if(document.getElementById("logs-test")){
                    document.getElementById("logs-test").innerHTML = ""
                }
            }
        }
    },[logSource])

    let checkScrollDirection = useCallback((event) => {
        if (checkScrollDirectionIsUp(event) && tail) {
            setTail(false)
            tailRef.current = false
        }   
    }, [tail])

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
        <div id="logs-toggle" className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
            <div style={{width: "100%", height: "100%"}}>
                <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                    <div id="logs" style={{ position: "absolute", right:"0", left:"0", borderRadius:"8px", overflow: tail ? "hidden":"auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a",  top:"28px", bottom:"30px", paddingBottom:"10px" }}>
                        <pre id="logs-test" />
                    </div>
                </div>
            </div>
            <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                    {err !== "" ?<div style={{ fontSize: "12px", paddingTop: "8px", paddingBottom: "5px", marginRight:"20px", color: "red" }}>
                        {err}
                        </div>:""}
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

