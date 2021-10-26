import { useCallback, useContext, useEffect, useState } from "react"
import ReactFlow, { ReactFlowProvider, isNode, addEdge, updateEdge, MiniMap } from "react-flow-renderer";
import {  ActionFunc, GeneralState, Schema } from "./states";
import {State, diagramToYAML, Start, addState, ActionFunction, SchemaNode, generateElementsForBuilder} from "./util"
import Breadcrumbs from '../breadcrumbs'
import dagre from 'dagre'
import YAML from 'js-yaml'

import {SchemaSelected, GetterOrSetterSelected, EventAndXorSelected, ParallelSelected, FuncSelected, ConsumeEventSelected, ForeachSelected, ValidateSelected, GenerateEventSelected, ErrorSelected, ActionSelected, DelaySelected, SwitchSelected, NoopSelected, EdgeSelected} from "./selected"


import { useHistory, useLocation, useParams } from "react-router";
import MainContext from "../../context";

import "./vsc.css"
import './flowy.css'
function useQuery() {
    return new URLSearchParams(useLocation().search);
}


export function ShowErr(message, setErr) {
    setErr(message)
    setTimeout(()=>{
        setErr("")
    }, 5000)
}

export default function Flowy() {
    const ps = useParams()
    const {namespace} = useParams()
    const {handleError, fetch} = useContext(MainContext)
    // blocks being handled
    const [blocks, setBlocks] = useState([{
        data: {
            type:"start",
            id: "startNode"
        },
        id: "startNode",
        position: {
            x: 34,
            y: 34
        },
        type: "start"
    }])
    const q = useQuery()
    // wfname and err check
    const [wfName, setWfName] = useState(ps[0] ? ps[0]: "")
    const [init, setInit] = useState(false)
    const [err, setErr] = useState("")
    
    // object being dragged
    const [elementData, setElementData] = useState(null)
    const [elementSelected, setElementSelected] = useState(null)
    const [modalOverlay, setModalOverlay] = useState(null)

    const history = useHistory()

    const onAdd = useCallback((e)=>{
        addState(e, elementData, setBlocks)
    },[setBlocks, elementData])


    const eventXorPrompt = (id, params) => {
        const attachNode = () => {
            let bs = blocks
            if(document.getElementById("event-transition").value !== "") {
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            bs[i].data.events.push({
                                event: {
                                    type: `${document.getElementById("event-transition").value}`
                                }
                            })
                            params["condition"] = true
                            params["data"]["label"] = `${document.getElementById("event-transition").value}`
                            params["conditionString"] = `${document.getElementById("event-transition").value}`
                        }
                    }
                }
            } else {
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            if(bs[i].data.transition) {
                                ShowErr(`Transition exists exists already.`, setErr)
                                return
                            }else {
                                bs[i].data["transition"] = params.target
                                params["transition"] = true
                            }
                        }
                    }
                }
            }
            setBlocks(addEdge(params, bs))
            setModalOverlay(null)
        }

        setModalOverlay(
            <div style={{position: "absolute", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, borderRadius: ".55rem", background: "rgba(0,0,0,0.2)", width:"100%", height:"100%"}}>
                <div className="rounded" style={{background:"linear-gradient(145deg, #dadada, #f0f0f0)", boxShadow:"1px 0px 13px 2px rgb(0 0 0 / 20%)", padding:"10px", textAlign:"left"}}>
                    <h1 style={{fontSize:"12pt", margin:"5px"}}>Enter the event to transition on</h1>
                    <input type="text" id="event-transition" style={{width:"300px"}} />
                    <p style={{fontSize:"10pt", fontStyle:"italic", margin: "5px", color:"rgb(134 134 134)"}}>
                        leave blank to use as a default transition
                    </p>
                    <div style={{textAlign:"right"}}>
                        <input type="submit" value="Attach" onClick={()=>attachNode()}/>
                    </div>
                </div>
            </div>
        )
    }
    const switchPrompt = (id, params) => {
        const attachNode = () => {
            let bs  = blocks
            if(document.getElementById("switch-condition").value !== "") {
                // passing a condition
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            bs[i].data.conditions.push({
                                condition: `${document.getElementById("switch-condition").value}`,
                                transition: params.target,
                            })
                            params["condition"] = true
                            params["data"]["label"] = `${document.getElementById("switch-condition").value}`
                            params["conditionString"] = `${document.getElementById("switch-condition").value}`
                        }
                    }
                }
            } else {
                // passing a defaultTransition
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            if(bs[i].data.defaultTransition) {
                                ShowErr(`Default transition exists transition to '${bs[i].data.defaultTransition}'.`, setErr)
                                return
                            } else {

                                bs[i].data["defaultTransition"] = params.target
                                params["defaultTransition"] = true
                                params["data"]["label"]= "default"
                            }
                        }
                    }
                }
            }
            setBlocks(addEdge(params, bs))
            setModalOverlay(null)
        } 

        setModalOverlay(
            <div style={{position: "absolute", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, borderRadius: ".55rem", background: "rgba(0,0,0,0.2)", width:"100%", height:"100%"}}>
                <div className="rounded" style={{background:"linear-gradient(145deg, #dadada, #f0f0f0)", boxShadow:"1px 0px 13px 2px rgb(0 0 0 / 20%)", padding:"10px", textAlign:"left"}}>
                    <h1 style={{fontSize:"12pt", margin:"5px"}}>Enter the condition you wish to transition on</h1>
                    <input type="text" id="switch-condition" style={{width:"300px"}} />
                    <p style={{fontSize:"10pt", fontStyle:"italic", margin: "5px", color:"rgb(134 134 134)"}}>
                        leave blank to use as a default transition
                    </p>
                    <div style={{textAlign:"right"}}>
                        <input type="submit" value="Attach" onClick={()=>attachNode()}/>
                    </div>
                </div>
            </div>
        )
    }

    const onEdgeUpdate = (oldEdge, newConnection) => {
        newConnection["data"] = oldEdge["data"]
        if(newConnection.source === newConnection.target) {
            ShowErr(`Can't create an edge that points to itself`, setErr)
            return
        }
        if(oldEdge.defaultTransition) {
            newConnection["defaultTransition"] = true
        }
        if(oldEdge.condition) {
            newConnection["condition"] = true
            newConnection["conditionString"] = oldEdge.conditionString
        }
        setBlocks((els) => updateEdge(oldEdge, newConnection, els));
    }

    const onConnect = (params) => {
        params["data"] = {
            edge: true
        }
        if(params.source === params.target) {
            ShowErr(`Edge not created, source and target are the same`, setErr)
            return
        }

        for(let i=0; i < blocks.length; i++) {
            if(blocks[i].data) {
                // state checking
                if(blocks[i].data.id === params.source) {
                    if (blocks[i].data.type === "eventXor") {
                        eventXorPrompt(blocks[i].data.id, params)
                        return
                    } else if(blocks[i].data.type === "switch") {
                        switchPrompt(blocks[i].data.id, params)
                        return
                    } else {
                        // loop through same array to check if edge already exists on this node and prompt for error saying u can only connect the one
                        for(let x=0; x < blocks.length; x++) {
                            if(blocks[x].source === params.source) {
                                ShowErr(`'${blocks[x].source}' already has one connection for transitioning please remove or change to new transition.`, setErr)
                                return
                            }
                        }
                    }
                }
            } 
        }
        setBlocks((els) => addEdge(params, els))
    };

    const onElementClick = (event, element) => {
        if(element.type !== "start"){
            setElementSelected(element)
        }
    };

    const createOrUpdateWorkflow = async (wfName, wf) => {
        if(ps[0]) {
            try {
               let resp = await fetch(`/namespaces/${namespace}/tree/${ps[0]}?op=update-workflow`, {
                method: "post",
                headers: {
                    "Content-type": "text/yaml",
                    "Content-Length": wf.length,
                },
                body: wf
                })
                if (resp.ok) {
                    history.push(`/n/${namespace}/explorer/${ps[0]}`)
                } else {
                    await handleError('update workflow', resp, 'updateWorkflow')
                }
            } catch (e) {
                ShowErr(`Failed to update workflow: ${e.message}`, setErr)
            }
        } else {
            // create a new workflow
            let url = `/namespaces/${namespace}/tree/`
            if(q.get('path')) {
                url += `${q.get('path')}/${wfName}?op=create-workflow`
            } else {
                url += `${wfName}?op=create-workflow`
            }
            // const rpath = q.get('path')
            try {
                let resp = await fetch(url, {
                    headers: {
                        "Content-Type": "text/yaml",
                        "Content-Length": wf.length,
                    },
                    method: "PUT",
                    body: wf,
                })
                if (resp.ok) {
                    // let json = await resp.json()
                    let pushurl = `/n/${namespace}/explorer/`
                    if(q.get('path')) {
                        pushurl += `${q.get('path')}/${wfName}`
                    } else {
                        pushurl += `${wfName}`
                    }
                    history.push(`${pushurl}`)
                } else {
                        await handleError('create workflow', resp, 'createWorkflow')
                }
            } catch (e) {
                let y = YAML.load(wf)
                let stateIndex = parseInt(e.message.match(/(?<=\[).+?(?=\])/)[0])
                let errMessage = e.message.match(/(?<=\]: )[\w\s]+/)
                let id = y.states[stateIndex].id
                ShowErr(`Workflow creation failed: state '${id}': ${errMessage}`, setErr)
            }
        }
    }


    useEffect(()=>{
        async function fetchWorkflowAndDraw() {
            if (!init) {
                if(ps[0]) {
                    let wf = ""
                    try {
                        // todo pagination
                        let resp = await fetch(`/namespaces/${namespace}/tree/${ps[0]}`, {
                            method: "get",
                        })
                        if (resp.ok) {
                            let json = await resp.json()
                            wf = atob(json.revision.source)
                        }else {
                            await handleError('fetch workflow', resp, 'getWorkflow')
                        }
                    } catch(e) {
                        return
                    }
        
                    const dagreGraph = new dagre.graphlib.Graph()
                    dagreGraph.setDefaultEdgeLabel(() => ({}))
                    
                    const getLayoutedElements = (incomingEles, direction = 'TB') => {
                        const isHorizontal = direction === 'LR'
                        dagreGraph.setGraph({rankdir: 'TB'})
                    
                        incomingEles.forEach((el)=>{
                            if(isNode(el)){
                                if(el.id === "startNode"){
                                    dagreGraph.setNode(el.id, {width: 40, height:40})
                                } else {
                                    dagreGraph.setNode(el.id, {width: 100, height:40})
                                }
                            } else {
                                if(el.source === "startNode") {
                                    dagreGraph.setEdge(el.source, el.target, {width: 0, height: 20})
                                } else {
                                    dagreGraph.setEdge(el.source, el.target, {width: 60, height: 60})
                                }
                            }
                        })
                    
                        dagre.layout(dagreGraph)
                        
                        return incomingEles.map((el)=>{
                            if(isNode(el)){
                                const nodeWithPosition = dagreGraph.node(el.id)
                                el.targetPosition = isHorizontal ? 'left' : 'top'
                                el.sourcePosition = isHorizontal ? 'right' : 'bottom'
                    
                                //hack to trigger refresh
                                el.position = {
                                    x: nodeWithPosition.x + Math.random()/1000,
                                    y: nodeWithPosition.y,
                                }
                            }
                            return el
                        })
                    }
            
            
                    let saveBlocks = generateElementsForBuilder(blocks, getLayoutedElements, wf)
            
                    setInit(true)

                    // Keep old elements until the yaml is parsable. Try and catch in func
                    if(saveBlocks !== null) {
                        setBlocks(saveBlocks)
                    }    
                }    
            }

        }
        fetchWorkflowAndDraw()
    },[blocks, setBlocks, init, namespace, handleError, fetch, ps])

      
    return(
        <div  style={{ display:"flex", flexDirection:"inherit", height:"100%" }}>
        <div className="container">
            <div style={{ flex: "auto" }}>
                <Breadcrumbs />
            </div>
        </div>
        <div  className="container" style={{flexDirection:"row", height:"100%", overflow:"hidden"}}>
            <div className="shadow-soft rounded tile" style={{ maxWidth:"200px", fontSize:"12pt", flexGrow:1}}>
                <table className="state-list" style={{width:"100%"}}>
                    <thead>
                        <tr><th>States</th></tr>
                    </thead>
                    <tbody>
                        <GeneralState type="noop" setElementData={setElementData}  />
                        <GeneralState type="switch" setElementData={setElementData}/>
                        <GeneralState type="action" setElementData={setElementData} />
                        <GeneralState type="generateEvent" setElementData={setElementData}/>
                        <GeneralState type="delay" setElementData={setElementData}  />
                        <GeneralState type="error" setElementData={setElementData}  />
                        <GeneralState type="eventAnd" setElementData={setElementData} />
                        <GeneralState type="eventXor" setElementData={setElementData}  />
                        <GeneralState type="foreach" setElementData={setElementData}  />
                        <GeneralState type="consumeEvent" setElementData={setElementData}  />
                        <GeneralState type="getter" setElementData={setElementData}  />
                        <GeneralState type="setter" setElementData={setElementData}  />
                        <GeneralState type="parallel" setElementData={setElementData} />
                        <GeneralState type="validate" setElementData={setElementData}/>
                    </tbody>
                </table>
                <hr/>
                <table className="state-list" style={{width:"100%"}}>
                    <thead>
                        <tr><th>Utility</th></tr>
                    </thead>
                    <tbody>
                        <ActionFunc type="function" setElementData={setElementData}  />
                        <Schema type="schema" setElementData={setElementData}/>
                    </tbody>
                </table>
                <hr />
                <div>
                        <div style={{fontSize:"12pt", fontWeight:"bold"}}>{ps[0] ? "Update Workflow":"Create Workflow"}</div>
                        <input value={wfName} onChange={(e)=>setWfName(e.target.value)} type="text" disabled={ps[0] ? true: false} placeholder="Enter workflow name" style={{marginTop:"10px"}} />
                        <div style={{textAlign:"right", marginTop:"10px", fontSize:"8pt"}}>
                            <input type="submit" value={ps[0] ? "Update Workflow":"Create Workflow"} onClick={()=>{
                                if(wfName) {
                                    diagramToYAML(wfName, blocks, setErr, createOrUpdateWorkflow)
                                } else {
                                    setErr("Workflow name needs be to set.")
                                }
                            }}/>
                        </div>
                    </div>
            </div>
            <div style={{display:"flex", flexDirection:"column", flex: 1}}>
       
            <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onAdd(e)} className="shadow-soft rounded tile" style={{ fontSize:"12pt", flexGrow:1, padding:"0px", position: "relative"}}>
                {err !== "" ?
                    <div style={{position: "absolute", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, borderRadius: ".55rem", width: "94%"}} className="shadow-soft rounded tile">
                        <div style={{padding:"3px", width:"100%", border: "1px solid #ff5252", background: "#ff8a80"}}>
                            {err}
                        </div>
                    </div>
                :
                ""}
                {
                    modalOverlay ? 
                    modalOverlay
                    :""
                }
                <ReactFlowProvider>
                    <ReactFlow
                        className="test"
                        nodeTypes={{
                            noop: State,
                            switch: State,
                            start: Start,
                            action: State,
                            consumeEvent: State,
                            error: State,
                            delay: State,
                            eventAnd: State,
                            eventXor: State,
                            foreach: State,
                            generateEvent: State,
                            getter: State,
                            setter: State,
                            validate: State,
                            parallel: State,
                            schema: SchemaNode,
                            function: ActionFunction,
                        }}
                        onClick={(e)=>{
                            setElementSelected(null)
                        }}
                        onConnect={onConnect}
                        onNodeDrag={onElementClick}
                        onElementClick={onElementClick}
                        onEdgeUpdate={onEdgeUpdate}
                        elements={blocks}
                    >
    <MiniMap 
                nodeColor={()=>{
                    return '#4497f5'
                }}
            />

                    </ReactFlow>
                </ReactFlowProvider>
            </div>
            </div>

            <div className="shadow-soft rounded tile" style={{ maxWidth:"300px", fontSize:"12pt", flexGrow:1, overflow:"auto"}}>
                <div>
                    <div style={{fontSize:"12pt", fontWeight:"bold"}}>{elementSelected ? `Edit ${elementSelected.id}`: "Edit State"}</div>
                    <div style={{height:"100px"}}>
                    {
                    elementSelected !== null ? 
                        <div style={{padding:"5px"}}>
                            <ElementSelected setErr={setErr} setElement={setElementSelected} blocks={blocks} setBlocks={setBlocks} element={elementSelected}/>
                        </div>
                        :
                        <div style={{minHeight:"100px", display:"flex", alignItems:"center", justifyContent:"center", fontStyle:"italic"}}>
                            No State Selected
                        </div>
                    }
                    </div>
  
                </div>
            </div>
        </div>
        </div>
    )
}

