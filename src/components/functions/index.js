import React, { useCallback, useContext, useEffect, useState} from 'react'
import TileTitle from '../tile-title'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { IoAdd, IoList} from 'react-icons/io5'
import {NoResults} from '../../util-funcs'

import Breadcrumbs from '../breadcrumbs'
import MainContext from '../../context'
import { Link } from 'react-router-dom'

export default function Functions() {
    const {fetch, namespace} = useContext(MainContext)
    console.log('hello functions component')
    const [functions, setFunctions] = useState(null)

    const fetchServices = useCallback(()=>{
        async function fetchFunctions() {
            try {
                let resp = await fetch(`/functions/`, {
                    method: "POST",
                    body: JSON.stringify({
                        namespace: namespace,
                        scope: "ns",
                    })
                })
                if(resp.ok) {
                    let arr = await resp.json()
                    if (arr.length > 0) {
                        setFunctions(arr)
                    } else {
                        setFunctions([])
                    }
                } else {
                    console.log(resp, "HANDLE resp is not ok")
                    // await handleError('fetch knative functions', resp, "fetchKnativeFunctions")
                }
            } catch(e) {
                console.log(e, "TODO Handle error")
            }
        }
        console.log("namespace", namespace)
        fetchFunctions()
    },[namespace, functions])

    useEffect(()=>{
        if (namespace !== "" && functions === null) {
            fetchServices()
        }
    },[])
    return(
        <>
        {namespace !== "" ?
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
                    <div style={{maxHeight:"785px", overflow:"auto"}}>
                        <table style={{fontSize:'12px', width:"100%"}}>
                            <thead>
                                <tr>
                                    <th>status</th>
                                    <th>name</th>
                                    <th>message</th>
                                    <th>used by</th>
                                    <th>image</th>
                                    {/* <th>cmd</th>
                                    <th>size</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                    {functions !== null ?
                                    <>
                                        {functions.length > 0 ?
                                            <>
                                                {functions.map((obj) => {
                                                    return (
                                                        <KnativeFunc fetch={fetch} fetchServices={fetchServices} serviceName={obj.serviceName} namespace={namespace} size={obj.info.size} workflow={obj.info.workflow} image={obj.info.image} cmd={obj.info.cmd} name={obj.info.name} status={obj.status} statusMessage={obj.statusMessage}/>
                                                    )
                                                })}
                                            </>
                                            : <NoResults />}
                                    </> : ""}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="container" style={{  flex: 1 }}>
                    <div className="shadow-soft rounded tile" style={{ minWidth: "350px" }}>

                        <TileTitle name="Create knative service">
                            <IoAdd />
                        </TileTitle>
                        <div style={{maxHeight:"785px", overflow:"auto"}}>
                            <CreateKnativeFunc fetchServices={fetchServices} namespace={namespace} fetch={fetch}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>: ""}
        </>
    )
}

function CreateKnativeFunc(props) {
    const {fetch, namespace, fetchServices} = props
    const [name, setName] = useState("")
    const [image, setImage] = useState("")
    const [scale, setScale] = useState(0)
    const [size, setSize] = useState(0)
    const [cmd, setCmd] = useState("")

    const createService = async () => {
        try {
            let resp = await fetch(`/functions/new`, {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    image: image,
                    minScale: parseInt(scale),
                    size: parseInt(size),
                    cmd: cmd,
                    namespace: namespace,
                })
            })
            if (resp.ok) {
                // fetch functions
                fetchServices()
            } else {
                console.log('handle resp not ok, createService', resp)
            }
        } catch(e) {
            console.log('handle todo err, createservice', e)
        }
    }
    return(
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
        <div style={{ textAlign: "right" }}>
            <input type="submit" value="Create Service" onClick={() => { createService() }} />
        </div>
    </div>
    )
}

function KnativeFunc(props) {
    console.log(props)
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

    return(
        <tr>
            <Link  key={serviceName} to={`/${namespace}/functions/${serviceName}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                <td>
                    <CircleFill className={status === "True" ? "success":"failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} />
                </td> 
                <td>
                    {name}
                </td>
                <td>
                    {statusMessage !== "" ? statusMessage : <>{status === "True" ? "Service is currently available" : "Service is currently unavailable"}</>}
                </td>
                <td>
                    <Link to={`/${namespace}/w/${workflow}`}>
                        {workflow}
                    </Link>
                </td>
                <td>
                    {image}
                </td>
                <td >
                    <div onClick={(e)=>{
                        e.preventDefault()
                        deleteService()
                    }} style={{zIndex:100}}>Delete me</div>
                </td>
                {/* <td>
                    {cmd}
                </td>
                <td>
                    {size}
                </td> */}
            </Link>
        </tr>
    )
}