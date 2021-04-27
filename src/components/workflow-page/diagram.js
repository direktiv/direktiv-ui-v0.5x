import YAML from 'js-yaml'
import { useEffect, useState } from 'react'
import ReactFlow, { MiniMap, isNode, Handle, ReactFlowProvider, useZoomPanHelper } from 'react-flow-renderer';
import dagre from 'dagre'
import { IoChevronForwardSharp } from 'react-icons/io5';

export const position = { x: 0, y: 0}

const generateElements = (getLayoutedElements, value, flow, status) => {
    let newElements = []
   
    try {
        let v = YAML.load(value)
        if(v.states) {
            for(let i=0; i < v.states.length; i++) {

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
                    data: {label: v.states[i].id, type: v.states[i].type, state: v.states[i]},
                    type: 'state'
                })


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
                        }
                    }
                }

                // Check if state is catching things to transition to
                if(v.states[i].catch) {
                    for(let x=0; x < v.states[i].catch.length; x++) {
                        if(v.states[i].catch[x].transition) {
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
                    newElements.push({
                        id: `${v.states[i].id}-${v.states[i].transition}`,
                        source: v.states[i].id,
                        target: v.states[i].transition,
                        animated: false,
                        type: 'bezier'
                    })
                } else if(v.states[i].defaultTransition) {
                    newElements.push({
                        id: `${v.states[i].id}-${v.states[i].defaultTransition}`,
                        source: v.states[i].id,
                        target: v.states[i].defaultTransition,
                        animated: false,
                        type: 'bezier'
                    })
                } else {
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
                        
                        if(newElements[j].target === flow[i]) {
                            newElements[j].animated = true
                        } else 
                        
                        if(newElements[j].id === flow[i]) {
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
                        for(let j=0; j < newElements.length; j++) {
                            if(newElements[j].source === flow[i] && newElements[j].target === "endNode" && status === "complete"){
                                newElements[j].animated = true
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

const Start = ( {data} )=> {
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

const End = ( {data} ) => {
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

const State = ( { data } ) => {
    return(
        <div title={`${data.label}-${data.type}`} className="state" style={{width:"80px", height:"30px"}}>
               <Handle
                    type="target"
                    position="left"
                    id="default"
                />
                <div style={{display:"flex", padding:"1px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
                    <IoChevronForwardSharp/>
                    {data.type}
                </div>
                <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{data.label}</h1>
                <Handle
                    type="source"
                    position="right"
                    id="default"
                /> 
        </div>
    )
}

const WorkflowDiagram = (props) => {
    const { elements } = props
    const { fitView } = useZoomPanHelper();
    
    useEffect(()=>{
        fitView()
    },[fitView])

    return(
        <ReactFlow elements={elements} nodeTypes={{
            state: State,
            start: Start,
            end: End
        }} >
            <MiniMap 
                nodeColor={()=>{
                    return '#4497f5'
                }}
            />
        </ReactFlow>
    )
}

export default function Diagram(props) {
    const {value, flow, status} = props

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
                <WorkflowDiagram elements={elements} />
            </ReactFlowProvider>
        </div>

    )   
}