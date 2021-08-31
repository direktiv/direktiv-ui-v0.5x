import { useCallback, useEffect, useRef, useState } from "react"
import ReactFlow, { ReactFlowProvider, Handle, addEdge, updateEdge } from "react-flow-renderer";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Noop, StartNode, Switch } from "./states";

import YAML from 'yaml'

function Start() {
    return(
        <div className="normal">
            <Handle
                type="source"
                position="bottom"
            />
            <div className="start" />
        </div>
    )
}

function State(props) {
    const {data, id} = props

    return(
        <div className="state" style={{width:"80px", height:"30px"}}>
            <Handle
                type="target"
                position="top"
                id="default"
            />
            <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
                <IoChevronForwardSharp/>
                <div style={{flex:"auto"}}>
                    {data.type}
                </div>
            </div>
            <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{id}</h1>
            <Handle
                type="source"
                position="bottom"
                id="default"
            /> 
        </div>
    )
}

function addState(e, elementData, setBlocks) {
    const newNode = {
        id: elementData.id,
        type: elementData.type,
        data: elementData,
        position: {
            x: e.pageX - 525,
            y: e.pageY,
        },
    };
    setBlocks((els)=>els.concat(newNode))
}

function diagramToYAML(blocks) {
    let wf = {
        id: "workflow-name",
        states: []
    }

    let sortStart = ""
    for(let i=0; i < blocks.length; i++) {
        if(blocks[i].data) {
            if(blocks[i].data.type !== "start") {
                // not the start node
                // must be a state and not an edge
                wf.states.push(blocks[i].data)
            }
        } else {
            if (blocks[i].source === "startNode") {
                // target is the start of the workflow add to first element of array
                sortStart = blocks[i].target
            }
            // this will be an edge connecting nodes
            for(let x=0; x < wf.states.length; x++) {
                // if its not a switch it doesn't have multiple transitions/conditions
                if(wf.states[x].type !== "switch") {
                    if(wf.states[x].id === blocks[i].source) {
                        wf.states[x]["transition"] = blocks[i].target
                    }
                }
            }
        }
    }
    console.log(wf.states, "before sort")
    wf.states.sort((x,y)=>{return x.id === sortStart ? -1 : y.id === sortStart ? 1:0})
    console.log(wf.states, "after sort")

    console.log(YAML.stringify(wf))
}

export default function Flowy() {
    const [blocks, setBlocks] = useState([])
    const [elementData, setElementData] = useState(null)

    const [startIndex, setStartIndex] = useState(0)
    const startIndexRef = useRef(0)
    const [switchIndex, setSwitchIndex] = useState(0)
    const switchIndexRef = useRef(0)
    const [noopIndex, setNoopIndex] = useState(0)
    const noopIndexRef = useRef(0)

    const onAdd = useCallback((e)=>{
        switch(elementData.type){
            case "start":
                startIndexRef.current = startIndexRef.current +1
                setStartIndex(startIndexRef.current)
                addState(e, elementData, setBlocks)
                break
            case "switch":
                switchIndexRef.current = switchIndexRef.current + 1
                setSwitchIndex(switchIndexRef.current)
                addState(e, elementData, setBlocks)
                break
            case "noop":
                noopIndexRef.current = noopIndexRef.current + 1
                setNoopIndex(noopIndexRef.current)
                addState(e, elementData, setBlocks)
                break
        }

    },[setBlocks, elementData])

    const onEdgeUpdate = (oldEdge, newConnection) =>
    setBlocks((els) => updateEdge(oldEdge, newConnection, els));

    const onConnect = (params) => {
        for(let i=0; i < blocks.length; i++) {
            if(blocks[i].data) {
                // state checking
                if(blocks[i].data.id === params.source) {
                    if(blocks[i].data.type === "switch") {
                        // prompt somehow to ask for if its a default transition or a condition
                        console.log('prompt user for more input')
                    } else {
                        // loop through same array to check if edge already exists on this node and prompt for error saying u can only connect the one
                        for(let x=0; x < blocks.length; x++) {
                            if(blocks[x].source === params.source) {
                                console.log("already has atleast one connection dont let this connect and prompt user")
                                return
                            }
                        }
                    }
                }
            } 
        }
        setBlocks((els) => addEdge(params, els))
    };
    
    console.log(blocks)
    
    return(
        <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onAdd(e)} className="container" style={{flexDirection:"row", height:"100%", overflow:"hidden"}}>
            <div className="shadow-soft rounded tile" style={{ maxWidth:"200px", fontSize:"12pt", flexGrow:1}}>
                <StartNode setElementData={setElementData} index={startIndex} />
                <Noop setElementData={setElementData} index={noopIndex} />
                <Switch setElementData={setElementData} index={switchIndex} />
                <div onClick={()=>diagramToYAML(blocks)}>
                    output
                </div>
            </div>
            <div className="shadow-soft rounded tile" style={{ fontSize:"12pt", flexGrow:1}}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodeTypes={{
                            noop: State,
                            switch: State,
                            start: Start,
                        }}
                        onConnect={onConnect}
                        onEdgeUpdate={onEdgeUpdate}
                        elements={blocks}
                    ></ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    )
}