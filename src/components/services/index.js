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

import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
export default function Services() {
    const {fetch} = useContext(MainContext)
    let { service } = useParams();
    const [srvice, setService] = useState(null)
    const [traffic, setTraffic] = useState(null)

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
                    console.log("Handle resp not being ok", resp)
                }
            } catch(e) {
                console.log("TODO handle err get service", e)
            }
        }
        if (srvice === null) {
            getServices()
        }
    },[service])

    useEffect(()=>{
        getService()    
    },[service])

    return(
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto" }}>
                <div className="container" style={{ flexDirection: "column", flex:"auto", maxWidth: "400px"}}>
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Edit revision usage">
                             <IoClipboardSharp />
                        </TileTitle>
                        {
                            traffic !== null ?
                            <EditRevision traffic={traffic} fetch={fetch} getService={getService} service={service}/>
                            :
                            ""
                        }
                    </div>
                    <div className="shadow-soft rounded tile" style={{  maxWidth: "400px" }}>
                        <TileTitle name="Create revision">
                             <IoAdd />
                        </TileTitle>
                        <CreateRevision fetch={fetch} getService={getService} service={service}/>
                    </div>
                </div>
                <div className="shadow-soft rounded tile" style={{ flex: 2 }}>
                    <TileTitle name={`Revisions for ${service}`}>
                        <IoList />
                    </TileTitle>
                    {srvice !== null ? 
                        <ListRevisions revisions={srvice.revisions}/>
                        :
                        ""
                    }
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
    const {service, getService, fetch} = props

    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")

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
                getService()
            } else {
                console.log('handle create revision resp not ok todo', resp)
            }
        } catch(e) {
            console.log("todo create revision", e)
        }
    }


    return(
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
                            <input value={size}  onChange={(e) => setSize(e.target.value)} type="text" placeholder="Size" />
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
        <div style={{ textAlign: "right" }}>
            <input type="submit" value="Create Service" onClick={() => { createRevision() }} />
        </div>
    </div>
    )
}

function EditRevision(props) {
    const {traffic, fetch, service, getService} = props

    const [rev1Name, setRev1Name] = useState(traffic[0]? traffic[0].name: "")
    const [rev2Name, setRev2Name] = useState(traffic[1]? traffic[1].name: "")

    const [rev1Percentage, setRev1Percentage] = useState(traffic[0]? traffic[0].value: 0)


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
                getService()
            } else {
                console.log("todo handle traffic update", resp)
            }
        } catch(e) {
            console.log("todo handle err update traffic", e)
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
        <div style={{fontSize:"14px"}}>
            <div style={{display:"flex", alignItems:"center", gap:"5px"}}>
                <div style={{display:"flex", alignItems:'center'}}>Revision 1:</div> 
                <input style={{width:"205px"}} type="text" defaultValue={rev1Name} value={rev1Name} onChange={(e)=>setRev1Name(e.target.value)}/>
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
            <div style={{ textAlign: "right" }}>
                <input onClick={() => {updateTraffic(rev1Name, rev2Name, rev1Percentage)}} type="submit" value="Save" />
            </div>
        </div>
    )
}