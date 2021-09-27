import {useState, useEffect, useContext, useCallback, useRef} from "react"
import Slider, { SliderTooltip, Handle } from 'rc-slider';
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import 'rc-slider/assets/index.css';
import { ConfirmButton } from '../confirm-button'
import {Link, useHistory, useParams, useLocation} from "react-router-dom"
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import { IoAdd, IoClipboardSharp, IoList, IoTrash} from 'react-icons/io5'
import MainContext from "../../context";
import LoadingWrapper from "../loading"


import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import { sendNotification } from "../notifications";
import {NamespaceFunction, NamespaceUpdateFunction, NamespaceUpdateTrafficFunction, NamespaceDeleteFunctionRevision} from '../../api';
import {GlobalFunction, GlobalUpdateFunction, GlobalUpdateTrafficFunction, GlobalDeleteFunctionRevision} from "../functions/api"
import { WorkflowFunction } from "../workflows-page/api";

function useQuery() {
    return new URLSearchParams(useLocation().search);
  }
  
dayjs.extend(relativeTime);

export default function Services() {
    const {fetch, handleError, sse} = useContext(MainContext)
    // const params = useParams()
    const q = useQuery()
    const params = useParams()
    let { service, namespace} = useParams();
    const [errFetchRev, setErrFetchRev] = useState("")
    const [traffic, setTraffic] = useState(null)
    const history = useHistory()
    const [config, setConfig] = useState(null)

    const [latestRevision, setLatestRevision] = useState(null)
    const [revisions, setRevisions] = useState(null)
    const revisionsRef = useRef(revisions ? revisions: [])
    const [editable, setEditable] = useState(false)
    const editableRef = useRef(editable)
    const [rev1Name, setRev1Name] = useState("")
    const [rev2Name, setRev2Name] = useState("")
    const rev2NameCache = useRef(rev2Name)
    const [rev1Percentage, setRev1Percentage] = useState(0)

    const [isLoading, setIsLoading] = useState(true)

    const [revisionSource, setRevisionSource] = useState(null)
    const [trafficSource, setTrafficSource] = useState(null)

    let workflow = params[0]

    if(service === undefined) {
        service = q.get("function")
    }

    const getService = useCallback((dontChangeRev) => {
        async function getServices() {
            try {
                let resp = {}
                if (namespace && params[0] === undefined) {
                    resp = await NamespaceFunction(fetch, handleError, namespace, service)
                } else if (params[0]) {
                    // Not implemented via the API
                    // resp = await WorkflowFunction(fetch, handleError, namespace, q.get("path"), service)
                } else {
                    resp = await GlobalFunction(fetch, handleError, service)
                }
                setConfig(resp.config)
            } catch (e) {
                if (e.message.includes("not found")) {
                    history.goBack()
                }
                setErrFetchRev(`Error fetching service: ${e.message}`)
            }
        }
        return getServices()
    }, [fetch, handleError, namespace, service, history, params])

    // setup sse for traffic updates
    useEffect(()=>{
        if(trafficSource === null) {
            let x = `/functions/${service}`
            if(namespace && params[0] === undefined){
                x = `/functions/namespaces/${namespace}/function/${service}`
            } else if(params[0]) {
                if(q.get("function") === null) {
                    return
                }
                x = `/functions/namespaces/${namespace}/tree/${params[0]}?op=function&svn=${q.get("function")}`
            }
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                if(e.status === 403) {
                    setErrFetchRev("You are forbidden on watching on traffic source")
                }
            }

            async function getRealtimeData(e) {
                let edi = editableRef.current
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)

                if (json.event === "MODIFIED" || json.event === "ADDED") {
                    if (!edi) {
                        if (json.traffic) {
                            if(json.traffic.length > 0) {
                                setRev1Name(json.traffic[0].revisionName)
                                setRev1Percentage(json.traffic[0].traffic)
                                if(json.traffic[1]) {
                                    if(json.traffic[1].traffic !== 0) {
                                        setRev2Name(json.traffic[1].revisionName)
                                        rev2NameCache.current = json.traffic[1].revisionName
                                    } else {    
                                        setRev2Name("")
                                    }
                                } else if (rev2NameCache.current !== "") {
                                    setRev2Name("")
                                }
                            }
                            setTraffic(JSON.parse(JSON.stringify(json.traffic)))
                        }
                    }
                } 
            }

            eventConnection.onmessage = e => getRealtimeData(e)
            setTrafficSource(eventConnection)
        }
    },[q, trafficSource, editable, namespace, service, sse, workflow, params])

    // setup sse for revisions
    useEffect(()=>{
        if (revisionSource === null) {

            let x = `/functions/${service}/revisions`
            if (namespace && params[0] === undefined) {
                x = `/functions/namespaces/${namespace}/function/${service}/revisions`
            } else if(params[0]) {
                if(q.get("function") === null) {
                    return
                }
                //TODO: update route
                x = `/functions/namespaces/${namespace}/tree/${params[0]}?op=function-revisions&svn=${q.get("function")}`
                // x = `/watch/functions/${service}/revisions/`
            }
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                if(e.status === 403) {
                    setErrFetchRev("You are forbidden on watching revisions")
                    return
                }
            }

            async function getRealtimeData(e) {
                let revs = revisionsRef.current
                if(e.data === "") {
                    return
                }
                let json = JSON.parse(e.data)
                switch(json.event) {
                    case "DELETED":
                        for (var i=0; i < revs.length; i++) {
                            if(revs[i].name === json.revision.name) {
                                revs.splice(i, 1)
                                revisionsRef.current = revs
                                break
                            }
                        }
                        if (revs.length === 0) {
                            history.goBack()
                        }
                        break
                    case "MODIFIED":
                        for(i=0; i < revs.length; i++) {
                            if (revs[i].name === json.revision.name) {
                                revs[i] = json.revision
                                revisionsRef.current = revs
                                break
                            }
                        }
                        break
                    default:
                        let found = false
                        for(i=0; i < revs.length; i++) {
                            if(revs[i].name === json.revision.name) {
                                found = true 
                                break
                            }
                        }
                        if (!found){
                            revs.push(json.revision)
                            revisionsRef.current = revs
                        }
                }

                // filter based on revision dates
                revisionsRef.current.sort(function(a,b){
                    return a.generation < b.generation ? 1 : -1; 
                })
        

                if (revisionsRef.current[0]){
                    setLatestRevision(JSON.parse(JSON.stringify(revisionsRef.current[0])))
                }

                setRevisions(JSON.parse(JSON.stringify(revisionsRef.current)))
            }


            eventConnection.onmessage = e => getRealtimeData(e)
            setRevisionSource(eventConnection)
        }

    },[q,revisionSource, history, namespace, service, sse, workflow, params])

    useEffect(()=>{
        return ()=>{
            if(revisionSource !== null) {
                revisionSource.close()
            }

            if(trafficSource !== null) {
                trafficSource.close()
            }
        }
    },[trafficSource, revisionSource])

    // initial load request
    useEffect(()=>{
        if (config === null) {
            getService().finally(()=> {setIsLoading(false)})     
        }
    },[getService, config])

    // Query get function if it doesnt exist
    if(q.get("function") === null && params[0] !== undefined) {
        return ""
    }
    if(q.get("function") !== null && q.get("rev") !== null) {
        return ""
    }

    return(
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs appendQueryParams={true} elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto", gap:"40px" }}>
                <div className="container" style={{ flexDirection: "row", flex:1}}>
                <div className="shadow-soft rounded tile" style={{ flex: 1, overflowX:"auto" }}>
                    <TileTitle name={`Revisions for ${service}`}>
                        <IoList />
                    </TileTitle>
                    <LoadingWrapper isLoading={isLoading} text={"Loading Revisions List"}>
                        {errFetchRev !== ""?
     <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
     {errFetchRev}
 </div>                    
                    :
                    <ListRevisions handleError={handleError} workflow={workflow} namespace={namespace} serviceName={service} traffic={traffic} fetch={fetch}  revisions={revisions !== null ? revisions: []}/>

}
                    </LoadingWrapper>
                </div>
                {latestRevision !== null && config !== null && traffic !== null && params[0] === undefined ?
                <div className="container" style={{ flexDirection: "column"}}>
                {
                            traffic !== null ?
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Traffic Management">
                             <IoClipboardSharp />
                        </TileTitle>
                            <EditRevision 
                                workflow={workflow}
                                setRev1Percentage={setRev1Percentage} 
                                rev1Percentage={rev1Percentage} 
                                setRev2Name={setRev2Name} 
                                setEditable={setEditable} 
                                editable={editable}
                                editableRef={editableRef}
                                rev1Name={rev1Name} 
                                rev2Name={rev2Name} 
                                setRev1Name={setRev1Name} 
                                revisions={revisions ? revisions : []} 
                                handleError={handleError} 
                                traffic={traffic} 
                                fetch={fetch} 
                                // getService={getService} 
                                namespace={namespace} 
                                service={service}
                                />
                      
                    </div>
                          :
                          ""
                      }
                      <>
                        {latestRevision !== null && config !== null && params[0] === undefined ?
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px"}}>
                        <TileTitle name="Create revision">
                             <IoAdd />
                        </TileTitle>
                      
                            <CreateRevision workflow={workflow} namespace={namespace} config={config} setLatestRevision={setLatestRevision} latestRevision={latestRevision} handleError={handleError} fetch={fetch} service={service}/>
                     
                    </div>
                           :
                           ""
                       }
                       </>
                </div> : ""}
                </div>
            </div>
        </div>
    )
}

