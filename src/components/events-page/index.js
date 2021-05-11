import React, { useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'

import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import MainContext from '../../context'
import { Link } from 'react-router-dom'
import { IoList } from 'react-icons/io5'
import {NoResults} from '../../util-funcs'
dayjs.extend(relativeTime);

export default function EventsPage() {
    const {namespace} = useContext(MainContext)
    return (

        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto" }}>
                <div className="shadow-soft rounded tile" style={{ flex: "auto" }}>
                    <TileTitle name="Instances">
                        <IoList />
                    </TileTitle>
                    <EventsPageBody />
                </div>
            </div>
        </div>: ""}
        </>
    )
}

export function EventsPageBody() {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const [instances, setInstances] = useState([])
    // const [forbidden, setForbidden] = useState(false)
    const [err, setErr] = useState("")

    useEffect(()=>{
        async function fetchI() {
            try{
                // fetch instances list
                let resp = await fetch(`/instances/${namespace}?limit=100`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    if(json.workflowInstances) {
                        setInstances(json.workflowInstances)
                    } else {
                        setInstances([])
                    }
                } else {
                    await handleError('fetch instances', resp, 'listInstances')
                }
            } catch(e) {
                setErr(`Failed to fetch instances: ${e.message}`)
            }
        }
        fetchI()
    },[namespace, fetch, handleError])

    return(
        <div id="events-table" style={{height:"90%", overflow:"auto"}}>
            {
                        err !== "" ? 
                        <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                        {err}
                    </div>:
            <>
            {instances.length > 0 ?
            <table style={{ width: "100%" }}>
                {/* <thead>
                    <tr>
                        <th>Status</th>
                        <th>Instance ID</th>
                        <th>Time</th>
                    </tr>
                </thead> */}
                <tbody>
                    {
                        instances.map((obj)=>{
                            return (
                                <Link key={obj.id} to={`/i/${obj.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                                    <tr className="event-list-item">
                                        <td style={{ textAlign: "center" }}><EventStatus status={obj.status} /></td>
                                        <td style={{ textAlign: "left" }}>{obj.id}</td>
                                        <td>{dayjs.unix(obj.beginTime.seconds).fromNow()}</td>
                                    </tr>
                                </Link>
                            )
                        })
                    }
                </tbody>
            </table> :
            <NoResults/>}
            </>}
        </div>
    )
}

function EventStatus(props) {

    let { status } = props;

    return(
        <CircleFill title={status} className={status.toLowerCase()} style={{ marginRight: "5px", marginTop: "4px" }} />
    )
}