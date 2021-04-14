import React, { useEffect, useState } from 'react'
import ReactFlow, { MiniMap, isNode, Handle } from 'react-flow-renderer';
import dagre from 'dagre'

import Breadcrumbs from '../breadcrumbs'

export const position = { x: 0, y: 0}

// startStyle node coloring for starting node of diagram
const startStyle = {
    background: '#28a745',
    color: 'white',
    border: '1px solid #28a745',
    width: "40px",
    height:"40px",
    borderRadius: "40px"
}

// endStyle node coloring for ending node of diagram
const endStyle = {
    background: 'red',
    color: 'white',
    border: '1px solid red',
    width: "40px",
    height:"40px",
    borderRadius: "40px"
}

const generateElements = (getLayoutedElements) => {
    let newElements = []

    newElements.push({
        id: 'startNode',
        position: position,
        data: {label: ""},
        style: startStyle,
        type: 'startEnd',
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
        arrowHeadType: 'arrowclosed',
        animated: false,
        type: 'bezier',
    })

    newElements.push({
        id: `helloworld-endNode`,
        source: 'helloworld',
        target: `endNode`,
        arrowHeadType: 'arrowclosed',
        animated: false,
        type: 'bezier'
    })

    newElements.push({
        id:'endNode',
        type: 'startEnd',
        data: {label: ""},
        position: position,
        style: endStyle
    })

    return getLayoutedElements(newElements)
}

const Start = ( {data} )=> {
    return(
        <div>
        <Handle
            type="source"
            position="right"
        />
    </div>
    )
}

const End = ( {data}) => {
    return(
        <div>
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

export default function WorkflowPage() {

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
                        dagreGraph.setNode(el.id, {width: 100, height:50})
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
    },[])

    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflow-row-1" className="flex-row">
                <div id="workflow-yaml-tile" className="neumorph">
                    <div style={{  }}>
                        <h3>YAML Editor</h3>
                    </div>
                </div>
                <div style={{ marginRight: "10px", height: "max-content",  display: "flex", flexWrap: "wrap"}}>
                    <div className="neumorph chart-box">
                        <p>Chart 1</p>
                    </div>
                    <div className="neumorph chart-box">
                        <p>Chart 1</p>
                    </div>
                </div>
            </div>
            <div id="workflow-row-2" className="flex-row">
                <div id="workflow-graph-tile" className="neumorph">
                    <div style={{ height: 300 }}>
                        <ReactFlow elements={elements} nodeTypes={{
                            state: State,
                            start: Start,
                            end: End
                        }} connectionLineType="smoothstep">
                            <MiniMap />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        </>
    )
}