function ListRevisions(props) {
    const {revisions, workflow, getService, fetch, traffic, namespace, serviceName, handleError} = props
    return(
            <div style={{overflowX:"visible", maxHeight:"785px"}}> 
            {revisions.map((obj, i)=>{
                let hideDelete = false
                let titleColor = "var(--font-dark)"
                let sizeTxt = "small"
                if (obj.size === 1) {
                    sizeTxt = "medium"
                }
                if (obj.size === 2){
                    sizeTxt = "large"
                }

                if (i===0) {
                    hideDelete = true
                }
                if (traffic) {
                    if (traffic.length > 0) {
                        if (traffic[0].revisionName === obj.name){
                            titleColor = "#2396d8"
                        }
                        if (traffic[1]) {
                            if (traffic[1].revisionName === obj.name && traffic[1].traffic !== 0){
                                titleColor = "rgb(219, 58, 58)"
                            }
                        }
                    }
                    for (i=0; i < traffic.length; i++) {
                        if(traffic[i].revisionName === obj.name) {
                            obj.traffic = traffic[i].traffic
                        }
                    }
                }

                if (obj.traffic !== 0 && obj.traffic !== undefined) {
                    hideDelete = true
                }
 
                return(
                    <Revision handleError={handleError} workflow={workflow} namespace={namespace} serviceName={serviceName} hideDelete={hideDelete} titleColor={titleColor} cmd={obj.cmd} conditions={obj.conditions} size={sizeTxt} minScale={obj.minScale} fetch={fetch} fetchServices={getService} name={obj.name} image={obj.image} statusMessage={obj.statusMessage} generation={obj.generation} created={obj.created} status={obj.status} traffic={obj.traffic} revision={obj.rev}/>
                )
            })}
            </div> 
    )
}

