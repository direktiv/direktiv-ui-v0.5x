import YAML from 'yaml'
import { IoChevronForwardSharp } from "react-icons/io5";
import { Handle} from "react-flow-renderer";


export function Start() {
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

export function State(props) {
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

export function addState(e, elementData, setBlocks) {
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

export function diagramToYAML(blocks) {
    let wf = {
        id: "workflow-name",
        states: []
    }

    let sortStart = ""
    for(let i=0; i < blocks.length; i++) {
        if(blocks[i].data && blocks[i].data.edge !== true) {
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
                } else {
                    console.log(blocks[i], "BLOCKS TEST")
                    if(blocks[i].defaultTransition) {
                        wf.states[x]["defaultTransition"] = blocks[i].target
                    }

                    if(blocks[i].condition) {
                        console.log(blocks[i], "CONDITION CHECK")
                        for(let n=0; n < wf.states.length; n++) {
                            if(wf.states[n].id === blocks[i].source) {
                                for(let y=0; y < wf.states[n].conditions.length; y++) {
                                    if(wf.states[n].conditions[y].condition === blocks[i].conditionString) {
                                        wf.states[n].conditions[y].transition = blocks[i].target
                                    }
                                }
                            }
                        }
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
