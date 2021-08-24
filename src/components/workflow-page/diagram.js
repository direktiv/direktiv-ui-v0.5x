import YAML from 'js-yaml'
import YAML2 from 'yaml'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, { MiniMap, isNode, Handle, ReactFlowProvider, useZoomPanHelper } from 'react-flow-renderer';
import dagre from 'dagre'
import { IoChevronForwardSharp, IoReorderFourOutline } from 'react-icons/io5';

import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import yaml from "highlight.js/lib/languages/yaml";
import { useParams } from 'react-router';
// import EditNode from './edit-node';
hljs.registerLanguage("yaml", yaml);

export const position = { x: 0, y: 0}

const generateElements = (getLayoutedElements, value, flow, status) => {
    let newElements = []
   
    try {
        let v = YAML.load(value)
        if(v.states) {
            for(let i=0; i < v.states.length; i++) {
                let transitions = false

                // check if starting element
                if (i === 0) {
                    // starting element so create an edge to the state
                    newElements.push({
                        id: `startNode-${v.states[i].id}`,
                        source: 'startNode',
                        target: v.states[i].id,
                        type: 'bezier',
                    })
                }

                // push new state
                newElements.push({
                    id: v.states[i].id,
                    position: position,
                    data: {label: v.states[i].id, type: v.states[i].type, state: v.states[i], functions: v.functions},
                    type: 'state'
                })

                // check if the state has events
                if (v.states[i].events) {
                    for(let j=0; j < v.states[i].events.length; j++) {
                        if(v.states[i].events[j].transition) {
                            transitions = true
                            newElements.push({
                                id: `${v.states[i].id}-${v.states[i].events[j].transition}`,
                                source: v.states[i].id,
                                target: v.states[i].events[j].transition,
                                animated: false,
                                type: 'bezier'
                            })
                        }
                    }
                }

                // Check if the state has conditions
                if(v.states[i].conditions) {
                    for(let y=0; y < v.states[i].conditions.length; y++) {
                        if(v.states[i].conditions[y].transition) {
                            newElements.push({
                                id: `${v.states[i].id}-${v.states[i].conditions[y].transition}`,
                                source: v.states[i].id,
                                target: v.states[i].conditions[y].transition,
                                animated: false,
                                type: 'bezier'
                            })
                            transitions = true

                        }
                    }
                }

                // Check if state is catching things to transition to
                if(v.states[i].catch) {
                    for(let x=0; x < v.states[i].catch.length; x++) {
                        if(v.states[i].catch[x].transition) {
                            transitions = true

                            newElements.push({
                                id: `${v.states[i].id}-${v.states[i].catch[x].transition}`,
                                source: v.states[i].id,
                                target: v.states[i].catch[x].transition,
                                animated: false,
                                type: 'bezier'
                            })
                        }
                    }
                }

                // check if transition and create edge to hit new state
                if(v.states[i].transition) {
                    transitions = true

                    newElements.push({
                        id: `${v.states[i].id}-${v.states[i].transition}`,
                        source: v.states[i].id,
                        target: v.states[i].transition,
                        animated: false,
                        type: 'bezier'
                    })
                } else if(v.states[i].defaultTransition) {
                    transitions = true

                    newElements.push({
                        id: `${v.states[i].id}-${v.states[i].defaultTransition}`,
                        source: v.states[i].id,
                        target: v.states[i].defaultTransition,
                        animated: false,
                        type: 'bezier'
                    })
                } else {
                        transitions = true
                        newElements.push({
                            id: `${v.states[i].id}-endNode`,
                            source: v.states[i].id,
                            target: `endNode`,
                            animated: false,
                            type: 'bezier'
                        })
                }

                if(!transitions) {
                    // no transition add end state
                    newElements.push({
                        id: `${v.states[i].id}-endNode`,
                        source: v.states[i].id,
                        target: `endNode`,
                        type: 'bezier'
                    })
                }
            }

            // push start node
            newElements.push({
                id: 'startNode',
                position: position,
                data: {label: ""},
                type: 'start',
                sourcePosition: 'right',
            })

            // push end node
            newElements.push({
                id:'endNode',
                type: 'end',
                data: {label: ""},
                position: position,
            })

            // Check flow array change edges to green if it passed 
            if(flow){
                // check flow for transitions
                for(let i=0; i < flow.length; i++) {
                    let noTransition = false
                    for(let j=0; j < newElements.length; j++) {
                        
                        // handle start node
                        if(newElements[j].source === "startNode" && newElements[j].target === flow[i]){
                            newElements[j].animated = true
                        }
                        
                        if(newElements[j].target === flow[i] && newElements[j].source === flow[i-1]) {
                            newElements[j].animated = true
                        } else if(newElements[j].id === flow[i]) {
                            if(!newElements[j].data.state.transition || !newElements[j].data.state.defaultTransition ){
                                noTransition = true
                              
                                if(newElements[j].data.state.catch) {
                                    for(let y=0; y < newElements[j].data.state.catch.length; y++) {
                                        if(newElements[j].data.state.catch[y].transition){
                                            noTransition = false
                                            if (newElements[j].data.label === flow[flow.length-1]) {
                                                noTransition = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if(noTransition) {
                        // transition to end state
                        // check if theres more flow if not its the end node
                        if(!flow[i+1]){
                            for(let j=0; j < newElements.length; j++) {
                                if(newElements[j].source === flow[i] && newElements[j].target === "endNode" && status === "complete"){
                                    newElements[j].animated = true
                                }
                            }
                        }
                      
                    }
                }
            }
        }

    } catch(e) {
    }
    return getLayoutedElements(newElements)
}

function Start(props) {
    return(
        <div className="normal">
            <Handle
                type="source"
                position="right"
            />
            <div className="start" />
        </div>
    )
}

function End(props) {
    return(
        <div className="normal">
            <div className="end" />
             <Handle
                type="target"
                position="left"
            />
        </div>
    )
}



function WorkflowDiagram(props) {
    const { elements, functions,params } = props
    const funcRef = useRef() 
    const { fitView } = useZoomPanHelper();
    funcRef.current = functions

    useEffect(()=>{
        fitView()
    },[fitView, elements])

    const State = useCallback((props) => {
        const {data} = props
        let funcFailed = "var(--primary-light)"
        let titleMsg = `${data.label}-${data.type}`
        if (funcRef.current && funcRef.current.length > 0 && (data.state.type === "action" || data.state.type === "foreach" || data.state.type === "parallel")) {
            for(var i=0; i < funcRef.current.length; i++){
                if(data.state.actions) {
                    // parallel
                    for(var l=0; l < data.state.actions.length; l++) {
                        if(funcRef.current[i].info.name === data.state.actions[l].function) {
                            if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
                                let title = ""
                                if( funcRef.current[i].conditions) {
                                    for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                        title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                    }
                                }
        
                                titleMsg = title
                                funcFailed = "rgb(204,115,115)"
                                break
                            }
                        }
                        for(var y=0; y < data.functions.length; y++) {
                            if (data.functions[y].type === "knative-global" && data.state.actions[l].function === data.functions[y].id) {
                                // global func
                            if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
        
                                if (funcRef.current[i].serviceName === data.functions[y].service && funcRef.current[i].info.namespace === "") {
                                    let title = ""
                                    if(funcRef.current[i].conditions) {
                                        for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                            title += `${funcRef.current[i].conditions[x].name}: ${funcRef.current[i].conditions[x].message}\n`
                                        }
                                    }
                                 
                                    titleMsg = title
                                    funcFailed = "rgb(204,115,115)"
                                break
        
                                } else if (funcRef.current[i].serviceName === `g-${data.functions[y].service}` && funcRef.current[i].info.namespace === "") {
                                    let title = ""
                                    if(funcRef.current[i].conditions) {
                                    for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                        title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                    }
                                }
                                    titleMsg = title
                                    funcFailed = "rgb(204,115,115)"
                                break
        
                                }
                            }
                            }else if (data.functions[y].type === "knative-namespace" && data.state.actions[l].function === data.functions[y].id) {
                            if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
                               
                                // namespace func
                                if (funcRef.current[i].serviceName === data.functions[y].service && funcRef.current[i].info.namespace !== "") {
                                    let title = ""
                                    if(funcRef.current[i].conditions) {
        
                                    for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                        title += `${funcRef.current[i].conditions[x].name}: ${funcRef.current[i].conditions[x].message}\n`
                                    }
                                }
                                    titleMsg = title
                                    funcFailed = "rgb(204,115,115)"
                                    break
        
                                }else if (funcRef.current[i].serviceName === `ns-${params.namespace}-${data.functions[y].service}` && funcRef.current[i].info.namespace !== "") {
                                    let title = ""
                                    if(funcRef.current[i].conditions) {
        
                                    for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                        title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                    }
                                }
                                    titleMsg = title
                                    funcFailed = "rgb(204,115,115)"
                                break
        
                                }
                            }
                        }
                        }
                    }
                } else {
                    if(funcRef.current[i].info.name === data.state.action.function) {
                        if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
                            let title = ""
                            if( funcRef.current[i].conditions) {
                                for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                    title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                }
                            }
    
                            titleMsg = title
                            funcFailed = "rgb(204,115,115)"
                            break
                        }
                    }
                    for(var y=0; y < data.functions.length; y++) {
                        if (data.functions[y].type === "knative-global" && data.state.action.function === data.functions[y].id) {
                            // global func
                        if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
    
                            if (funcRef.current[i].serviceName === data.functions[y].service && funcRef.current[i].info.namespace === "") {
                                let title = ""
                                if(funcRef.current[i].conditions) {
                                    for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                        title += `${funcRef.current[i].conditions[x].name}: ${funcRef.current[i].conditions[x].message}\n`
                                    }
                                }
                             
                                titleMsg = title
                                funcFailed = "rgb(204,115,115)"
                            break
    
                            } else if (funcRef.current[i].serviceName === `g-${data.functions[y].service}` && funcRef.current[i].info.namespace === "") {
                                let title = ""
                                if(funcRef.current[i].conditions) {
                                for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                    title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                }
                            }
                                titleMsg = title
                                funcFailed = "rgb(204,115,115)"
                            break
    
                            }
                        }
                        }else if (data.functions[y].type === "knative-namespace" && data.state.action.function === data.functions[y].id) {
                        if (funcRef.current[i].status === "False" || funcRef.current[i].status === "Unknown") {
                           
                            // namespace func
                            if (funcRef.current[i].serviceName === data.functions[y].service && funcRef.current[i].info.namespace !== "") {
                                let title = ""
                                if(funcRef.current[i].conditions) {
    
                                for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                    title += `${funcRef.current[i].conditions[x].name}: ${funcRef.current[i].conditions[x].message}\n`
                                }
                            }
                                titleMsg = title
                                funcFailed = "rgb(204,115,115)"
                                break
    
                            }else if (funcRef.current[i].serviceName === `ns-${params.namespace}-${data.functions[y].service}` && funcRef.current[i].info.namespace !== "") {
                                let title = ""
                                if(funcRef.current[i].conditions) {
    
                                for(var x=0; x < funcRef.current[i].conditions.length; x++) {
                                    title += `${funcRef.current[i].conditions[x].name}(${funcRef.current[i].conditions[x].reason}): ${funcRef.current[i].conditions[x].message}\n`
                                }
                            }
                                titleMsg = title
                                funcFailed = "rgb(204,115,115)"
                            break
    
                            }
                        }
                    }
                    }
                }

            }
        }
    
        return(
            <div title={titleMsg} className="state" style={{width:"80px", height:"30px", backgroundColor: funcFailed}}>
    
                        <Handle
                                type="target"
                                position="left"
                                id="default"
                            />
                            <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
                                <IoChevronForwardSharp/>
                                <div style={{flex:"auto"}}>
                                {data.type}
    
                                </div>
                                <div style={{display:"flex", alignItems:"center", cursor: "pointer"}} onClick={(e)=>{
                                    hljs.highlightBlock(document.getElementById(`${data.label}-yaml`))
                                    document.getElementById(`state-${data.state.id}`).classList.toggle("hide")
                                }}>
                                    <IoReorderFourOutline />
                                </div>
                            </div>
                            <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{data.label}</h1>
                            <Handle
                                type="source"
                                position="right"
                                id="default"
                            /> 
                <div className="state hide" id={`state-${data.state.id}`}  style={{position:"absolute", top:"-30px", zIndex:100, cursor:"pointer"}} onClick={()=>{document.getElementById(`state-${data.state.id}`).classList.toggle("hide")}}>
                    <pre style={{textAlign:"left", fontSize:"6px", whiteSpace:""}}>
                        <code id={`${data.label}-yaml`} style={{fontSize:"6px", color:"black", background: "transparent"}}>
                            {YAML2.stringify(data.state)}
                        </code>
                    </pre>
                </div>
            </div>
    
    
        )
    },[functions])

    return(
        <ReactFlow elements={elements} nodeTypes={{
            state: State,
            start: Start,
            end: End
        }} 
        >
            <MiniMap 
                nodeColor={()=>{
                    return '#4497f5'
                }}
            />
        </ReactFlow>
    )
}

