import React, { useCallback, useContext, useEffect, useRef, useState} from 'react'
import {SSE} from 'sse.js'
import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import Slider, { SliderTooltip, Handle } from 'rc-slider';

import { IoAdd, IoList, IoTrash} from 'react-icons/io5'
import { ConfirmButton } from '../confirm-button'

import Breadcrumbs from '../breadcrumbs'
import MainContext from '../../context'
import LoadingWrapper from "../loading"
import { Link,  useParams } from 'react-router-dom'



export default function Functions() {
    const {fetch,  handleError, sse} = useContext(MainContext)
    const params = useParams()
    const [isLoading, setIsLoading] = useState(true)

    const [config, setConfig] = useState(null)

    const [functions, setFunctions] = useState(null)
    const functionsRef = useRef(functions ? functions: [])
    
    const [evSource, setEvSource] = useState(null)
    const [fetchServiceErr, setFetchServiceErr] = useState("")
  

    useEffect(()=>{
        if (evSource === null && functions !== null) {
            let x = "/watch/functions/?scope=global"
            let body = {
                scope: "global"
            }
            if(params.namespace) {
                body.scope = "namespace"
                x = `/watch/namespaces/${params.namespace}/functions/`
                body["namespace"] = params.namespace
            }
            
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                console.log('error on sse', e)
            }
            
            async function getRealtimeData(e) {
                let funcs = functionsRef.current
                // process the data here
                // pass it to state to be rendered
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                switch (json.event) {
                case "DELETED":
                    for (var i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            funcs.splice(i, 1)
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                case "MODIFIED":
                    for(var i=0; i < funcs.length; i++) {
                        if (funcs[i].serviceName === json.function.serviceName) {
                            funcs[i] = json.function
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                default:
                    let found = false
                    for(var i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            found = true 
                            break
                        }
                    }
                    if (!found){
                        funcs.push(json.function)
                        functionsRef.current = funcs
                    }
                }
                setFunctions(JSON.parse(JSON.stringify(functionsRef.current)))
            }
            
            eventConnection.onmessage = e => getRealtimeData(e);
            setEvSource(eventConnection)
        }
    },[sse, functions, evSource, functionsRef.current])

    useEffect(()=>{
        return ()=>{
            if(evSource !== null) {
                evSource.close()
            }
        }
    },[evSource])

    const fetchServices = useCallback(()=>{
        async function fetchFunctions() {
            let x = "/functions/"
            let body = {
                scope: "global"
            }
            if(params.namespace) {
                body.scope = "namespace"
                x = `/namespaces/${params.namespace}/functions/`
                body["namespace"] = params.namespace
            }
            try {
                let resp = await fetch(x, {
                    method: "POST",
                    body: JSON.stringify(body)
                })
                if(resp.ok) {
                    let arr = await resp.json()
                    setConfig(arr.config)
                    if (arr.services.length > 0) {
                        functionsRef.current = arr.services
                        setFunctions(arr.services)

                    } else {
                        functionsRef.current = []
                        setFunctions([])
                    }
                } else {
                    await handleError('fetch services', resp, 'listServices')
                }
            } catch(e) {
                setFetchServiceErr(`Error fetching services: ${e.message}`)
            }
        }
        return fetchFunctions()
    },[fetch, handleError, params.namespace])

    // useEffect(()=>{
    //         let interval = setInterval(()=>{
    //             fetchServices()
    //         }, 3000)
    //         return () => {
    //             clearInterval(interval)
    //         }
    // },[ functions])

    useEffect(()=>{
        if (config === null && functions === null) {
            fetchServices().finally(()=> {setIsLoading(false)}) 
        }
    },[fetchServices])


    return(
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto"}}>
                <div className="shadow-soft rounded tile" style={{ flex: 1, overflowX:"auto"}}>
                    <TileTitle name="Knative function services">
                        <IoList />
                    </TileTitle>
                    <LoadingWrapper isLoading={isLoading} text={"Loading Functions List"}>
                    <div style={{maxHeight:"785px", overflow:"visible"}}>
                   
                        <>
                        {functions !== null ?
                            <>
                                {functions.length > 0 ?
                                    <div >
                                        {functions.map((obj) => {
                                            return (
                                                <KnativeFunc key={obj.serviceName} conditions={obj.conditions} fetch={fetch} minScale={obj.info.minScale} serviceName={obj.serviceName} namespace={params.namespace} size={obj.info.size} workflow={obj.info.workflow} image={obj.info.image} cmd={obj.info.cmd} name={obj.info.name} status={obj.status} statusMessage={obj.statusMessage}/>
                                            )
                                        })}
                                    </div>
                                    : <div style={{ fontSize: "12pt" }}>List is empty.</div>}
                            </> : ""}
                        </>
                    </div>
                    </LoadingWrapper>
                </div>
                    
                    {!isLoading ?<div className="shadow-soft rounded tile" style={{ maxWidth: "300px", height:"fit-content", flex: 1 }}>
                        <TileTitle name="Create knative service">
                            <IoAdd />
                        </TileTitle>
                        <div style={{maxHeight:"785px", overflow:"auto"}}>
                            {config !== null ?
                            <CreateKnativeFunc config={config} handleError={handleError}  namespace={params.namespace} fetch={fetch}/>
                                : 
                                ""}
                            </div>
                    </div>: ""}
            </div>
        </div>
        </>
    )
}

function CreateKnativeFunc(props) {
    const {fetch, namespace, fetchServices, handleError, config} = props
    const [err, setErr] = useState("")
    const [name, setName] = useState("")
    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleScale = props => {
        const {value, dragging, index, ...restProps} = props;

        if (!dragging) {
            setScale(value)
        }

        return(
            <SliderTooltip
            prefixCls="rc-slider-tooltip"
            overlay={`${value}`}
            visible={dragging}
            placement="top"
            key={index}
          >
            <Handle value={value} {...restProps} />
          </SliderTooltip>
        )
    }

    const handleSize = props => {
        const {value, dragging, index, ...restProps} = props;

        if (!dragging) {
            setSize(value)
        }

        return(
            <SliderTooltip
            prefixCls="rc-slider-tooltip"
            overlay={`${value}`}
            visible={dragging}
            placement="top"
            key={index}
          >
            <Handle value={value} {...restProps} />
          </SliderTooltip>
        )
    }

    const createService = async () => {
        try {
            let body = {
                name: name,
                image: image,
                minScale: parseInt(scale),
                size: parseInt(size),
                cmd: cmd,
            }
            let x = "/functions/new"
            if (namespace) {
                x = `/namespaces/${namespace}/functions/new`
                body["namespace"] = namespace
            }
            let resp = await fetch(x, {
                method: "POST",
                body: JSON.stringify(body)
            })
            if (resp.ok) {
                // fetch functions
                setErr("")
                setName("")
                setImage("")
                setScale(0)
                setSize(0)
                setCmd("")
                // await fetchServices()
            } else {
                await handleError('create service', resp, 'createService')

            }
        } catch(e) {
            setErr(`Error creating service: ${e.message}`)
        }
    }
    return(
        <LoadingWrapper isLoading={isLoading} text={"Creating Service"}>
        <div style={{ fontSize: "12pt"}}>
            <div style={{display:"flex",  flexDirection:"column" }}>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"right", minWidth:"60px"}}>
                        Name:
                    </div>
                    <div style={{flex: "auto"}}>
                        <input style={{width: "180px"}} value={name}  onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter service name" />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"right", minWidth:"60px"}}>
                        Image:
                    </div>
                    <div style={{flex: "auto"}}>
                        <input style={{width: "180px"}} value={image}  onChange={(e) => setImage(e.target.value)} type="text" placeholder="Enter image used by service" />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"right", minWidth:"60px", paddingRight:"14px"}}>
                        Scale:
                    </div>
                    <div style={{display: "flex", flex: "auto", justifyContent: "center", paddingRight: "15px"}}>
                        <Slider style={{width:"160px"}} handle={handleScale} min={0} max={config.maxscale}   defaultValue={scale} />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"right", minWidth:"60px", paddingRight:"14px"}}>
                        Size:
                    </div>
                    <div style={{display: "flex", flex: "auto", justifyContent: "center", paddingRight: "15px"}}>
                        <Slider style={{width: "160px"}} handle={handleSize} min={0} max={2} defaultValue={size} marks={{ 0: "small", 1: "medium", 2:"large"}} step={null}/>
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"right", minWidth:"60px"}}>
                        Cmd:
                    </div>
                    <div style={{flex: "auto"}}>
                        <input style={{width: "180px"}} value={cmd}  onChange={(e) => setCmd(e.target.value)} type="text" placeholder="Enter the CMD for the service" />
                    </div>
                </div>
            </div>
            <div style={{marginTop:"10px", marginBottom:"10px", color:"#b5b5b5", borderBottom: "1px solid #b5b5b5"}}/>

        {err !== ""?
       <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
       {err}
   </div>
    :
    ""    
    }
        <div title="Create Service" style={{ textAlign: "right", padding:"5px" }}>
            <input type="submit" value="Create Service" onClick={() => {
                setIsLoading(true)
                createService().finally(()=> {setIsLoading(false)})
            }} />
        </div>
    </div>
    </LoadingWrapper>
    )
}

