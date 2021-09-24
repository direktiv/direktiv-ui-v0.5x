import React, { useContext, useState, useEffect } from 'react'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { useParams } from 'react-router'
import { Link } from "react-router-dom"
import MainContext from '../../../context'
import {NoResults} from '../../../util-funcs'

export function EventsList(props) {
    const { fetch, namespace, handleError } = useContext(MainContext)
    const params = useParams()
    const [instances, setInstances] = useState(null)
    const [err, setErr] = useState("")

    useEffect(() => {
        async function fetchd() {
            try {
                let resp = await fetch(`/flow/namespaces/${namespace}/workflows/${params.workflow}/instances/`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.workflowInstances) {
                        setInstances(json.workflowInstances)
                    } else {
                        setInstances([])
                    }
                } else {
                    await handleError('fetch workflow instances', resp, 'listWorkflowInstances')
                }
            } catch (e) {
                setErr(`Unable to fetch workflow instances: ${e.message}`)
            }
        }
        if (instances === null) {
            fetchd()
        }
    }, [fetch, namespace, params.workflow, instances, handleError])

    return (
        <div>
            {
                err !== "" ?
                    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                        {err}
                    </div>
                    :
                    <ul style={{ margin: "0px" }}>
                        {instances !== null ?
                            <>
                                {instances.length > 0 ?
                                    <>
                                        {instances.map((obj) => {
                                            return (
                                                <Link key={obj.id} to={`/i/${obj.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                                                    <li style={{ cursor: "pointer" }} className="event-list-item">
                                                        <div>
                                                            <span><CircleFill className={obj.status} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                            <span>
                                                                {obj.id}
                                                            </span>
                                                        </div>
                                                    </li>
                                                </Link>
                                            )
                                        })}
                                    </>
                                    : <NoResults />}
                            </> : ""}
                    </ul>}
        </div>
    )
}

export function FuncComponent(props) {
    const {functions, namespace, workflow, setTypeOfRequest} = props
    
    console.log(functions, namespace, workflow, "COMPONENTS IN FUNC COMP")
    return(
      <div>
              <ul style={{margin:"0px"}}>
                {functions !== null ?
                    <>
                        {functions.length > 0 ?
                            <>
                                {functions.map((obj) => {

                                    let statusMessage = ""
                                    if(obj.conditions){
                                        for(var x=0; x < obj.conditions.length; x++) {
                                            statusMessage += `${obj.conditions[x].name}: ${obj.conditions[x].message}\n`
                                        }
                                    }
                                    console.log(`/n/${namespace}/explorer/${workflow}/service/${obj.serviceName}`)
                                    return(
                                        <li key={obj.info.name} title={statusMessage}  className="event-list-item">
                                           <Link style={{textDecoration:"none", color:"#4a4e4e"}} onClick={(()=>{
                                               setTypeOfRequest("")
                                           })} to={`/n/${namespace}/explorer/${workflow}/service/${obj.serviceName}`}>
                                                <div>
                                                    <span><CircleFill className={obj.status === "True" ? "success": "failed"} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                    <span>
                                                        {obj.info.name !== "" ? obj.info.name : obj.serviceName}({obj.info.image})
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </>
                            : <NoResults />}
                    </> : ""}
              </ul>
      </div>
    )
}