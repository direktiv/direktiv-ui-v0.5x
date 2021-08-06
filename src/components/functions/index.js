import React, { useCallback, useContext, useEffect, useState} from 'react'
import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { IoAdd, IoList, IoTrash} from 'react-icons/io5'
import {NoResults} from '../../util-funcs'
import { ConfirmButton } from '../confirm-button'

import Breadcrumbs from '../breadcrumbs'
import MainContext from '../../context'
import LoadingWrapper from "../loading"
import { Link, useHistory, useParams } from 'react-router-dom'
import { Accordion, AccordionItem, AccordionItemButton, AccordionItemHeading, AccordionItemPanel } from 'react-accessible-accordion'

export default function Functions() {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const params = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [functions, setFunctions] = useState(null)
    const [fetchServiceErr, setFetchServiceErr] = useState("")

    const fetchServices = useCallback(()=>{
        async function fetchFunctions() {
            let body = {
                scope: "g"
            }
            if(params.namespace) {
                body.scope = "ns"
                body["namespace"] = params.namespace
            }
            try {
                let resp = await fetch(`/functions/`, {
                    method: "POST",
                    body: JSON.stringify(body)
                })
                if(resp.ok) {
                    let arr = await resp.json()
                    if (arr.length > 0) {
                        setFunctions(arr)
                    } else {
                        setFunctions([])
                    }
                } else {
                    await handleError('fetch services', resp, 'listServices')
                }
            } catch(e) {
                setFetchServiceErr(`Error fetching services: ${e.message}`)
            }
        }
        console.log("namespace", namespace)
        return fetchFunctions()
    },[functions])

    useEffect(()=>{
        if (functions === null) {
            fetchServices().finally(()=> {setIsLoading(false)}) 
        }
    },[])
    return(
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto" }}>
                <div className="shadow-soft rounded tile" style={{ flex: 3, flexGrow: "2", maxWidth: "1100px" }}>
                    <TileTitle name="Knative function services">
                        <IoList />
                    </TileTitle>
                    <LoadingWrapper isLoading={isLoading} text={"Loading Functions List"}>
                    <div style={{maxHeight:"785px", overflow:"visible"}}>
                        {fetchServiceErr !== "" ?
                        <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                            {fetchServiceErr}
                        </div>
                        :
                        <>
                        {functions !== null ?
                                    <>
                                        {functions.length > 0 ?
                                            <div >
                                            <Accordion>
                                                {functions.map((obj) => {
                                                    return (
                                                        <KnativeFunc fetch={fetch} fetchServices={fetchServices} serviceName={obj.serviceName} namespace={params.namespace} size={obj.info.size} workflow={obj.info.workflow} image={obj.info.image} cmd={obj.info.cmd} name={obj.info.name} status={obj.status} statusMessage={obj.statusMessage}/>
                                                    )
                                                })}
                                            </Accordion>
                                            </div>
                                            : <NoResults />}
                                    </> : ""}
                        </>}
                    </div>
                    </LoadingWrapper>
                </div>
                <div className="container" style={{  flex: 1 }}>
                    <div className="shadow-soft rounded tile" style={{ minWidth: "350px" }}>

                        <TileTitle name="Create knative service">
                            <IoAdd />
                        </TileTitle>
                        <div style={{maxHeight:"785px", overflow:"auto"}}>
                            <CreateKnativeFunc handleError={handleError} fetchServices={fetchServices} namespace={params.namespace} fetch={fetch}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

function CreateKnativeFunc(props) {
    const {fetch, namespace, fetchServices, handleError} = props
    const [err, setErr] = useState("")
    const [name, setName] = useState("")
    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const createService = async () => {
        try {
            let body = {
                name: name,
                image: image,
                minScale: parseInt(scale),
                size: parseInt(size),
                cmd: cmd,
            }
            if (namespace) {
                body["namespace"] = namespace
            }
            let resp = await fetch(`/functions/new`, {
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
                await fetchServices()
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
            <div style={{display:"flex", alignItems:"center" }}>
            <table style={{flex: 1}}>
                <tbody>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Name:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={name}  onChange={(e) => setName(e.target.value)} type="text" placeholder="Service name" />
                        </td>
                    </tr>
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
        <hr/>
        {err !== ""?
       <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
       {err}
   </div>
    :
    ""    
    }
        <div style={{ textAlign: "right", padding:"5px" }}>
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
    const history = useHistory()

    const {fetch, name, size, fetchServices, workflow, serviceName, namespace, image, cmd, status, statusMessage} = props

    const deleteService = async () => {
        try {
            let resp = await fetch(`/functions/${serviceName}`, {
                method:"DELETE"
            })
            if (resp.ok) {
                fetchServices()
            } else {
                console.log(resp, "handle delete service resp")
            }
        } catch(e) {
            console.log(e, "handle delete service")
        }
    }


    let panelID = name;
    function toggleItem(){
        let x = document.getElementById(panelID);
        x.classList.toggle("expanded");
    }

    return(
        
        <div id={panelID} className="neumorph-hover" style={{marginBottom: "10px"}} onClick={() => {
            toggleItem();
        }}>
            <div className="services-list-div ">
                <div>
                    <div style={{display: "inline"}}>
                        <CircleFill className={status === "True" ? "success":"failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
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
                        <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
                            ev.preventDefault();
                            if (namespace !== undefined) {
                                history.push(`/${namespace}/functions/${serviceName}`)
                            } else {
                                history.push(`/functions/global/${serviceName}`)
                            }
                        }}>
                            <IoList/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="services-list-contents">
            <div className="service-list-item-panel" style={{fontSize:'14px'}}>
                     <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
                         <div style={{flex: 1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
                             <p><b>Image:</b> {image}</p>
                         </div>
                         <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
                             <p><b>Status:</b> {status}</p>
                             {statusMessage !== undefined ? <p><b>Message:</b> {statusMessage}</p> : "" }
                         </div>
                     </div>
                 </div>
            </div>
        </div>

        // <AccordionItem>
        //     <AccordionItemHeading>
        //         <AccordionItemButton>
        //             <div className="service-list-item" style={{fontSize:"16px", padding:"10px", borderRadius:"10px", textAlign:"left"}}>
        //                 <div style={{display:'flex', alignItems:"center"}}>

        //                 <div style={{maxWidth:"100px"}}>
        //                    <CircleFill className={status === "True" ? "success":"failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
        //                 </div>
        //                 <div style={{flex:"auto"}}>
        //                  <b>{name}</b> <i style={{fontSize:"12px"}}>{image}</i>
        //                 </div>
        //                 <div style={{minWidth:"200px", display:"flex", justifyContent:"flex-end", gap:"10px"}}>
        //                     <div style={{position:"relative"}} title="Delete Service">
        //                         <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
        //                             ev.preventDefault()
        //                             deleteService()
        //                         }} /> 
        //                     </div>
        //                     <div title="View Services" >
        //                         <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
        //                             ev.preventDefault();
        //                             if (namespace !== undefined) {
        //                                 history.push(`/${namespace}/functions/${serviceName}`)
        //                             } else {
        //                                 history.push(`/functions/global/${serviceName}`)
        //                             }
        //                         }}>
        //                             <IoList/>
        //                         </div>
        //                     </div>
        //                 </div>
        //                 </div>

        //             </div>
        //         </AccordionItemButton>
        //     </AccordionItemHeading>
        //     <AccordionItemPanel>
        //         <div className="service-list-item-panel" style={{fontSize:'14px'}}>
        //             <div style={{display:"flex", flexDirection:"row", width:"100%"}}>
        //                 <div style={{flex: 1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
        //                     <p><b>Image:</b> {image}</p>
        //                 </div>
        //                 <div style={{flex:1, textAlign:"left", padding:"10px", paddingTop:"0px"}}>
        //                     <p><b>Status:</b> {status}</p>
        //                     {statusMessage !== undefined ? <p><b>Message:</b> {statusMessage}</p> : "" }
        //                 </div>
        //             </div>
        //         </div>
        //     </AccordionItemPanel>
        // </AccordionItem>
    )
}