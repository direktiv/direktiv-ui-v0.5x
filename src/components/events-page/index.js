

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
import LoadingWrapper from "../loading"
import { NamespaceInstances } from '../../api';

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
                    <div style={{maxHeight:"785px", overflow:"auto"}}>
                    <EventsPageBody />
                    </div>
                </div>
            </div>
        </div>: ""}
        </>
    )
}

export function EventsPageBody() {
    const {fetch, namespace, handleError} = useContext(MainContext)
    const [instances, setInstances] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [err, setErr] = useState("")

    useEffect(()=>{
        async function fetchI() {
            try{
                let instanceList = await NamespaceInstances(fetch, namespace, handleError)
                setInstances(instanceList)
            } catch(e) {
                setErr(`Failed to fetch instances: ${e.message}`)
            }
        }
        fetchI().finally(()=> {setIsLoading(false)})
    },[namespace, fetch, handleError])

    return(
        <LoadingWrapper isLoading={isLoading} text={"Loading Instance List"}>
            <div id="events-table" style={{overflow:"auto"}}>
                {
                            err !== "" ? 
                            <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                            {err}
                        </div>:
                <>
                {instances.length > 0 ?
                <table style={{ width: "100%", padding:"10px" }}>
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
                                    <Link key={obj.node.id} to={`/n/${namespace}/i/${obj.node.id}`} style={{ display: "contents", color: "inherit", textDecoration: "inherit" }}>
                                        <tr className="event-list-item">
                                            <td style={{ textAlign: "center" }}><EventStatus status={obj.node.status} /></td>
                                            <td style={{ textAlign: "left" }}>{obj.node.as}</td>
                                            <td>{dayjs.utc(obj.node.createdAt).local().fromNow()}</td>
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
        </LoadingWrapper>
    )
}

function EventStatus(props) {

    let { status } = props;

    return(
        <CircleFill title={status} className={status.toLowerCase()} style={{ marginRight: "5px", marginTop: "4px" }} />
    )
}