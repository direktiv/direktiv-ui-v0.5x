import { useEffect, useContext, useState } from "react"
import MainContext from "../../context"
import { IoCopy, IoEyeOffSharp, IoEyeSharp } from "react-icons/io5"
import { CopyToClipboard } from "../../util-funcs"
import { useRef } from "react"
import * as dayjs from "dayjs"


import AnsiUp from "ansi_up"

var ansi_up = new AnsiUp();
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

export default function NamespaceLogsComponent() {

    const {namespace, sse} = useContext(MainContext)

    const [logs, setLogs] = useState("")
    const logsRef = useRef(logs)

    const [err, setErr] = useState("")
    const [oldNamespace, setOldNamespace] = useState("")
    const [tail, setTail] = useState(true)

    const tailRef = useRef(true)


    const [namespaceLogSource, setNamespaceLogSource] = useState(null)

    useEffect(()=>{
        if(namespaceLogSource === null || oldNamespace !== namespace) {
            let uri = `/namespaces/${namespace}/logs`
            
            let eventConnection = sse(`${uri}`,{})
            eventConnection.onerror = (e) => {
                if(e.status === 403) {
                    setErr("You are unable to stream namespace logs")
                    return
                }
                if(document.getElementById("logs-test")){
                    document.getElementById("logs-test").innerHTML = ""
                }
                setLogs("")
            }

            async function getData(e) {
                let log = logsRef.current
                if(e.data === "") {
                    return
                }

                let json = JSON.parse(e.data)
            
                for(let i=0; i < json.edges.length; i++) {
                    log += `\u001b[38;5;248m[${dayjs.utc(json.edges[i].node.t).local().format("HH:mm:ss")}]\u001b[0m `
                    log += `${json.edges[i].node.msg}`
                    log += `\n`
                }

                let x = ansi_up.ansi_to_html(log)
                document.getElementById("logs-test").innerHTML += x
                setLogs((str) => {return str + log})
                if (tailRef.current) {
                    if (document.getElementById('logs')) {
                        document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                    }
                }
            }
            eventConnection.onmessage = e => getData(e)
            setNamespaceLogSource(eventConnection)
            setOldNamespace(namespace)
        }
    },[namespace, namespaceLogSource, sse])

    useEffect(()=>{
        return () => {
            if(namespaceLogSource !== null) {
                namespaceLogSource.close()
                setLogs("")
                if(document.getElementById("logs-test")){
                    document.getElementById("logs-test").innerHTML = ""
                }
            }
        }
    },[namespaceLogSource])

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