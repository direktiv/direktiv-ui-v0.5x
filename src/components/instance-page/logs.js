import { useCallback, useEffect, useContext, useState } from "react"
import { useParams } from "react-router"
import MainContext from "../../context"
import * as dayjs from "dayjs"

export default function Logs() {
    const params = useParams()
    console.log(params)
    const {fetch} = useContext(MainContext)
    const [logs, setLogs] = useState([])
    const [logsOffset, setLogsOffset] = useState(0)

    // todo handle error here
    const [err, setErr] = useState("")
    const [scrolled, setScrolled] = useState(false)
    const [init, setInit] = useState(false)
    const [limit, setLimit] = useState(300)

    const clearError = () => {
        setErr("")
    }

    function checkIfScrollAtBottom(event) {
        if (event.target.offsetHeight + event.target.scrollTop === event.target.scrollHeight) {
            return true
        }
    }

    let checkScrollDirection = useCallback((event) => {
        if (checkScrollDirectionIsUp(event)) {
            setScrolled(true)
        } else if (checkIfScrollAtBottom(event)) {
            setScrolled(false)
        }
    }, [])

    function checkScrollDirectionIsUp(event) {
        if (event.wheelDelta) {
            return event.wheelDelta > 0;
        }
        return event.deltaY < 0;
    }


    let fetchLogs = useCallback(() => {
        async function fetchl() {
            try {
                let resp = await fetch(`/instances/${params[0]}/logs?offset=${logsOffset}&limit=${limit}`, {
                    method: "GET",
                })
                if (!resp.ok) {
                    let text = await resp.text()
                    throw (new Error(`Error fetching logs: ${text}`))
                } else {
                    let json = await resp.json()
                    if (json.workflowInstanceLogs && json.workflowInstanceLogs.length > 0) {
                        if (limit > 100) {
                            setLimit(100)
                        }

                        setLogsOffset(offset => {
                            offset += json.workflowInstanceLogs.length
                            return offset
                        })

                        setLogs([...logs, ...json.workflowInstanceLogs])
                    } else if (limit < 300){
                        setLimit((l) => {
                            if (l == 10) {
                                return l
                            }

                            l -= 10
                            if (l < 10) {
                                l = 10
                            }

                            return l
                        })
                    }

                    if (!scrolled) {
                        if (document.getElementById('logs')) {
                            document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight
                        }
                    }
                }
                setErr("")
            } catch (e) {
                console.log("e =", e)
                setErr(e.message)
            }
        }

        return fetchl()

    }, [params, fetch, scrolled, logs, logsOffset, limit])

    useEffect(() => {
        if (!init) {
            fetchLogs()
            setInit(true)
        } else {
            let timer = setInterval(fetchLogs, 2500)
            return function cleanup() {
                clearInterval(timer)
            }
        }

    }, [fetchLogs, init])

    useEffect(() => {
        let scrollableElement = document.getElementById('logs')
        scrollableElement.addEventListener('wheel', checkScrollDirection);
        return function cleanup() {
            scrollableElement.removeEventListener("wheel", checkScrollDirection)
        }
    }, [checkScrollDirection])


    return(
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
            <div style={{width: "100%", height: "100%", position: "relative"}}>
                <div style={{borderRadius:"8px", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                    <pre id="logs" >
                    {logs.map((obj, i) => {
                            let time = dayjs.unix(obj.timestamp.seconds).format("h:mm:ss")
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
        </div>
    )
}
