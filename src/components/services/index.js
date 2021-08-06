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
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import {useParams} from "react-router-dom"
import { IoAdd, IoClipboardSharp, IoList} from 'react-icons/io5'
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

    const [isLoading, setIsLoading] = useState(true)


    const getService = useCallback(()=>{
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
                <div className="container" style={{ flexDirection: "column", flex:1, maxWidth: "400px"}}>
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Edit revision usage">
                             <IoClipboardSharp />
                        </TileTitle>
                        {
                            traffic !== null ?
                            <EditRevision handleError={handleError} traffic={traffic} fetch={fetch} getService={getService} service={service}/>
                            :
                            ""
                        }
                    </div>
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px"}}>
                        <TileTitle name="Create revision">
                             <IoAdd />
                        </TileTitle>
                        <CreateRevision handleError={handleError} fetch={fetch} getService={getService} service={service}/>
                    </div>
                </div>
                <div className="shadow-soft rounded tile" style={{ flex: 1 }}>
                    <TileTitle name={`Revisions for ${service}`}>
                        <IoList />
                    </TileTitle>
                    <LoadingWrapper isLoading={isLoading} text={"Loading Revisions List"}>
                        {errFetchRev !== ""?
     <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
     {errFetchRev}
 </div>                    
                    :
                    <ListRevisions revisions={srvice ? srvice.revisions : []}/>

}
                    </LoadingWrapper>
                </div>
            </div>
        </div>
    )
}

function ListRevisions(props) {
    const {revisions} = props
    return(
        <div>
            <Accordion>
                {revisions.map((obj)=>{
                    return(
                        <Revision name={obj.name} image={obj.image} statusMessage={obj.statusMessage} generation={obj.generation} created={obj.created} status={obj.status} traffic={obj.traffic}/>
                    )
                })}
            </Accordion>
        </div>
    )
}

