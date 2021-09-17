import { useCallback, useEffect, useContext, useState } from "react"
import MainContext from "../../context"
import { IoCopy, IoEyeOffSharp, IoEyeSharp } from "react-icons/io5"
import { CopyToClipboard } from "../../util-funcs"
import { useRef } from "react"
import * as dayjs from "dayjs"


import {NamespaceLogs} from '../../api'
import AnsiUp from "ansi_up"

var ansi_up = new AnsiUp();
// let json = {
//     "namespaceLogs": [
//       {
//         "timestamp": {
//           "seconds": 1621558291,
//           "nanos": 82464266
//         },
//         "message": "Beginning workflow triggered by API."
//       },
//       {
//         "timestamp": {
//           "seconds": 1621558291,
//           "nanos": 87198677
//         },
//         "message": "Running state logic -- helloworld:1 (noop)"
//       },
//       {
//         "timestamp": {
//           "seconds": 1621558291,
//           "nanos": 87209753
//         },
//         "message": "Transforming state data."
//       },
//       {
//         "timestamp": {
//           "seconds": 1621558291,
//           "nanos": 92903162
//         },
//         "message": "Workflow completed."
//       }
//     ],
//     "offset": 0,
//     "limit": 300
//   }
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

export default function NamespaceLogsComponent() {

    const {namespace, fetch, handleError} = useContext(MainContext)

    const timerRef = useRef(0)
    const offsetRef = useRef("")
    const limitRef = useRef(300)

    const [endCursor, setEndCursor] = useState("")
    const [logs, setLogs] = useState("")
    const [err, setErr] = useState("")
    const [tail, setTail] = useState(true)
    const tailRef = useRef(true)

    const fetchLogs = useCallback(()=>{
        async function getLogs() {
            try {
                let newLogs = ""
                let logs = await NamespaceLogs(fetch, namespace, handleError, offsetRef.current)
                if(logs.pageInfo.endCursor !== "") {
                    offsetRef.current = logs.pageInfo.endCursor
                }
                if(logs.edges && logs.edges.length > 0) {
                    for(let i=0; i < logs.edges.length; i++) {
                        let obj = logs.edges[i].node
                        console.log(obj, "OBJ")
                        newLogs += `\u001b[38;5;248m[${dayjs.utc(obj.t).local().format("HH:mm:ss.SSS")}]\u001b[0m `
                        newLogs += `${obj.msg}`
                        newLogs += `\n`
                    }
                    let x = ansi_up.ansi_to_html(newLogs)
                    document.getElementById("logs-test").innerHTML += x
                    setLogs((str) => {return str + newLogs})
                }
                if (tailRef.current) {
                    if (document.getElementById('logs')) {
                        document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                    }
                }
            } catch(e) {
                setErr(e.message)
            }
        }
        getLogs()
    },[fetch, handleError, namespace])

    useEffect(()=>{
        if(timerRef.current === 0 && namespace !== "" && namespace !== undefined && namespace !== null) {
            fetchLogs()
            let timer = setInterval(async ()=>{
                fetchLogs()
            }, 2000)
            timerRef.current = timer
        }
    },[namespace,fetchLogs])

    useEffect(()=>{
        return function cleanup() {
            clearInterval(timerRef.current)
            offsetRef.current = ""
            setLogs("")
            if(document.getElementById("logs-test")) {
                document.getElementById("logs-test").innerHTML = ""
            }
        }
    },[])

    // const fetchLogs = useCallback(()=>{
    //     async function getLogs() {
    //         try {
    //             let newLogs = ""
    //             let resp = await fetch(`/namespaces/${namespace}/logs?offset=${offsetRef.current}&limit=${limitRef.current}`, {
    //                 method: "GET"
    //             })
    //             if(!resp.ok) {
    //                     await handleError('fetch logs', resp, 'getNamespaceLogs')
    //             } else {
    //                 let json = await resp.json()
    //                 if (json.namespaceLogs && json.namespaceLogs.length > 0) {
                                
    //                         offsetRef.current = offsetRef.current + json.namespaceLogs.length
    
    //                         for(var i=0; i < json.namespaceLogs.length; i++) {
    //                             let obj = json.namespaceLogs[i]
    //                             newLogs += `\u001b[38;5;248m[${dayjs.unix(`${obj.timestamp.seconds}.${obj.timestamp.nanos}`).format("h:mm:ss.SSS")}]\u001b[0m `
    //                             newLogs += `${obj.message} `
    
    //                             if(obj.context && obj.context.constructor === Object && Object.keys(obj.context).length > 0){
    //                                 newLogs += `\u001b[38;5;248m(`
    //                                 newLogs += Object.keys(obj.context).map((k) => {
    //                                     return (
    //                                         `${k}=${obj.context[k]}`
    //                                     )
    //                                 })
    //                                 newLogs += `)\u001b[0m `
    //                             }
    //                             newLogs += `\n`
    //                         }
    //                         let x = ansi_up.ansi_to_html(newLogs)
    //                         document.getElementById("logs-test").innerHTML += x
    
    //                         // used for copying later
    //                         setLogs((str) => {return str + newLogs})
    //                     } 
    //                 }
    //             if (tailRef.current) {
    //                 if (document.getElementById('logs')) {
    //                     document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
    //                 }
    //             }
    //         } catch(e) {
    //             setErr(e.message)
    //         }
    //     }
    //     getLogs()
    // }, [fetch, handleError, namespace])

    // useEffect(()=>{
    //     if(timerRef.current === 0 && namespace !== "" && namespace !== undefined && namespace !== null) {
    //         fetchLogs()
    //         let timer = setInterval(async ()=>{
    //             fetchLogs()
    //         }, 2000)
    //         timerRef.current = timer
    //     }
    // },[namespace,fetchLogs])

    // useEffect(()=>{
    //     return function cleanup() {
    //         clearInterval(timerRef.current)
    //         offsetRef.current = 0
    //         setLogs("")
    //         if(document.getElementById("logs-test")) {
    //             document.getElementById("logs-test").innerHTML = ""
    //         }
    //     }
    // },[])


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