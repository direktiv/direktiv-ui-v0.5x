import {useState, useEffect, useContext, useCallback} from "react"
import Slider, { SliderTooltip, Handle } from 'rc-slider';
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import 'rc-slider/assets/index.css';
import { ConfirmButton } from '../confirm-button'

import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import {useParams} from "react-router-dom"
import { IoAdd, IoClipboardSharp, IoList, IoTrash} from 'react-icons/io5'
import MainContext from "../../context";
import LoadingWrapper from "../loading"


import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
export default function Services() {
    const {fetch, handleError, sse} = useContext(MainContext)
    let { service, namespace } = useParams();
    const [errFetchRev, setErrFetchRev] = useState("")
    const [srvice, setService] = useState(null)
    const [traffic, setTraffic] = useState(null)
    const [config, setConfig] = useState(null)

    const [latestRevision, setLatestRevision] = useState(null)

    const [editable, setEditable] = useState(false)
    const [rev1Name, setRev1Name] = useState("")
    const [rev2Name, setRev2Name] = useState("")

    const [rev1Percentage, setRev1Percentage] = useState(0)

    const [isLoading, setIsLoading] = useState(false)

    const [initialized, setInitialized] = useState(false)
    const [initTraffic, setInitTraffic] = useState(false)

    const getService = useCallback((dontChangeRev)=>{
        async function getServices() {
            let x = `/functions/g-${service}`
            if (namespace) {
                x = `/namespaces/${namespace}/functions/ns-${namespace}-${service}`
            }
            try {
                let tr = []
                let resp = await fetch(x, {
                    method:"GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    for(var i=0; i < json.revisions.length; i++) {
                        if (json.revisions[i].traffic > 0) {
                            tr.push({
                                name: json.revisions[i].name,
                                value: json.revisions[i].traffic
                            })
                        }
                    }

                    if (!editable) {
                        if (tr.length > 0) {
                            console.log("tr is greater than 0")
                            setRev1Name(tr[0].name)
                            setRev1Percentage(tr[0].value)
                            if(tr[1]) {
                                setRev2Name(tr[1].name)
                            }
                        }
                    }

                    if(!dontChangeRev) {
                        setLatestRevision({
                            image: json.revisions[0].image,
                            scale: json.revisions[0].minScale ? json.revisions[0].minScale : 0,
                            size: json.revisions[0].size ? json.revisions[0].size : 0,
                            cmd: json.revisions[0].cmd ? json.revisions[0].cmd : ""
                        })
                    }
                    setConfig(json.config)
                    setService(json)
                    setTraffic(tr)
                } else {
                    await handleError('fetch revisions', resp, 'fetchService')
                }
            } catch(e) {
                setErrFetchRev(`Error fetching service: ${e.message}`)
            }
        }
        return getServices()
    },[fetch, handleError, namespace, editable, service])

    // setup sse for traffic updates
    useEffect(()=>{
        if(!initTraffic) {
            let x = `/watch/functions/g-${service}`
            if(namespace){
                x = `/watch/namespaces/${namespace}/functions/ns-${namespace}-${service}`
            }

            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                console.log('error on sse', e)
            }

            async function getRealtimeData(e) {
                console.log(e, "watch traffic update")
            }

            eventConnection.onmessage = e => getRealtimeData(e)
            setInitTraffic(true)
        }
    },[initTraffic])

    // setup sse for revisions
    useEffect(()=>{
        if (!initialized) {

            let x = `/watch/functions/g-${service}/revisions/`
            if (namespace) {
                x = `/watch/namespaces/${namespace}/functions/ns-${namespace}-${service}/revisions/`
            }
            
            let eventConnection = sse(`${x}`, {})
            eventConnection.onerror = (e) => {
                // error log here
                // after logging, close the connection   
                console.log('error on sse', e)
            }

            async function getRealtimeData(e) {
                console.log(e, "watch revisions update")
            }

            eventConnection.onmessage = e => getRealtimeData(e)
            setInitialized(true)
        }

    },[initialized])


    // initial load request
    useEffect(()=>{
        if (srvice === null) {
            getService().finally(()=> {setIsLoading(false)})     
        }
    },[getService, srvice])

    return(
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
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
                    <ListRevisions traffic={traffic} fetch={fetch}  revisions={srvice ? srvice.revisions : []}/>

}
                    </LoadingWrapper>
                </div>
                <div className="container" style={{ flexDirection: "column"}}>
                {
                            traffic !== null ?
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Traffic Management">
                             <IoClipboardSharp />
                        </TileTitle>
                      
                            <EditRevision 
                                setRev1Percentage={setRev1Percentage} 
                                rev1Percentage={rev1Percentage} 
                                setRev2Name={setRev2Name} 
                                setEditable={setEditable} 
                                editable={editable}
                                rev1Name={rev1Name} 
                                rev2Name={rev2Name} 
                                setRev1Name={setRev1Name} 
                                revisions={srvice ? srvice.revisions : []} 
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
                        {latestRevision !== null && config !== null ?
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px"}}>
                        <TileTitle name="Create revision">
                             <IoAdd />
                        </TileTitle>
                      
                            <CreateRevision namespace={namespace} config={config} setLatestRevision={setLatestRevision} latestRevision={latestRevision} handleError={handleError} fetch={fetch} service={service}/>
                     
                    </div>
                           :
                           ""
                       }
                </div>
                </div>
            </div>
        </div>
    )
}