function Revision(props) {
    const {name, image, generation, created, statusMessage, status, traffic} = props

    return(
        <AccordionItem>
            <AccordionItemHeading>
                <AccordionItemButton>
                    <div className="service-list-item" style={{fontSize:"16px", borderRadius:"10px", textAlign:"left", padding:"10px"}}>
                    <CircleFill className={status === "True" ? "success":"failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                        <b>{name}</b> <i style={{fontSize:"12px"}}>{dayjs.unix(created).fromNow()}</i>
                    </div>
                </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel>
                <div className="service-list-item-panel" style={{fontSize:'14px'}}>
                    <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                        <div style={{flex: 1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
                            <p><b>Image:</b> {image}</p>
                            <p><b>Generation:</b> {generation}</p>
                            <p><b>Traffic:</b> {traffic} </p>
                        </div>
                        <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
                            <p><b>Created:</b> {dayjs.unix(created).format()}</p>
                            <p><b>Status:</b> {status}</p>
                            {statusMessage !== undefined ? <p><b>Message:</b> {statusMessage}</p> : "" }
                        </div>
                    </div>
                </div>
            </AccordionItemPanel>
        </AccordionItem>
    )
}

function CreateRevision(props) {
    const {service, getService, fetch, handleError} = props
    const [err, setErr] = useState("")
    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")
    const [isLoading, setIsLoading] = useState(false)


    const createRevision = async () => {
        try {
            let resp = await fetch(`/functions/${service}`, {
                method: "POST",
                body: JSON.stringify({
                    image: image,
                    cmd: cmd,
                    size: parseInt(size),
                    minScale: parseInt(scale),
                })
            })
            if (resp.ok) {
                setErr("")
                setImage("")
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


    return(
        <LoadingWrapper isLoading={isLoading} text={"Creating Revision"}>
        <div style={{ fontSize: "12pt"}}>
            <div style={{display:"flex", alignItems:"center" }}>
            <table style={{flex: 1}}>
                <tbody>
                    <tr>
                        <td style={{textAlign:"left"}}>
                            <b>Image:</b>
                        </td>
                        <td  style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={image}  onChange={(e) => setImage(e.target.value)} type="text" placeholder="Image used" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{textAlign:"left"}}>
                            <b>Scale:</b>
                        </td>
                        <td  style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={scale}  onChange={(e) => setScale(e.target.value)} type="text" placeholder="Scale" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{textAlign:"left"}}>
                            <b>Size:</b>
                        </td>
                        <td  style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <select defaultValue="0" style={{width:"191px"}} onChange={(e)=>setSize(e.target.value)}>
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td style={{textAlign:"left"}}>
                            <b>Cmd:</b>
                        </td>
                        <td  style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={cmd}  onChange={(e) => setCmd(e.target.value)} type="text" placeholder="Cmd values" />
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
        <hr />
        {err !== ""?
       <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
       {err}
   </div>
    :
    ""    
    }
        <div style={{ textAlign: "right" }}>
            <input type="submit" value="Create Service" onClick={() => { 
                setIsLoading(true)
                createRevision().finally(()=> {setIsLoading(false)})
                 }} />
        </div>
    </div>
    </LoadingWrapper>
    )
}

function EditRevision(props) {
    const {traffic, fetch, service, getService,handleError} = props

    const [err, setErr] = useState("")
    const [rev1Name, setRev1Name] = useState(traffic[0]? traffic[0].name: "")
    const [rev2Name, setRev2Name] = useState(traffic[1]? traffic[1].name: "")

    const [rev1Percentage, setRev1Percentage] = useState(traffic[0]? traffic[0].value: 0)

    const [isLoading, setIsLoading] = useState(false)


    const updateTraffic = async (rev1, rev2, val) => {
        try {
            if (rev2 === "") {
                throw new Error("Revision 2 must be filled out to change traffic")
            }
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
            setErr(`Error setting traffic: ${e.message}'`)
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
        <div style={{fontSize:"14px"}}>
            <div style={{display:"flex", alignItems:"center", gap:"5px"}}>
                <div style={{display:"flex", alignItems:'center'}}>Revision 1:</div> 
                <input style={{width:"205px"}} placeholder="Enter revision hash" type="text" defaultValue={rev1Name} value={rev1Name} onChange={(e)=>setRev1Name(e.target.value)}/>
            </div>

            <div style={{display:"flex", alignItems:"center", gap:"5px", paddingTop:"10px"}}>
                <div style={{display:"flex", alignItems:'center'}}>Revision 2:</div> 
                <input style={{width:"205px"}} placeholder="Enter revision hash" type="text" defaultValue={rev2Name} value={rev2Name} onChange={(e)=>setRev2Name(e.target.value)}/>
            </div>
            <hr style={{marginTop:"10px"}}/>
            <div style={{display:"flex",  gap:"5px", paddingTop:"10px"}}>
                <div style={{display:"flex",  minWidth:"67px"}}>Ratio:</div> 
                <div style={{minWidth:"191px", paddingLeft:"5px"}}>
                    <Slider handle={handle} min={0} max={100} defaultValue={rev1Percentage} />
                    <div style={{color:"#b5b5b5", padding:'5px', marginTop:"30px"}}>
                        Revision 1: {rev1Percentage}%
                    </div>
                    <div style={{color:"#b5b5b5", padding:'5px'}}>
                        Revision 2: {rev1Percentage !== 0? 100-rev1Percentage: 0}%
                    </div>
                </div>
            </div>
            <hr style={{marginTop:"10px"}}/>
            {err !== ""?
       <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
       {err}
   </div>
    :
    ""    
    }
            <div style={{ textAlign: "right" }}>
                <input onClick={() => {
                    setIsLoading(true)
                    updateTraffic(rev1Name, rev2Name, rev1Percentage).finally(()=> {setIsLoading(false)})
                }} type="submit" value="Save" />
            </div>
        </div>
        </LoadingWrapper>
    )
}