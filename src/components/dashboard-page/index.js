import React, { useContext, useState,  useEffect} from 'react'
import MainContext from '../../context'
// import PieChart from '../charts/pie'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { IoCodeSlashOutline, IoList, IoTerminal } from 'react-icons/io5'
import {EventsPageBody} from '../events-page'
import NamespaceLogs from './namespace-logs'
import { ResponsiveContainer, Pie, PieChart, Tooltip, Cell, Label } from 'recharts'
import LoadingWrapper from '../loading'


export default function DashboardPage() {
    const {fetch, namespace, handleError} = useContext(MainContext)

    return(
        <>
            {namespace !== "" ?
                <div className="container" style={{ flex: "auto", padding: "10px" }}>
                    <div className="container">
                        <div style={{ flex: "auto" }}>
                            <Breadcrumbs dashboard={true} elements={["Dashboard"]} />
                        </div>
                    </div>
                    <div className="container" style={{ flexDirection: "row", flexWrap: "wrap"}}>
                        <Logs />
                        <Events />
                    </div>
                    <div className="container" style={{ flexDirection:"row", flexWrap:"wrap", flexGrow:1}}>
                        <TotalWorkflows fetch={fetch} namespace={namespace} handleError={handleError} />
                        <SuccessOrFailedWorkflows fetch={fetch} namespace={namespace} handleError={handleError} />
                        <TotalTimeWorkflows fetch={fetch} namespace={namespace} handleError={handleError} />
                    </div>
                </div>
                :
                ""
            }
        </>
    )
}

