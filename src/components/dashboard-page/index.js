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
    const {fetch, namespace} = useContext(MainContext)

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
                        <TotalWorkflows fetch={fetch} namespace={namespace} />
                        <SuccessOrFailedWorkflows fetch={fetch} namespace={namespace} />
                        <TotalTimeWorkflows fetch={fetch} namespace={namespace} />
                    </div>
                </div>
                :
                ""
            }
        </>
    )
}

function TotalTimeWorkflows(props) {
    const {fetch, namespace} = props
    const [isLoading, setIsLoading] = useState(true)

    const [timeMetrics, setTimeMetrics] = useState([])
    const [totalTime, setTotalTime] = useState(0)
    const [oname, setOName] = useState("")
    // fetch the first time
    useEffect(()=>{
        async function getDetails() {
            try{
                let resp = await fetch(`/namespaces/${namespace}/metrics/workflows-milliseconds`, {})
                if(resp.ok){
                    let json = await resp.json()
                    let arr = []
                    let total = 0
                    for(let i=0; i < json.results.length; i++) {
                        // create a key array for each line
                        arr.push({name: json.results[i].metric.workflow, value: parseInt(json.results[i].value[1]/1000)})
                        total += parseInt(json.results[i].value[1]/1000)
                    }
                    setTimeMetrics(arr)
                    setTotalTime(total)
                    setOName(namespace)
                } else {
                    console.log('handle time workflow metrics error resp', resp)
                }
            } catch(e) {
                console.log('handle total time workflows metrics error', e)
            }
        }    
        if(isLoading || oname !== namespace){
            getDetails().finally(()=> {setIsLoading(false)})       
        }
    },[fetch, isLoading, namespace, oname])
    let colors = ["#ef5350", "#ec407a", "#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#29b6f6", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"]

    return(
        <div className="shadow-soft rounded tile" style={{ flex: 1,   marginBottom:"10px" }}>
            <TileTitle name="Time(s) each workflow has taken">
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Total Time Workflow Metrics"}>
                {timeMetrics.length > 0 ? 
                <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                        <Pie
                            nameKey="name"
                            innerRadius={70}
                            paddingAngle={5}
                            // label={renderLabel}
                            data={timeMetrics}
                        >
                            <Label style={{fontSize:"20pt"}} value={`${totalTime}s`} position="center" />
                            {timeMetrics.map((entry, index) => (
                              <Cell className="pie-sect" key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>:
                <NoMetrics/>}
            </LoadingWrapper>
        </div>
    )
}

export function SuccessOrFailedWorkflows(props) {
    const {fetch, namespace, workflow} = props

    const [isLoading, setIsLoading] = useState(true)
    const [percentage, setPercentage] = useState(0)
    const [sWorkflowMetrics, setSWorkflowMetrics] = useState([])
    const [oname, setOName] = useState("")

    useEffect(()=>{
        async function fetchDetails() {
            try{
                let failedURL = `/namespaces/${namespace}/metrics/workflows-failed`
                let successURL = `/namespaces/${namespace}/metrics/workflows-successful`
                if (workflow){
                    failedURL = `/namespaces/${namespace}/workflows/${workflow}/metrics/failed`
                    successURL = `/namespaces/${namespace}/workflows/${workflow}/metrics/successful`
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
                    console.log('handle success workflow metrics error resp', failedResp, successResp)
                }
            } catch(e) {
                console.log('handle success or failure workflows metrics error', e)
            }
        }
        if(isLoading || oname !== namespace) {
            fetchDetails().finally(()=> {setIsLoading(false)})    
        }
    },[fetch, isLoading, namespace, workflow, oname])

    let colors = ["#2fa64d", "#db3447"]

    return(
        <div className="shadow-soft rounded tile" style={{ flex: workflow?"none":1, marginBottom:"10px", minHeight:"300px" }}>
            <TileTitle name={workflow? `Success rate on ${workflow}`:"Success rate on workflows invoked"}>
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Success Workflow Metrics"}>
                {sWorkflowMetrics.length > 0 ?
                <ResponsiveContainer height={workflow ? 250: 300} width="100%">
                    <PieChart>
                        <Pie
                            innerRadius={workflow? 55 :70}
                            nameKey="name"
                            // label={renderLabel}
                            paddingAngle={5}
                            data={sWorkflowMetrics}
                        >
                            <Label style={{fontSize:"20pt"}} value={`${percentage}%`} position="center" />
                            {sWorkflowMetrics.map((entry, index) => (
                              <Cell className="pie-sect" key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                : <NoMetrics/>}
            </LoadingWrapper>
        </div>
    )
}

function TotalWorkflows(props) {
    const {fetch, namespace} = props

    const [isLoading, setIsLoading] = useState(true)
    const [invokedWorkflows, setInvokedWorkflows] = useState([])
    const [tWorkflowMetrics, setTWorkflowMetrics] = useState([])
    const [oname, setOName] = useState("")

    let colors = ["#ef5350", "#ec407a", "#ab47bc", "#7e57c2", "#5c6bc0", "#42a5f5", "#29b6f6", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"]

    useEffect(()=>{
        async function fetchDetails() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/metrics/workflows-invoked`, {
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
                    console.log('handle total workflow metrics error resp', resp)
                }
            } catch(e) {
                console.log('handle total workflows metrics error', e)
            }
        }
        if(isLoading || oname !== namespace) {
            fetchDetails().finally(()=> {setIsLoading(false)})    
        }
    },[oname, fetch, namespace, isLoading])

    return(
        <div className="shadow-soft rounded tile" style={{ marginBottom:"10px", flex: 1}}>
            <TileTitle name="Number of workflows invoked">
                <IoCodeSlashOutline />
            </TileTitle>
            <LoadingWrapper isLoading={isLoading} text={"Loading Total Workflow Metrics"}>
                {tWorkflowMetrics.length > 0 ? 
                <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                        <Pie
                            innerRadius={70}
                            nameKey="name"
                            // label={renderLabel}
                            paddingAngle={5}
                            data={tWorkflowMetrics}
                        >
                            <Label style={{fontSize:"20pt"}} value={invokedWorkflows} position="center" />
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