function ListRevisions(props) {
    const {revisions, getService, fetch, traffic} = props
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
                        if (traffic[0].name === obj.name){
                            titleColor = "#2396d8"
                        }
                        if (traffic[1]) {
                            if (traffic[1].name === obj.name){
                                titleColor = "rgb(219, 58, 58)"
                            }
                        }
                    }
                }
 
                return(
                    <Revision hideDelete={hideDelete} titleColor={titleColor} cmd={obj.cmd} conditions={obj.conditions} size={sizeTxt} minScale={obj.minScale} fetch={fetch} fetchServices={getService} name={obj.name} image={obj.image} statusMessage={obj.statusMessage} generation={obj.generation} created={obj.created} status={obj.status} traffic={obj.traffic}/>
                )
            })}
            </div> 
    )
}

function Revision(props) {
    const {titleColor, name, fetch, size, cmd, minScale, fetchServices, image, generation, created,  conditions, status, traffic, hideDelete} = props

    let panelID = name;
    function toggleItem(){
        let x = document.getElementById(panelID);
        x.classList.toggle("expanded");
    }

    const deleteRevision = async () => {
        try {
            let resp = await fetch(`/functionrevisions/${name}`,{
                method: "DELETE"
            })
            if (resp.ok) {
                fetchServices()
            } else {
                console.log(resp, "handle delete revision resp not ok")
            }
        } catch(e) {
            console.log(e, "handle delete revision")
        }
    }

    let circleFill = "success"
    if (status === "False") {
        circleFill = "failed"
    }
    if (status === "Unknown"){
        circleFill = "crashed"
    }


    return (
        <div id={panelID} className="neumorph-hover" style={{marginBottom: "10px"}} onClick={() => {
            toggleItem();
        }}>
            <div className="services-list-div ">
                <div>
                    <div style={{display: "inline"}}>
                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                    </div>
                    <div style={{display: "inline"}}>
                        <b style={{color: titleColor}}>{name}</b> <i style={{fontSize:"12px"}}>{dayjs.unix(created).fromNow()}</i>
                    </div>
                </div>
               {!hideDelete ? <div style={{flex: "auto", textAlign: "right"}}>
                    <div className="buttons">
                        <div style={{position:"relative"}} title="Delete Service">
                            <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                                ev.preventDefault()
                                deleteRevision()
                            }} /> 
                        </div>
                    </div>
                </div>:""}
            </div>
            <div className="services-list-contents singular">
            <div className="service-list-item-panel" style={{fontSize:'14px'}}>
                     <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                         <div style={{flex: 1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                             <p><div style={{width:"100px", display:"inline-block"}}><b>Image:</b></div> {image}</p>
                             {size !== undefined ? 
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Size:</b></div> {size}</p> 
                                :
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Size:</b></div> 0</p>
                             }
                             {traffic !== undefined  ?
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Traffic:</b></div> {traffic}%</p> 
                                :
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Traffic:</b></div> 0%</p> 
                             }
                         </div>
                         <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                            <p><div style={{width:"100px", display:"inline-block"}}><b>Generation:</b></div> {generation}</p>
                             {minScale !== undefined ?
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Scale:</b></div> {minScale}</p> 
                                : 
                                <p><div style={{width:"100px", display:"inline-block"}}><b>Scale:</b></div> 0</p> 
                             }
                            <p><div style={{width:"100px", display:"inline-block"}}><b>Created:</b></div> {dayjs.unix(created).format('h:mm a, DD-MM-YYYY')}</p> 

                             {/* <p style={{marginBottom:"0px"}}><b>Created:</b> {dayjs.unix(created).format('h:mm a, DD-MM-YYYY')}</p> */}
                         </div>
                     </div>
                    <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>

                        <p style={{marginTop:"0px"}}><b>Conditions:</b></p>
                        <ul>
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
                                    <li>
                                        <CircleFill className={circleFill} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                                        <span style={{fontWeight:500}}>{obj.name}</span> {obj.reason!==""?<i style={{fontSize:"12px"}}>({obj.reason})</i>:""} <span style={{fontSize:'12px'}}>{obj.message}</span>
                                    </li>
                                )
                            })}</>
                            :""}
                        </ul>
                        </div>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                            {cmd !== undefined ? <p style={{marginTop:"0px"}}><div style={{width:"100px", display:"inline-block"}}><b>Cmd:</b></div> {cmd}</p> : "" }
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    )
}