export default function Diagram(props) {
    const {value, functions, flow, status} = props
    const params = useParams()

    const [elements, setElements] = useState([])

    useEffect(()=>{
        const dagreGraph = new dagre.graphlib.Graph()
        dagreGraph.setDefaultEdgeLabel(() => ({}))
        
        const getLayoutedElements = (incomingEles, direction = 'TB') => {
            const isHorizontal = direction === 'LR'
            dagreGraph.setGraph({rankdir: 'lr'})
        
            incomingEles.forEach((el)=>{
                if(isNode(el)){
                    if(el.id === "startNode"|| el.id === "endNode"){
                        dagreGraph.setNode(el.id, {width: 40, height:40})
                    } else {
                        dagreGraph.setNode(el.id, {width: 100, height:40})
                    }
                } else {
                    if(el.source === "startNode") {
                        dagreGraph.setEdge(el.source, el.target, {width: 0, height: 20})
                    } else if(el.source === "endNode"){
                        dagreGraph.setEdge(el.source, el.target, {width: 30, height: 20})
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


        let saveElements = generateElements(getLayoutedElements, value, flow, status)

        // Keep old elements until the yaml is parsable. Try and catch in func
        if(saveElements !== null) {
            setElements(saveElements)
        }
    },[setElements, value, flow, status])


    return(
        <div style={{height:"100%", width:"100%", minHeight:"300px"}}>
            <ReactFlowProvider>
                    <WorkflowDiagram params={params} functions={functions} elements={elements} />
            </ReactFlowProvider>
        </div>

    )   
}