function TotalTimeWorkflows(props) {
    const {fetch, namespace, handleError} = props
    const [isLoading, setIsLoading] = useState(true)

    const [timeMetrics, setTimeMetrics] = useState([])
    const [totalTime, setTotalTime] = useState(0)
    const [oname, setOName] = useState("")
    const [err, setErr] = useState("")
    // fetch the first time
    useEffect(()=>{
        async function getDetails() {
            try{
                let resp = await fetch(`/namespaces/${namespace}/metrics/milliseconds`, {})
                if(resp.ok){
                    let json = await resp.json()
                    let arr = []
                    let total = 0
                    for(let i=0; i < json.results.length; i++) {
                        // create a key array for each line
                        arr.push({name: json.results[i].metric.workflow, value: parseInt(json.results[i].value[1])/1000})
                        total += parseInt(json.results[i].value[1])/1000
                    }

                    setTimeMetrics(arr)
                    setTotalTime(total)
                    setOName(namespace)
                } else {
                    await handleError('get workflow time metrics', resp, 'getMetrics')
                }
            } catch(e) {
                setErr(e.message)
            }
        }    
        if(isLoading || oname !== namespace){
            getDetails().finally(()=> {setIsLoading(false)})       
        }
    },[fetch, isLoading, namespace, oname, handleError])
    let colors = ["#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#29b6f6", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"]

    return(
        <div className="shadow-soft rounded tile" style={{ flex: 1,   marginBottom:"10px" }}>
            <TileTitle name="Average Execution Time">
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Total Time Workflow Metrics"}>
                {err !== "" ?
                <ErrorComp error={err}/>
                :
                    <div className="piechart-wrapper" style={{height: "100%"}}>
                        <div style={{ height: "300px", width: "300px" }}>
                            {timeMetrics.length > 0 ?
                                <ResponsiveContainer width="98%">
                                    <PieChart>
                                        <Pie
                                            nameKey="name"
                                            innerRadius={70}
                                            paddingAngle={5}
                                            // label={renderLabel}
                                            data={timeMetrics}
                                        >
                                            <Label style={{ fontSize: "20pt" }} value={`${Math.round(totalTime)}s`} position="center" />
                                            {timeMetrics.map((entry, index) => (
                                                <Cell className="pie-sect" key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer> :
                                <NoMetrics />}
                        </div>
                    </div>
                }                
            </LoadingWrapper>
        </div>
    )
}

export function SuccessOrFailedWorkflows(props) {
    const {fetch, namespace, workflow, handleError} = props

    const [isLoading, setIsLoading] = useState(true)
    const [percentage, setPercentage] = useState(0)
    const [sWorkflowMetrics, setSWorkflowMetrics] = useState([])
    const [oname, setOName] = useState("")
    const [err, setErr] = useState("")
    
    useEffect(()=>{
        async function fetchDetails() {
            try{
                let failedURL = `/namespaces/${namespace}/metrics/failed`
                let successURL = `/namespaces/${namespace}/metrics/successful`
                if (workflow){
                    failedURL = `/namespaces/${namespace}/tree/${workflow}?op=metrics-failed`
                    successURL = `/namespaces/${namespace}/tree/${workflow}?op=metrics-successful`
                }

                let failedResp = await fetch(failedURL,{})
                let successResp = await fetch(successURL,{})
                
                if(failedResp.ok && successResp.ok) {
                    let successJson = await successResp.json()
                    let failedJson = await failedResp.json()

                    let arr = [{
                        name: "success",
                        value: 0
                    }, {
                        name: "failed",
                        value: 0
                    }]
                    
                    for(let i=0; i < successJson.results.length; i++) {
                        arr[0].value = arr[0].value + parseInt(successJson.results[i].value[1]) 
                    }

                    for(let i=0; i < failedJson.results.length; i++) {
                        arr[1].value = arr[1].value + parseInt(failedJson.results[i].value[1])
                    }
                    let total = arr[0].value + arr[1].value

                    let perc = (arr[0].value / total) * 100
                    setPercentage(Math.ceil(perc))

                    if (successJson.results.length > 0 || failedJson.results.length > 0) {
                        setSWorkflowMetrics(arr)
                    } else {
                        setSWorkflowMetrics([])
                    }
                    setOName(namespace)
                } else {
                    if(!failedResp.ok){
                        if (workflow) {
                            await handleError('get workflow successful and failed metrics', failedResp, 'getMetrics')
                        } else {
                            await handleError('get workflow successful and failed metrics', failedResp, 'getMetrics')
                        }
                    } else if (!successResp.ok) {
                        if (workflow) {
                            await handleError('get workflow successful and failed metrics', successResp, 'getMetrics')
                        } else {
                            await handleError('get workflow successful and failed metrics', successResp, 'getMetrics')
                        }           
                    }
                }
            } catch(e) {
                setErr(e.message)
            }
        }
        if(isLoading || oname !== namespace) {
            fetchDetails().finally(()=> {setIsLoading(false)})    
        }
    },[fetch, isLoading, namespace, workflow, oname, handleError])

    let colors = ["#2fa64d", "#db3447"]

    return(
        <div className="shadow-soft rounded tile" style={{ flex: workflow?"none":1, marginBottom:"10px", minHeight:"300px" }}>
            <TileTitle name={workflow? `Workflow Success Rate`:"Workflows Success Rate"}>
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Success Workflow Metrics"}>
                {err !== "" ? 
                <ErrorComp error={err}/>
                :
                    <div className="piechart-wrapper" style={{height: workflow ? "250px" : "100%"}}>
                        <div style={{ height: workflow ? "250px" : "300px", width: workflow ? "250px" : "300px" }}>
                            {sWorkflowMetrics.length > 0 ?
                                <ResponsiveContainer width="98%">
                                    <PieChart>
                                        <Pie
                                            innerRadius={workflow ? 55 : 70}
                                            nameKey="name"
                                            // label={renderLabel}
                                            paddingAngle={5}
                                            data={sWorkflowMetrics}
                                        >
                                            <Label style={{ fontSize: "20pt" }} value={`${percentage}%`} position="center" />
                                            {sWorkflowMetrics.map((entry, index) => (
                                                <Cell className="pie-sect" key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                : <NoMetrics />}
                        </div>
                    </div>
}
            </LoadingWrapper>
        </div>
    )
}

function TotalWorkflows(props) {
    const {fetch, namespace, handleError} = props

    const [isLoading, setIsLoading] = useState(true)
    const [invokedWorkflows, setInvokedWorkflows] = useState([])
    const [tWorkflowMetrics, setTWorkflowMetrics] = useState([])
    const [oname, setOName] = useState("")
    const [err, setErr] = useState("")

    let colors = ["#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#29b6f6", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"]

    useEffect(()=>{
        async function fetchDetails() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/metrics/invoked`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let arr = []
                    let arrTotal = [{
                        name: "total",
                        value: 0
                    }]
                    for(let i=0; i < json.results.length; i++) {
                        // i think prometheus gives it back as timestamp, value for the value object
                        arr.push(
                            {
                                name: json.results[i].metric.workflow,
                                value: parseInt(json.results[i].value[1])
                            }
                        )

                        arrTotal[0].value = arrTotal[0].value + parseInt(json.results[i].value[1])
                    }
                    setOName(namespace)
                    setTWorkflowMetrics(arr)
                    setInvokedWorkflows(arrTotal[0].value)
                } else {
                    await handleError('get total workflow metrics', resp, 'getMetrics')
                }
            } catch(e) {
                setErr(e.message)
            }
        }
        if(isLoading || oname !== namespace) {
            fetchDetails().finally(()=> {setIsLoading(false)})    
        }
    },[oname, fetch, namespace, isLoading, handleError])

    return(
        <div className="shadow-soft rounded tile" style={{ marginBottom:"10px", flex: 1}}>
            <TileTitle name="Workflows Invoked">
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Total Workflow Metrics"}>
                {err !== "" ?
                    <ErrorComp error={err} /> 
                :
                    <div className="piechart-wrapper" style={{height: "100%"}}>
                        <div style={{ height: "300px", width: "300px" }}>
                            {tWorkflowMetrics.length > 0 ?
                                <ResponsiveContainer width="98%">
                                    <PieChart>
                                        <Pie
                                            innerRadius={70}
                                            nameKey="name"
                                            // label={renderLabel}
                                            paddingAngle={5}
                                            data={tWorkflowMetrics}
                                        >
                                            <Label style={{ fontSize: "20pt" }} value={invokedWorkflows} position="center" />
                                            {tWorkflowMetrics.map((entry, index) => (
                                                <Cell className="pie-sect" key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>

                                </ResponsiveContainer>
                                :
                                <NoMetrics />
                            }
                        </div>
                    </div>
            }
            </LoadingWrapper>
        </div>
    )
}

function NoMetrics() {
    return(
        <div style={{width:"100%", height:"100%", fontSize:"12pt", display:"flex", alignItems:"center", justifyContent:"center"}}>
            No metrics are stored.
        </div>
    )
}

function ErrorComp(props) {
    const {error} = props
    return(
        <div style={{width:"100%", height:"100%", fontSize:"12pt", display:"flex", alignItems:"center", justifyContent:"center", color: "red"}}>
            {error}
        </div>
    )
}

function Events() {
    return(
        <div className="shadow-soft rounded tile" style={{  flex: "auto", flexGrow: "1", maxHeight: "450px", height:"450px",  marginBottom:"10px" }}>
            <TileTitle name="Events">
                <IoList />
            </TileTitle>
            <div style={{maxHeight:"365px", overflow:"auto"}}>
                <EventsPageBody />
            </div>
        </div>
    )
}

function Logs() {
    return(
        <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "1", maxHeight: "450px", height:"450px",  marginBottom:"10px" }}>
            <TileTitle name="Namespace Logs">
               <IoTerminal />
            </TileTitle>
            <NamespaceLogs />
        </div>
    )
}

const CustomTooltip = (obj) => {
    if (obj.active && obj.payload && obj.payload.length) {
        return (
          <div style={{background:"linear-gradient(145deg, #dadada, #f0f0f0)", padding:"3px", fontSize:"12pt", borderRadius:"5px", boxShadow:" 2px 2px 5px  var(--neumorph-shadow-dark),-2px -2px 5px var(--neumorph-shadow-light)"}}>
            <p className="label">{`${obj.payload[0].name}: ${obj.payload[0].value}`}</p>
          </div>
        );
      }
    return null;
}