function Revision(props) {
    const {titleColor, name, fetch, workflow, fetchServices, created,  conditions, status, traffic, hideDelete, namespace, serviceName, handleError, revision} = props
    let panelID = name;
    function toggleItem(){
        let x = document.getElementById(panelID);
        x.classList.toggle("expanded");
    }

    const deleteRevision = async () => {
        try {
            if (namespace) {
                await NamespaceDeleteFunctionRevision(fetch, handleError, namespace, serviceName, revision)
            } else if (workflow) {
                //TODO: add route

            } else {
                await GlobalDeleteFunctionRevision(fetch, handleError, serviceName, revision)
            }

        } catch (e) {
            sendNotification("Error:", e.message, 0)
        }
    }

    let circleFill = "success"
    if (status === "False") {
        circleFill = "failed"
    }
    if (status === "Unknown"){
        circleFill = "crashed"
    }

    let url = `/functions/global/${serviceName}/${revision}`
    if (namespace && workflow === undefined) {
        url = `/n/${namespace}/functions/${serviceName}/${revision}`
    }else if (workflow) {
        url = `/n/${namespace}/explorer/${workflow}?rev=${name}&function=${serviceName}`
    }
    
    return (
        <Link key={name} id={panelID} to={url} className="neumorph-hover" style={{marginBottom: "10px", textDecoration:"none", color:"var(--font-dark)"}} onClick={() => {
            toggleItem();
        }}>
            <div className="neumorph-hover">
            <div className="services-list-div " style={{width:"100%"}}>
                <div>
                    <div style={{display: "inline"}}>
                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                    </div>
                    <div style={{display: "inline"}}>
                        <b style={{color: titleColor}}>{name}</b> <i style={{fontSize:"12px"}}>{dayjs.unix(created).fromNow()}</i>
                    </div>
       

                </div>
               {!hideDelete ? <div style={{flex: "auto", textAlign: "right"}}>
                    <div className="buttons" style={{paddingRight:"25px"}}>
                        <div style={{position:"relative"}} title="Delete Service">
                            <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                                ev.preventDefault()
                                deleteRevision()
                            }} /> 
                        </div>
                    </div>
                </div>:""}
            </div>
            <div className="services-list-contents singular" style={{height:"auto",  overflow:"visible", width:"100%", paddingBottom:"10px"}}>
            <div className="service-list-item-panel" style={{fontSize:'14px', width:"97%"}}>
                    <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                        <ul>
                            {conditions ? <>
                            {conditions.map((obj)=>{
                                let circleFill2 = "success"
                                if (obj.status === "False") {
                                    circleFill2 = "failed"
                                }
                                if (obj.status === "Unknown"){
                                    circleFill2 = "crashed"
                                }
                                return(
                                    <li key={obj.name}>
                                        <CircleFill className={circleFill2} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                        <span style={{fontWeight:500}}>{obj.name}</span> {obj.reason!==""?<i style={{fontSize:"12px"}}>({obj.reason})</i>:""} <span style={{fontSize:'12px'}}>{obj.message}</span>
                                    </li>
                                )
                            })}</>
                            :""}
                        </ul>
                        </div>
                        {traffic !== undefined && traffic !== 0 ?  <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                        <ul style={{textAlign:"right", paddingRight:"20px"}}>
                                    <li>
                                        <span style={{fontWeight:500}}>Traffic: </span> <span style={{fontSize:'12px'}}>{traffic}%</span>
                                    </li>
                        </ul>
                        </div>: ""}
                    </div>
                 </div>
            </div>
        </div>
        </Link>
    )
}

