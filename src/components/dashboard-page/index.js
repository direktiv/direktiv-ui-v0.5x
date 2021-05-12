import React, { useContext, useState,  useEffect } from 'react'
import MainContext from '../../context'
import { useParams } from 'react-router'
import PieChart from '../charts/pie'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import { IoCodeSlashOutline, IoEllipse, IoList } from 'react-icons/io5'
import {EventsPageBody} from '../events-page'



export default function DashboardPage() {
    // const [instances, setInstances] = useState(null)
    const [metrics, setMetrics] = useState(null)
    const {fetch, namespace, namespaces, handleError} = useContext(MainContext)
    const params = useParams()
    // const [forbidden, setForbidden] = useState(false)
    const [err, setErr] = useState("")
    
    useEffect(()=>{
        async function fetchMet() {
            let pieColors = {
                complete: "#2fa64d",
                failed: "#db3447",
                pending: "#ffbf32",
                crashed: "#4a4e4e",
                cancelled: "#7e7e7e"
            }
            try {
                let resp = await fetch(`/instances/${params.namespace}?limit=50000`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()

                    let statusMap = {};
                    if (json.workflowInstances) {
                        for(let x=0; x < json.workflowInstances.length; x++) {
                            if(!statusMap[json.workflowInstances[x].status]) {
                                statusMap[json.workflowInstances[x].status] = 0
                            }
                            statusMap[json.workflowInstances[x].status] += 1
                        }
                    }
                    let data = [];
                    
                    Object.keys(statusMap).forEach(function(k, v) {
                        data.push({
                            title: k,
                            value: statusMap[k],
                            color: pieColors[k]
                        })
                    })

                    // setInstances(json)
                    setMetrics(data)
                } else {
                        await handleError('fetch metrics', resp, 'listInstances')
                }
            } catch(e) {
                setErr(`Failed to fetch metrics for workflow: ${e.message}`)
            }
        }
        if(metrics === null && namespace !== "") {
            fetchMet()
        }

    },[fetch, params.workflow, metrics, params.namespace, namespace, handleError, namespaces])


    return (
        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs dashboard={true} elements={["Dashboard"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "auto", minWidth: "300px", maxWidth: "400px", maxHeight: "400px" }}>
                    <TileTitle name="Recent Workflows">
                        <IoCodeSlashOutline />
                    </TileTitle>
                    {
                        err === "" ? 
                            <DashboardTotalExecutions metrics={metrics} />
                            :
                            <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                            {err}
                        </div>
                    }
                </div>
                <div className="shadow-soft rounded tile" style={{  flex: "auto", flexGrow: "1", maxHeight: "400px",  marginBottom:"10px" }}>
                    <TileTitle name="Events">
                        <IoList />
                    </TileTitle>
                    <div style={{maxHeight:"365px", overflow:"hidden"}}>
                        <EventsPageBody />
                    </div>
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }}>
            </div>
        </div>
        :
    
    ""}
        </>
    )
}


function DashboardTotalExecutions(props) {

    let { metrics } = props;
    if (metrics && metrics.length > 0) {


        return (
            <div>
                <PieComponent metrics={metrics} />
                <div className="container" style={{ justifyContent: "center", flexDirection: "row", marginTop: "20px", alignItems: "center", fontSize: "10pt", flexWrap: "wrap" }}>
                  {        metrics.map((obj, i) => {
            return(<div className="shadow-soft tile" key={i} style={{ display: "flex", maxWidth: "150px", borderRadius: ".55rem" }} >
                <div style={{ marginRight: "5px", display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <IoEllipse className={obj.title} style={{ marginTop: "2px", marginRight: "5px" }} />
                    <span>
                        {obj.title}
                    </span>
                </div>
                <div>
                    ({obj.value})
                </div>
            </div>)
        })}
                </div>
            </div>
        )
    } 

    return (
        <div className="container" style={{ fontSize: "11pt", height: "80%", flexDirection: "column", alignItems: "center" }}>
            <div>
                No workflows have been executed recently!
            </div>
        </div>
    )
}

function PieComponent(props) {

    let { metrics } = props;

    if (metrics === null) {
        return ""
    }
    return(
        <PieChart lineWidth={40} data={metrics} />
    )
}