function ElementSelected(props) {
    const {element, blocks, setBlocks, setElement, setErr} = props 
    
    function deleteElement() {
        let bs = blocks
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                if(element.source && element.target) {
                    // it is an edge remove the condition wherever it is in the state
                    for(let y=0; y < bs.length; y++) {
                        if(element.source === bs[y].id) {
                            switch(bs[y].type) {
                                case "switch":
                                    // check conditions
                                    for(let z=0; z < bs[y].data.conditions.length; z++) {
                                        if(bs[y].data.conditions[z].transition === element.target) {
                                            bs[y].data.conditions.splice(z, 1)
                                            z--
                                        }
                                    }
                                    // check default transition
                                    if(bs[y].data.defaultTransition === element.target) {
                                        bs[y].data.defaultTransition = null
                                    }
                                    break
                                case "eventXor":
                                    for(let z=0; z < bs[y].data.events.length; z++) {
                                        if(bs[y].data.events[z].transition === element.target) {
                                            bs[y].data.events.splice(z, 1)
                                            z--
                                        }
                                    }
                                    if(bs[y].data.transition === element.target) {
                                        bs[y].data.transition = null
                                    }
                                    break
                                default:
                                    if(bs[y].data.transition === element.target) {
                                        bs[y].data.transition = null
                                    }
                            }
                        }
                    }
                }
                
                bs.splice(i, 1)
                i--
            }
            if(bs[i].source === element.id) {
                bs.splice(i, 1)
                i--
            }
            if(bs[i].target === element.id) {
                bs.splice(i, 1)      
                i--
            }
        }
        // set element selected back to nothing
        setElement(null)
        setBlocks([...bs])
    }

    switch(element.type) {
        case "eventAnd":
        case "eventXor":
            return <EventAndXorSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "getter":
        case "setter":
            return <GetterOrSetterSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "parallel":
            return <ParallelSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "foreach":
            return <ForeachSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "consumeEvent":
            return <ConsumeEventSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "validate":
            return <ValidateSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "error":
            return <ErrorSelected  setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "delay":
            return <DelaySelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "generateEvent":
            return <GenerateEventSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "schema":
            return <SchemaSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "function":
            return <FuncSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "action":
            return <ActionSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        case "switch":
            return <SwitchSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element}/>
        case "noop":
            return <NoopSelected setErr={setErr} deleteElement={deleteElement} blocks={blocks} setBlocks={setBlocks} element={element} />
        default:
            if(element.source && element.target) {
                // this is an edge
                return <EdgeSelected deleteElement={deleteElement} blocks={blocks} element={element} setBlocks={setBlocks} />
            }
            return ""
    }

}




