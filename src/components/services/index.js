import {useState, useEffect, useContext, useCallback} from "react"
import Slider, { SliderTooltip, Handle } from 'rc-slider';
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import 'rc-slider/assets/index.css';
import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';
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
    const {fetch, handleError} = useContext(MainContext)
    let { service } = useParams();
    const [errFetchRev, setErrFetchRev] = useState("")
    const [srvice, setService] = useState(null)
    const [traffic, setTraffic] = useState(null)

    const [latestRevision, setLatestRevision] = useState("")

    const [isLoading, setIsLoading] = useState(true)


    const getService = useCallback((dontChangeRev)=>{
        async function getServices() {
            try {
                let tr = []
                let resp = await fetch(`/functions/${service}`, {
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
                    if(!dontChangeRev) {
                        setLatestRevision(json.revisions[0].image)
                    }
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
    },[service])

    useEffect(()=>{
            let interval = setInterval(()=>{
                console.log('polling knative funcs')
                getService(true)
            }, 3000)
            return () => {
                clearInterval(interval)
            }
    },[srvice])

    useEffect(()=>{
        if (srvice === null) {
            getService().finally(()=> {setIsLoading(false)})     
        }
    },[srvice])

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
                    <ListRevisions fetch={fetch} getService={getService} revisions={srvice ? srvice.revisions : []}/>

}
                    </LoadingWrapper>
                </div>
                <div className="container" style={{ flexDirection: "column"}}>

                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Traffic Management">
                             <IoClipboardSharp />
                        </TileTitle>
                        {
                            traffic !== null ?
                            <EditRevision revisions={srvice ? srvice.revisions : []} handleError={handleError} traffic={traffic} fetch={fetch} getService={getService} service={service}/>
                            :
                            ""
                        }
                    </div>
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px"}}>
                        <TileTitle name="Create revision">
                             <IoAdd />
                        </TileTitle>
                        {latestRevision !== "" ?
                            <CreateRevision setLatestRevision={setLatestRevision} latestRevision={latestRevision} handleError={handleError} fetch={fetch} getService={getService} service={service}/>
                            :
                            ""
                        }
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}

function ListRevisions(props) {
    const {revisions, getService, fetch} = props
    return(
            <div style={{overflowX:"visible", maxHeight:"785px"}}> 
            {revisions.map((obj)=>{
                return(
                    <Revision size={obj.size} minScale={obj.minScale} fetch={fetch} fetchServices={getService} name={obj.name} image={obj.image} statusMessage={obj.statusMessage} generation={obj.generation} created={obj.created} status={obj.status} traffic={obj.traffic}/>
                )
            })}
            </div> 
    )
}

function Revision(props) {
    const {name, fetch, size, minScale, fetchServices, image, generation, created, statusMessage, status, traffic} = props

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
                        <b>{name}</b> <i style={{fontSize:"12px"}}>{dayjs.unix(created).fromNow()}</i>
                    </div>
                </div>
                <div style={{flex: "auto", textAlign: "right"}}>
                    <div className="buttons">
                        <div style={{position:"relative"}} title="Delete Service">
                            <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                                ev.preventDefault()
                                deleteRevision()
                            }} /> 
                        </div>
                    </div>
                </div>
            </div>
            <div className="services-list-contents singular">
            <div className="service-list-item-panel" style={{fontSize:'14px'}}>
                     <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                         <div style={{flex: 1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                             <p><b>Image:</b> {image}</p>
                             {size !== undefined ?  <p><b>Size:</b> {size}</p> : ""}
                             {traffic !== undefined ?<p style={{marginBottom:"0px"}}><b>Traffic:</b> {traffic} </p>:<p style={{marginBottom:"0px"}}><b>Traffic:</b> 0 </p>}
                         </div>
                         <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px", paddingBottom:"0px"}}>
                             <p><b>Generation:</b> {generation}</p>
                             {minScale !== undefined ?  <p><b>Scale:</b> {minScale}</p> : ""}
                             <p style={{marginBottom:"0px"}}><b>Created:</b> {dayjs.unix(created).format()}</p>
                         </div>
                     </div>
                    <div style={{textAlign:"left", padding:"10px", width:"100%"}}>
                        {statusMessage !== undefined ? <p style={{marginTop:"0px"}}><b>Message:</b> {statusMessage}</p> : "" }
                    </div>
                 </div>
            </div>
        </div>
    )
}

function CreateRevision(props) {
    const {service, getService, fetch, handleError, latestRevision, setLatestRevision} = props
    const [err, setErr] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")
    const [isLoading, setIsLoading] = useState(false)


    const createRevision = async () => {
        try {
            let resp = await fetch(`/functions/${service}`, {
                method: "POST",
                body: JSON.stringify({
                    image: latestRevision,
                    cmd: cmd,
                    size: parseInt(size),
                    minScale: parseInt(scale),
                })
            })
            if (resp.ok) {
                setErr("")
                setScale(0)
                setSize(0)
                setCmd("")
                await getService()
            } else {
                await handleError('update service', resp, 'updateService')
            }
        } catch(e) {
            setErr(`Error updating service: ${e.message}`)
        }
    }

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

    return(
        <LoadingWrapper isLoading={isLoading} text={"Creating Revision"}>
        <div style={{ fontSize: "12pt"}}>
            <div style={{display:"flex", flexDirection:"column" }}>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Image:
                    </div>
                    <div>
                        <input style={{width:"205px"}} value={latestRevision}  onChange={(e) => setLatestRevision(e.target.value)} type="text" placeholder="Enter image used by service" />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px", paddingRight:"14px"}}>
                        Scale:
                    </div>
                    <div style={{width:"190px"}}>
                        <Slider handle={handleScale} min={0} max={10} marks={{0:0, 5:5, 10:10}}  defaultValue={scale} />
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px", paddingRight:"14px"}}>
                        Size:
                    </div>
                    <div style={{width:"190px"}}>
                        <Slider handle={handleSize} min={0} max={2} defaultValue={size} marks={{ 0: 0, 1: 1, 2:2}} step={null}/>
                    </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:"10px", paddingBottom:"20px", minHeight:"36px"}}>
                    <div style={{textAlign:"left", minWidth:"60px"}}>
                        Cmd:
                    </div>
                    <div>
                        <input style={{width:"205px"}} value={cmd}  onChange={(e) => setCmd(e.target.value)} type="text" placeholder="Enter the CMD for the service" />
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
    const {traffic, fetch, service, getService,handleError, revisions} = props

    const [err, setErr] = useState("")
    const [rev1Name, setRev1Name] = useState(traffic[0]? traffic[0].name: "")
    const [rev2Name, setRev2Name] = useState(traffic[1]? traffic[1].name: "")

    const [rev1Percentage, setRev1Percentage] = useState(traffic[0]? traffic[0].value: 0)

    const [isLoading, setIsLoading] = useState(false)


    const updateTraffic = async (rev1, rev2, val) => {
        try {
            let resp = await fetch(`/functions/${service}`, {
                method: "PATCH",
                body: JSON.stringify({values:[{
                    revision: rev1,
                    percent: val
                },{
                    revision: rev2,
                    percent: 100-val
                }]})
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

        if (!dragging) {
            setRev1Percentage(value)
        }

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
                        <select style={{width:"220px"}} defaultValue={rev1Name} onChange={(e)=>setRev1Name(e.target.value)}>
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
                    <select style={{width:"220px"}} defaultValue={rev2Name} onChange={(e)=>setRev2Name(e.target.value)}>
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
                { (rev1Name && rev2Name) ? 
                    <>
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
                            <Slider handle={handle} min={0} max={100} defaultValue={rev1Percentage} />
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
                    </>
                : "" }                    
            </div>
            {err !== ""?
                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {err}
                </div>
            :
                <></>    
            }
            { (rev1Name && rev2Name) ? 
            <div title="Set Traffic" style={{ textAlign: "right" }}>
                <input onClick={() => {
                    setIsLoading(true)
                    updateTraffic(rev1Name, rev2Name, rev1Percentage).finally(()=> {setIsLoading(false)})
                }} type="submit" value="Save" />
            </div>
            : <></> }
        </div>
        </LoadingWrapper>
    )
}