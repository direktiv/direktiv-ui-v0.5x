import { useContext, useRef, useEffect, useState } from "react"
import { IoCodeSlashOutline } from "react-icons/io5"
import MainContext from '../../context'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from "../tile-title"
import Editor from "../workflow-page/editor"

import * as dayjs from "dayjs"
import CircleFill from "react-bootstrap-icons/dist/icons/circle-fill"
import { Link } from "react-router-dom"
import { NamespaceBroadcastEvent } from "../../api"



function ShowError(msg, setErr) {
    setErr(msg)
    setTimeout(()=>{
        setErr("")
    },5000)
}


export function CloudEvents() {
    const {namespace,sse,handleError, fetch} = useContext(MainContext)

    const [err, setErr] = useState("")
    const [events, setEvents] = useState([])
    const [eventSource, setEventSource] = useState(null)

    useEffect(()=>{
        if (eventSource === null) {
            let x = `/namespaces/${namespace}/events`

            let eventConnection = sse(`${x}`,{})
            eventConnection.onerror = (e) => {
                if(e.status === 403) {
                    ShowError("Permission denied.", setErr)
                }
            }

            async function getData(e) {
                if (e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                console.log(json)
                setEvents(JSON.parse(JSON.stringify(json.edges)))
            }

            eventConnection.onmessage = e => getData(e)
            setEventSource(eventConnection)    
        }

    },[eventSource, namespace, sse])

    useEffect(()=>{
        return () => {
            if(eventSource !== null) {
                eventSource.close()
            }
        }
    },[eventSource])

    console.log(events)
    return(
        <>
            {namespace !== "" ?
                <div className="container" style={{ flex: "auto", padding: "10px" }}>
                    <div className="container">
                        <div style={{ flex: "auto" }}>
                            <Breadcrumbs elements={["Events"]} />
                        </div>
                    </div>
                    <div className="container" style={{ flexDirection: "row", flexWrap: "wrap"}}>
                        <div className="shadow-soft rounded tile" style={{ flex: 1,   marginBottom:"10px" }}>
                        {err !== "" ?                    
                            <div style={{position:"relative"}}>
                                <div style={{position: "absolute", fontSize:"12pt", background:"#ff8a80", padding:"10px", borderRadius:"10px", zIndex:100, width:"50%", left:"300px"}}>
                                    {err}
                                </div>
                            </div>
                        :
                            ""
                        }
                            <TileTitle name="Listeners">
                                <IoCodeSlashOutline />
                            </TileTitle>
                            {events.map((obj)=>{
                                return(
                                    <div className="neumorph-hover-event" style={{cursor:"default"}}>
                                       <div className="services-list-div-event" style={{ width: "100%" }}>
                                            <div>
                                                <div style={{ display: "inline" }}>
                                                    <CircleFill style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }}/>
                                                </div>
                                                <div style={{ display: "inline" }}>
                                                    <Link className="nav-link-event" to={`/n/${namespace}/explorer${obj.node.workflow}`}>{obj.node.workflow}</Link> <i style={{ fontSize: "12px" }}>{dayjs.utc(obj.node.updatedAt).local().fromNow()}</i>
                                                </div>
                                            </div>
                                            {obj.node.instance !== "" ? <div style={{ flex: "auto", textAlign: "right" }}>
                                                <div className="buttons" style={{ paddingRight: "25px" }}>
                                                    <Link className="nav-link-event" style={{textDecoration:"none",  zIndex:100}} to={`/n/${namespace}/i/${obj.node.instance}`}>{obj.node.instance.split("-")[0]}</Link>
                                                </div> 
                                            </div> : ""}
                                        </div>
                                        {obj.node.events.length === 0 ?
                                        ""
                                        :
                                        <div className="services-list-contents singular" style={{ height: "auto", overflow: "visible", width: "100%", paddingBottom: "10px" }}>
                                            <div className="service-list-item-panel" style={{ fontSize: '14px', width: "97%" }}>
                                                <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
                                                    <div style={{ flex: 1, textAlign: "left", padding: "10px", paddingTop: "0px", paddingBottom: "0px" }}>
                                                        <ul>
                                                            <li>
                                                                <CircleFill style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                                                <span style={{ fontWeight: 500 }}>Mode:</span> <span >{obj.node.mode}</span> 
                                                            </li>
                                                            {
                                                                obj.node.events.map((event)=>{
                                                                    return(
                                                                        <li key={event.type}>
                                                                            <CircleFill style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                                                            <span style={{ fontWeight: 500 }}>Type:</span> <span >{event.type}</span> 
                                                                            {Object.keys(event.filters).length > 0 ? <ul>
                                                                                <CircleFill style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                                                                <span style={{ fontWeight:500}}>Filters</span>
                                                                                {Object.keys(event.filters).map((filter)=>{
                                                                                    return (
                                                                                        <li key={filter}>
                                                                                            <CircleFill style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                                                                            <span style={{ fontWeight: 500 }}>{filter}:</span> <span >{event.filters[filter]}</span> 
                                                                                        </li>
                                                                                    )
                                                                                })}
                                                                        
                                                                            </ul>:""}
                                                                        </li>
                                                                    )
                                                                })
                                                            }

                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                        <div className="shadow-soft rounded tile" style={{ flex: 1, maxWidth:"400px", maxHeight:"400px",   marginBottom:"10px" }}>
                            <TileTitle name="Send Event">
                                <IoCodeSlashOutline />
                            </TileTitle>
                           <SendEvent setErr={setErr} handleError={handleError} namespace={namespace} fetch={fetch}/>
                        </div>
                    </div>
                </div>
                :
                ""
            }
        </>
    )
}

const sample = () => {
    return {
        type: "direktiv-event",
        specversion: "1.0",
        source: "com.direktiv.sample",
        data: {}
    }
}

export function SendEvent(props) {
    const {fetch, handleError, setErr, namespace} = props
    const [data, setData] = useState(JSON.stringify(sample(), null, 2))
    const dataRef = useRef(data)

    async function sendEvent() {
        try {
            await NamespaceBroadcastEvent(fetch, namespace, data, handleError)
        } catch(e) {
            ShowError(e.message, setErr)
        }
    }

    return(
        <>
            <div style={{flex: "1", marginBottom: "5px", justifyContent: "center", display: "flex"}}>
                <div  style={{maxHeight:"400px", height:"300px", width:"350px", margin:"0px", flex: 1 }}>
                    <Editor refValSet={dataRef} setValue={setData} value={data} showFooter={false} />
                </div>
            </div>
            <div className="divider-dark"/>
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Send Event" onClick={() => sendEvent()} />
            </div>
        </>
    )
}