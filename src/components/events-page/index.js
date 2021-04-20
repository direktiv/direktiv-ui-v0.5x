import React, { useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import './style.css'

import * as dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";

import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import MainContext from '../../context'
import { useHistory } from 'react-router'
import { IoList } from 'react-icons/io5'
import { sendNotification } from '../notifications'

dayjs.extend(relativeTime);

export default function EventsPage() {
    return (
        <>
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
        </div>
        </>
    )
}

export function EventsPageBody() {
    const {fetch, namespace} = useContext(MainContext)
    const history = useHistory()
    const [instances, setInstances] = useState([])

    useEffect(()=>{
        async function fetchI() {
            try{
                // fetch instances list
                let resp = await fetch(`/instances/${namespace}`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    setInstances(json.workflowInstances)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                sendNotification("Failed to fetch instances", e.message, 0)
            }
        }
        fetchI()
    },[namespace, fetch])

    return(
        <div id="events-table">
            <table style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Instance ID</th>
                        <th>Time</th>

                        {/* <th>Actions</th> */}
                    </tr>
                </thead>
                <tbody>
                    {
                        instances.map((obj)=>{
                            return(
                                <>
                                    <tr onClick={()=>{history.push(`/i/${obj.id}`)}} className="event-list-item">
                                        <td style={{ textAlign: "center" }}><EventStatus status={obj.status} /></td>
                                        <td>{obj.id}</td>
                                        <td>{dayjs.unix(obj.beginTime.seconds).fromNow()}</td>
                                        {/* <td></td> */}
                                    </tr>
                                </>
                            )
                        })
                    }
                </tbody>
            </table>
        </div>
    )
}

function EventStatus(props) {

    let { status } = props;

    return(
        <CircleFill title={status} className={status.toLowerCase()} style={{ marginRight: "5px", marginTop: "4px" }} />
    )
}