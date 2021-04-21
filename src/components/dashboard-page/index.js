import React, { useContext, useState, useCallback, useEffect } from 'react'
import MainContext from '../../context'
import { useParams } from 'react-router'
import {sendNotification} from '../notifications/index.js'
import PieChart from '../charts/pie'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import { IoBarChartSharp, IoCodeSlashOutline, IoEllipse, IoList } from 'react-icons/io5'
import {EventsPageBody} from '../events-page'

export default function DashboardPage() {

    const [instances, setInstances] = useState(null)
    const [metrics, setMetrics] = useState(null)
    const {fetch, namespace} = useContext(MainContext)
    const params = useParams()

    let pieColors = {
        complete: "#2fa64d",
        failed: "#db3447",
        pending: "#ffbf32",
        crashed: "#4a4e4e"
    }

    useEffect(()=>{
        async function fetchMet() {
            try {
                let resp = await fetch(`/instances/${namespace}`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()

                    let statusMap = {};
                    if (json.workflowInstances) {
                        json.workflowInstances.map((obj) => {
                            if (!statusMap[obj.status]) {
                                statusMap[obj.status] = 0
                            }
                            statusMap[obj.status] += 1 
                        })
                    }

                    let data = [];
                    
                    Object.keys(statusMap).forEach(function(k, v) {
                        data.push({
                            title: k,
                            value: statusMap[k],
                            color: pieColors[k]
                        })
                    })

                    setInstances(json)
                    setMetrics(data)
                } else {
                    throw new Error( await resp.text())
                }
            } catch(e) {
                sendNotification(`Failed to fetch metrics for workflow`, e.message, 0)
            }
        }
        if(metrics === null) {
            fetchMet()
        }
    },[fetch, namespace, params.workflow, metrics])

    return (
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs dashboard={true} elements={["Dashboard"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                {/* <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "2", minWidth: "300px", maxHeight: "400px"}}>
                    <TileTitle name="Top Workflows">
                        <IoBarChartSharp />
                    </TileTitle>
                    <TopWorkflows instances={instances} />
                </div> */}
                <div className="shadow-soft rounded tile" style={{ flex: "auto", minWidth: "300px", maxWidth: "400px", maxHeight: "400px" }}>
                    <TileTitle name="Recent Workflows">
                        <IoCodeSlashOutline />
                    </TileTitle>
                    <DashboardTotalExecutions metrics={metrics} />
                </div>
                <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "1", maxHeight: "400px" }}>
                    <TileTitle name="Events">
                        <IoList />
                    </TileTitle>
                    <EventsPageBody />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }}>
            </div>
        </div>
        </>
    )
}

function TopWorkflows(props) {

    let { instances } = props;
    console.log(instances);

    let workflowsMap = {};
    if (instances) {
        if (instances.workflowInstances) {
            instances.workflowInstances.map((obj) => {
                let x = obj.id.split("/");
                let wfName = x[1];
    
                if (!workflowsMap[wfName]) {
                    workflowsMap[wfName] = 0;
                }
    
                workflowsMap[wfName] += 1;
            })
        }
    }

    let datasource = {
        chart: {
            theme: "fusion"
        },
        data: []
    };

    Object.keys(workflowsMap).forEach(function(k, v) {
        datasource.data.push({
            label: k,
            value: workflowsMap[k]
        })
    })

    return(
        <div style={{ overflowY: "hidden" }}>
            
        </div>
    )
}

function DashboardTotalExecutions(props) {

    let { metrics } = props;
    let rows = [];

    let x = 0;
    if (metrics && metrics.length > 0) {
        metrics.map((obj, i) => {
            rows.push(<div className="shadow-soft tile" key={i} style={{ display: "flex", maxWidth: "150px", borderRadius: ".55rem" }} >
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
        })

        return (
            <div>
                <PieComponent metrics={metrics} />
                <div className="container" style={{ justifyContent: "center", flexDirection: "row", marginTop: "20px", alignItems: "center", fontSize: "10pt", flexWrap: "wrap" }}>
                    {rows}
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