function CreateRevision(props) {
    const {service,  workflow, config, namespace, fetch, handleError, latestRevision, setLatestRevision} = props
    const [err, setErr] = useState("")
    const [traffic, setTraffic] = useState(100)
    const [isLoading, setIsLoading] = useState(false)


    const createRevision = async () => {
        try {
            if (namespace) {
                await NamespaceUpdateFunction(fetch, handleError, namespace, service, latestRevision.image, parseInt(latestRevision.minScale), parseInt(latestRevision.size), latestRevision.cmd, parseInt(traffic))
            } else if (workflow) {
                //TODO: add route

            } else {
                await GlobalUpdateFunction(fetch, handleError, service, latestRevision.image, parseInt(latestRevision.minScale), parseInt(latestRevision.size), latestRevision.cmd, parseInt(traffic))
            }

            // clear error
            setErr("")
            setTraffic(100)
        } catch (e) {
            setErr(`Error updating service: ${e.message}`)
        }
    }

    const handleTraffic = trprops => {
        const {value, dragging, index, ...restProps} = trprops;

        return(
            <SliderTooltip
            prefixCls="rc-slider-tooltip"
            overlay={`${value}%`}
            visible={dragging}
            placement="top"
            key={index}
          >
            <Handle value={value} {...restProps} />
          </SliderTooltip>
        )
    }
    const handle = haprops => {
        const {value, dragging, index, ...restProps} = haprops;

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
    return(
        <LoadingWrapper isLoading={isLoading} text={"Creating Revision"}>
        <div style={{ fontSize: "12pt"}}>
            <div style={{display:"flex", flexDirection:"column" }}>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Image:
                    </div>
                    <div>
                        <input style={{width:"205px"}} value={latestRevision.image}  onChange={(e) => setLatestRevision((prevState)=>{return {...prevState, image:e.target.value}})} type="text" placeholder="Enter image used by service" />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px", paddingRight:"14px"}}>
                        Scale:
                    </div>
                    <div style={{width:"190px"}}>
                        <Slider value={latestRevision.minScale}  onChange={(e)=>setLatestRevision((prevState)=>{return{...prevState, minScale: e}})} handle={handle} min={0} max={config.maxscale}  defaultValue={latestRevision.minScale} />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px", paddingRight:"14px"}}>
                        Size:
                    </div>
                    <div style={{width:"190px"}}>
                        <Slider value={latestRevision.size} onChange={(e)=>setLatestRevision((prevState)=>{return{...prevState, size: e}})} handle={handle} min={0} max={2} defaultValue={latestRevision.size} marks={{ 0: "small", 1: "medium", 2:"large"}} step={null}/>
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Cmd:
                    </div>
                    <div>
                        <input style={{width:"205px"}} value={latestRevision.cmd}  onChange={(e) => setLatestRevision((prevState)=>{return {...prevState, cmd:e.target.value}})} type="text" placeholder="Enter the CMD for the service" />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px", paddingRight:"14px"}}>
                        Traffic:
                    </div>
                    <div style={{width:"190px"}}>
                        <Slider value={traffic} onChange={(e)=>setTraffic(e)} handle={handleTraffic} min={0} max={100} defaultValue={traffic} />
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
        <div title="Create Revision" style={{ textAlign: "right" }}>
            <input type="submit" value="Create Revision" onClick={() => { 
                setIsLoading(true)
                createRevision().finally(()=> {setIsLoading(false)})
                 }} />
        </div>
    </div>
    </LoadingWrapper>
    )
}

function EditRevision(props) {
    const {fetch, service, workflow, editableRef, handleError, revisions, namespace, editable, setEditable, rev1Name, setRev1Name, rev2Name, setRev2Name, setRev1Percentage, rev1Percentage} = props

    const [err, setErr] = useState("")


    const [isLoading, setIsLoading] = useState(false)

    const updateTraffic = async (rev1, rev2, val) => {
        try {
            let traffic = [{
                revision: rev1,
                percent: val
            }]
            if (rev2 !== "") {
                traffic.push({
                    revision: rev2,
                    percent: 100-val
                })
            }

            if (namespace) {
                await NamespaceUpdateTrafficFunction(fetch, handleError, namespace, service, traffic)
            } else if (workflow) {
                //TODO: add route

            } else {
                await GlobalUpdateTrafficFunction(fetch, handleError, service, traffic)
            }

            // clear error
            setErr("")
        } catch (e) {
            setErr(`Error setting traffic: ${e.message}`)
        }

        try {
            x = `/functions/${service}`
            if (namespace) {
                x = `/functions/namespaces/${namespace}/function/${service}`
            }
            if (workflow) {
                x = `/functions/${service}`
            }
            let body = [{
                revision: rev1,
                percent: val
            }]
            if (rev2 !== "") {
                body.push({
                    revision: rev2,
                    percent: 100-val
                })
            }
            // make it not editable you've hit the button
            // editableRef.current = !editable
            // setEditable(!editable)
            let resp = await fetch(x, {
                method: "PATCH",
                body: JSON.stringify({values:body})
            })
            if (resp.ok) {
                setErr('')
                // await getService()
            } else {
                await handleError("set traffic", resp, "updateService")
            }
        } catch(e) {
            setErr(`Error setting traffic: ${e.message}`)
        }
    }

    const handle = haprops => {
        const {value, dragging, index, ...restProps} = haprops;

        return(
            <SliderTooltip
            prefixCls="rc-slider-tooltip"
            overlay={`${value} %`}
            visible={dragging}
            placement="top"
            key={index}
          >
            <Handle value={value} {...restProps} />
          </SliderTooltip>
        )
    }

    let x = editable 
    if (x) {
        if(rev2Name === "") {
            x = false
        }
    }

    return(
        <LoadingWrapper isLoading={isLoading} text={"Updating Usage"}>
        <div style={{fontSize:"12pt"}}>
        <div style={{display:"flex", flexDirection:"column" }}>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Rev 1:
                    </div>
                    <div>
                        <select disabled={!editable} style={{width:"220px"}} value={rev1Name} onChange={(e)=>setRev1Name(e.target.value)}>
                            <option value="">None Selected.</option>
                            {
                                revisions.map((obj)=>{
                                    return(
                                        <option key={obj.name} value={obj.name}>{obj.name}</option>
                                    )
                                })
                            }
                        </select>
                        {/* <input style={{width:"205px"}} placeholder="Enter revision hash" type="text" defaultValue={rev1Name} value={rev1Name} onChange={(e)=>setRev1Name(e.target.value)}/> */}
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Rev 2:
                    </div>
                    <div>
                    <select disabled={!editable} style={{width:"220px"}} value={rev2Name} onChange={(e)=>{
                        if (e.target.value === "") {
                            setRev1Percentage(100)
                        }
                        setRev2Name(e.target.value)
                    }}>
                    <option value="">None Selected.</option>
                          
                            {
                                revisions.map((obj)=>{
                                    return(
                                        <option key={obj.name} value={obj.name}>{obj.name}</option>
                                    )
                                })
                            }
                        </select>
                        {/* <input style={{width:"205px"}} placeholder="Enter revision hash" type="text" defaultValue={rev2Name} value={rev2Name} onChange={(e)=>setRev2Name(e.target.value)}/> */}
                    </div>
                </div>

                    <div style={{display:'flex', gap:"10px"}}>
                        <div className="block-slider" style={{minWidth:"200px", paddingLeft:'5px', paddingTop:'5px', flex: "auto"}}>
                            <div style={{position: "relative", width: "100%", padding: "0px"}}>
                                <div style={{position: "relative", bottom: "6px"}}>
                                    <div style={{display: "flex", width: "100%"}}>
                                        <div style={{textAlign: "left", flex: "auto", fontSize: "8pt", fontWeight: "bold", color: "#4293c4"}}>Rev 1</div>
                                        <div style={{textAlign: "right", flex: "auto", fontSize: "8pt", fontWeight: "bold", color: "rgb(219, 58, 58)"}}>Rev 2</div>
                                    </div>
                                </div>
                            </div>
                            <Slider disabled={!x} handle={handle} min={0} max={100}  onChange={(e)=>{setRev1Percentage(e)}} value={rev1Percentage} defaultValue={rev1Percentage} />
                            <div style={{position: "relative", width: "100%", padding: "0px"}}>
                                <div style={{position: "relative", top: "4px"}}>
                                    <div style={{display: "flex", width: "100%"}}>
                                        <div style={{textAlign: "left", flex: "auto", fontSize: "8pt"}}>{rev1Percentage}%</div>
                                        <div style={{textAlign: "right", flex: "auto", fontSize: "8pt"}}>{rev1Percentage !== 0? 100-rev1Percentage: 100}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>  
                    </div>
                    <div style={{marginTop:"10px", marginBottom:"10px", color:"#b5b5b5", borderBottom: "1px solid #b5b5b5"}}/>
            </div>
            {err !== ""?
                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {err}
                </div>
            :
                <></>    
            }
            {!editable?
            <div title="Edit Traffic" style={{ textAlign: "right" }}>
                <input type="submit" value="Edit Traffic" onClick={()=>{
                              editableRef.current = !editable
                              setEditable(!editable)
                }} />
            </div>:""}
            { (rev1Name && editable) ? 
            <div title="Set Traffic" style={{ textAlign: "right" }}>
                <input onClick={() => {
                    setIsLoading(true)
                    updateTraffic(rev1Name, rev2Name, rev1Percentage).finally(()=> {
                        setIsLoading(false)
                        editableRef.current = !editable
                        setEditable(false)
                    })
                }} type="submit" value="Save" />
            </div>
            : <></> }
        </div>
        </LoadingWrapper>
    )
}