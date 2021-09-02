import { useCallback, useEffect, useRef, useState } from "react"
import ReactFlow, { ReactFlowProvider, addEdge, updateEdge } from "react-flow-renderer";
import { Noop, StartNode, Switch, CustomEdge } from "./states";
import {State, diagramToYAML, Start, addState} from "./util"


export default function Flowy() {
    // blocks being handled
    const [blocks, setBlocks] = useState([])
    
    // object being dragged
    const [elementData, setElementData] = useState(null)
    const [elementSelected, setElementSelected] = useState(null)
    const [modalOverlay, setModalOverlay] = useState(null)


    // state handlers
    const [startIndex, setStartIndex] = useState(0)
    const startIndexRef = useRef(0)
    const [switchIndex, setSwitchIndex] = useState(0)
    const switchIndexRef = useRef(0)
    const [noopIndex, setNoopIndex] = useState(0)
    const noopIndexRef = useRef(0)

    useEffect(()=>{
        document.addEventListener("keydown", onKeyPress, false)
        return ()=> {
            document.removeEventListener("keydown", onKeyPress, false)
        }
    },[])

    const onKeyPress = useCallback((e)=>{
        console.log('key pressed', e)
        if(e.ey == "Delete") {
            console.log("delete key pressed")
            console.log(elementSelected)
        }
    },[])


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

    const switchPrompt = (id, params) => {
        const attachNode = () => {
            let bs  = blocks
            if(document.getElementById("switch-condition").value !== "") {
                // passing a condition
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            bs[i].data.conditions.push({
                                condition: `jq('${document.getElementById("switch-condition").value}')`,
                                transition: params.target,
                            })
                            params["condition"] = true
                            params["data"]["label"] = `${document.getElementById("switch-condition").value}`
                            params["conditionString"] = `jq('${document.getElementById("switch-condition").value}')`
                        }
                    }
                }
            } else {
                // passing a defaultTransition
                for(let i=0; i < bs.length; i++) {
                    if(bs[i].data) {
                        if(bs[i].data.id === id) {
                            if(bs[i].data.defaultTransition) {
                                console.log(`default transition exists prompt error? transitioning to ${bs[i].data.defaultTransition} `)
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
        for(let i=0; i < blocks.length; i++) {
            if(blocks[i].data) {
                // state checking
                if(blocks[i].data.id === params.source) {
                    if(blocks[i].data.type === "switch") {
                        // prompt somehow to ask for if its a default transition or a condition
                        console.log('prompt user for more input')
                        switchPrompt(blocks[i].data.id, params)
                        return
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

    const onElementClick = (event, element) => {
        setElementSelected(element)
    };

    const edgeTypes = {
        default: CustomEdge,
    };
      
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
            <div className="shadow-soft rounded tile" style={{ fontSize:"12pt", flexGrow:1, padding:"0px", position: "relative"}}>
                {
                    modalOverlay ? 
                    modalOverlay
                    :""
                }
                <ReactFlowProvider>
                    <ReactFlow
                        nodeTypes={{
                            noop: State,
                            switch: State,
                            start: Start,
                        }}
                        edgeTypes={edgeTypes}
                        onConnect={onConnect}
                        onElementClick={onElementClick}
                        onEdgeUpdate={onEdgeUpdate}
                        onNodeDoubleClick={(e)=>{
                            console.log(e)
                        }}
                        elements={blocks}
                    ></ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    )
}