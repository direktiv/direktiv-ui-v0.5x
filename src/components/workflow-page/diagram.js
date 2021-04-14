import { useEffect, useState } from 'react'
import ReactFlow, { MiniMap, isNode, Handle, ReactFlowProvider, useZoomPanHelper } from 'react-flow-renderer';
import dagre from 'dagre'

export const position = { x: 0, y: 0}

const generateElements = (getLayoutedElements) => {
    let newElements = []

    newElements.push({
        id: 'startNode',
        position: position,
        data: {label: ""},
        type: 'start',
        sourcePosition: 'right',
    })

    newElements.push({
        id: 'helloworld',
        type: 'state',
        data: {label: "helloworld", type:"noop"},
        position: position,
    })

    newElements.push({
        id: `startNode-helloworld`,
        source: 'startNode',
        target: "helloworld",
        animated: false,
        type: 'bezier',
    })

    newElements.push({
        id: `helloworld-endNode`,
        source: 'helloworld',
        target: `endNode`,
        animated: false,
        type: 'bezier'
    })

    newElements.push({
        id:'endNode',
        type: 'end',
        data: {label: ""},
        position: position,
    })

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
        <div className="state">
               <Handle
                    type="target"
                    position="left"
                    id="default"
                />
                    <h1>{data.label}</h1>
                    <p>{data.type}</p>
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

export default function Diagram() {
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

        let saveElements = generateElements(getLayoutedElements)

        // Keep old elements until the yaml is parsable. Try and catch in func
        if(elements !== null) {
            setElements(saveElements)
        }
    },[setElements])

    return(
        <ReactFlowProvider>
            <WorkflowDiagram elements={elements} />
        </ReactFlowProvider>
    )   
}