function CreateRevision(props) {
    const {service, getService, config, namespace, fetch, handleError, latestRevision, setLatestRevision} = props
    const [err, setErr] = useState("")
    // const [scale, setScale] = useState(0)
    // const [size, setSize] = useState(0)
    // const [cmd, setCmd] = useState("")
    const [traffic, setTraffic] = useState(100)
    const [isLoading, setIsLoading] = useState(false)


    const createRevision = async () => {
        try {
            let x = `/functions/g-${service}`
            if (namespace) {
                x =  `/namespaces/${namespace}/functions/ns-${namespace}-${service}`
            }
            let resp = await fetch(x, {
                method: "POST",
                body: JSON.stringify({
                    image: latestRevision.image,
                    cmd: latestRevision.cmd,
                    size: parseInt(latestRevision.size),
                    minScale: parseInt(latestRevision.scale),
                    trafficPercent: parseInt(traffic),
                })
            })
            if (resp.ok) {
                setErr("")
                setTraffic(100)
                // await getService()
            } else {
                await handleError('update service', resp, 'updateService')
            }
        } catch(e) {
            setErr(`Error updating service: ${e.message}`)
        }
    }

    const handleTraffic = props => {
        const {value, dragging, index, ...restProps} = props;

        // if (!dragging) {
        //     setLatestRevision((prevState)=>{return {...prevState, scale:value}})
        // }

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
    const handle = props => {
        const {value, dragging, index, ...restProps} = props;

        // if (!dragging) {
        //     setLatestRevision((prevState)=>{return {...prevState, scale:value}})
        // }

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
                        <Slider value={latestRevision.scale} onChange={(e)=>setLatestRevision((prevState)=>{return{...prevState, scale: e}})} handle={handle} min={0} max={config.maxscale}  defaultValue={latestRevision.scale} />
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
    const {fetch, service, getService,handleError, revisions, namespace, editable, setEditable, rev1Name, setRev1Name, rev2Name, setRev2Name, setRev1Percentage, rev1Percentage} = props

    const [err, setErr] = useState("")


    const [isLoading, setIsLoading] = useState(false)


    const updateTraffic = async (rev1, rev2, val) => {
        try {
            let x = `/functions/g-${service}`
            if (namespace) {
                x = `/namespaces/${namespace}/functions/ns-${namespace}-${service}`
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

            let resp = await fetch(x, {
                method: "PATCH",
                body: JSON.stringify({values:body})
            })
            if (resp.ok) {
                setErr('')
                await getService()
            } else {
                await handleError("set traffic", resp, "updateTraffic")
            }
        } catch(e) {
            setErr(`Error setting traffic: ${e.message}`)
        }
    }

    const handle = props => {
        const {value, dragging, index, ...restProps} = props;

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
                                        <option value={obj.name}>{obj.name}</option>
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
                                        <option value={obj.name}>{obj.name}</option>
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
                            <Slider disabled={!editable} handle={handle} min={0} max={100}  onChange={(e)=>{setRev1Percentage(e)}} value={rev1Percentage} defaultValue={rev1Percentage} />
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
                <input onClick={() => {
                    console.log('setting editable to ', !editable, setEditable)
                    setEditable(!editable)
                }} type="submit" value="Edit Traffic" />
            </div>:""}
            { (rev1Name && editable) ? 
            <div title="Set Traffic" style={{ textAlign: "right" }}>
                <input onClick={() => {
                    setIsLoading(true)
                    updateTraffic(rev1Name, rev2Name, rev1Percentage).finally(()=> {
                        setIsLoading(false)
                        setEditable(false)
                    })
                }} type="submit" value="Save" />
            </div>
            : <></> }
        </div>
        </LoadingWrapper>
    )
}