function KnativeFunc(props) {

    const {fetch, name, fetchServices,  conditions, serviceName, namespace, image, status, statusMessage} = props

    const deleteService = async () => {
        try {
            let resp = await fetch(`/functions/${serviceName}`, {
                method:"DELETE"
            })
            if (resp.ok) {
                // fetchServices()
            } else {
                console.log(resp, "todo handle delete service resp")
            }
        } catch(e) {
            console.log(e, "handle delete service")
        }
    }

    let circleFill = "success"
    if (status === "False") {
        circleFill = "failed"
    }
    if (status === "Unknown"){
        circleFill = "crashed"
    }

    return(
        
        <Link key={serviceName}  to={namespace !== undefined ? `/${namespace}/functions/${name}`: `/functions/global/${name}`} className="neumorph-hover" style={{marginBottom: "10px", textDecoration:"none", color:"var(--font-dark)"}} >
            <div className="neumorph-hover">
            <div className="services-list-div">
                <div>
                    <div style={{display: "inline"}}>
                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                    </div>
                    <div style={{display: "inline"}}>
                        <b>{name}</b> <i style={{fontSize:"12px"}}>{image}</i>
                    </div>
                </div>
                <div style={{flex: "auto", textAlign: "right"}}>
                    <div className="buttons">
                        <div style={{position:"relative"}} title="Delete Service">
                            <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                                ev.preventDefault()
                                deleteService()
                            }} /> 
                        </div>
                    </div>
                </div>
            </div>
            <div style={{fontSize:'14px', display:"flex"}}>
            <div className="services-list-contents singular" style={{height:"auto",  overflow:"visible", width:"100%", paddingBottom:"10px"}}>
            <div className="service-list-item-panel" style={{fontSize:'14px'}}>
                    <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>

                        <ul style={{margin:"0px"}}>
                            {conditions ? <>
                            {conditions.map((obj)=>{
                                let circleFill = "success"
                                if (obj.status === "False") {
                                    circleFill = "failed"
                                }
                                if (obj.status === "Unknown"){
                                    circleFill = "crashed"
                                }
                                return(
                                    <li key={obj.name}>
                                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                        <span style={{fontWeight:500}}>{obj.name}</span> {obj.reason!==""?<i style={{fontSize:"12px"}}>({obj.reason})</i>:""} <span style={{fontSize:'12px'}}>{obj.message}</span>
                                    </li>
                                )
                            })}</>
                            :""}
                        </ul>
                        </div>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                        </div>
                    </div>
                    </div>
                    </div>
            </div>
            </div>

        </Link>
    )
}