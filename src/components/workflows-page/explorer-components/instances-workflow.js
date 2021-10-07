import { WorkflowInstances } from "../api"
import React, { useContext, useState, useEffect } from 'react'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { Link } from "react-router-dom"
import MainContext from '../../../context'
import {NoResults} from '../../../util-funcs'

import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
export function WorkflowInstanceList(props) {
    const {workflow} = props
    const { fetch, namespace, handleError } = useContext(MainContext)
    const [instances, setInstances] = useState(null)
    const [err, setErr] = useState("")

    useEffect(() => {
        async function getInstances() {
            try {
                let instances = await WorkflowInstances(fetch, namespace, workflow, handleError)
                setInstances(instances)
            } catch(e) {
                setErr(e.message)
            }
        }
        if (instances === null) {
            getInstances()
        }
    }, [fetch, namespace, workflow, handleError, instances])

    return (
        <div>
            {
                err !== "" ?
                    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                        {err}
                    </div>
                    :
                    <ul style={{ margin: "0px", width: "100%" }}>
                        {instances !== null ?
                            <>
                                {instances.length > 0 ?
                                    <>
                                        {instances.map((obj) => {
                                            return (
                                                <Link key={obj.node.id} to={`/n/${namespace}/i/${obj.node.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                                                    <li style={{ cursor: "pointer" }} className="event-list-item">
                                                        <div>
                                                            <span><CircleFill className={obj.node.status} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                                                            <span style={{width:"150px"}}>
                                                                {obj.node.as}
                                                            </span>
                                                            <span>
                                                                {dayjs.utc(obj.node.createdAt).local().fromNow()}
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
