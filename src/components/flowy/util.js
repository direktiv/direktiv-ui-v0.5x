import YAML from 'yaml'
import YAMLLoader from 'js-yaml'
import { IoChevronForwardSharp } from "react-icons/io5";
import { Handle} from "react-flow-renderer";
import { position } from '../workflow-page/diagram';
var randomWords = require('random-words');

export const generateElementsForBuilder = (blocks, getLayoutedElements, value) => {

    let newElements = blocks

    try {
        let v = YAMLLoader.load(value)

        newElements.push({
            type: "meta",
            name: v.name,
            description: v.description,
            version: v.version,
            singular: v.singular,
            start: v.start,
            timeouts: v.timeouts
        })

        if(v.functions) {
            for (let i=0; i < v.functions.length; i++) {
                let data = {
                    id: v.functions[i].id,
                    label: v.functions[i].id,
                    type: v.functions[i].type
                }

                switch(v.functions[i].type) {
                    case "knative-global":
                    case "knative-namespace":
                        data["service"] = v.functions[i].service
                        data["files"] = v.functions[i].files
                        break
                    case "isolated":
                    case "reusable":
                        data["image"] = v.functions[i].image
                        data["files"] = v.functions[i].files
                        data["cmd"] = v.functions[i].cmd
                        data["size"] = v.functions[i].size
                        data["scale"] = v.functions[i].scale
                        break
                    case "subflow":
                        data["workflow"] = v.functions[i].workflow
                        break
                    default:

                }
                newElements.push({
                    id: `${v.functions[i].id}${randomWords()}`,
                    position: position,
                    data: data,
                    type: "function"
                })
            }
        }
        if(v.states) {
            for(let i=0; i < v.states.length; i++) {
                if (i === 0) {
                    // starting element so create an edge to the state
                    newElements.push({
                        id: `startNode-${v.states[i].id}`,
                        source: 'startNode',
                        target: v.states[i].id,
                        type: 'bezier',
                    })
                }
                let data = {
                    id: v.states[i].id,
                    label: v.states[i].id,
                    type: v.states[i].type,
                    transform: v.states[i].transform,
                    log: v.states[i].log,
                    catch: v.states[i].catch
                }
                

                switch (v.states[i].type) {
                    case "delay":
                        data["duration"] = v.states[i].duration
                        break
                    case "switch":
                        data["conditions"] = v.states[i].conditions
                        break
                    case "validate":
                        data["schema"] = v.states[i].schema
                        break
                    case "eventXor":
                    case "eventAnd":
                        data["events"] = v.states[i].events
                        break
                    case "foreach":
                        data["array"] = v.states[i].array
                        data["action"] = v.states[i].action
                        break
                    case "consumeEvent":
                        data["event"] = v.states[i].event
                        break
                    case "getter":
                    case "setter":
                        data["variables"] = v.states[i].variables
                        break
                    case "error":
                        data["error"] = v.states[i].error
                        data["message"] = v.states[i].message
                        break
                    case "parallel":
                        data["actions"] = v.states[i].actions
                        break
                    case "generateEvent":
                        data["event"] = v.states[i].event
                        break
                    case "action":
                        data["action"] = v.states[i].action
                        break
                    default:
                        console.log('unsupported type')
                }

                newElements.push({
                    id: v.states[i].id,
                    position: position,
                    data: data,
                    type: v.states[i].type
                })
                
                if (v.states[i].events) {
                    for(let j=0; j < v.states[i].events.length; j++) {
                        if(v.states[i].events[j].transition) {
                            let condition = v.states[i].events[j].type
                            if(v.states[i].type === "eventXor") {
                                condition = v.states[i].events[j].event.type
                            }
                            newElements.push({
                                id: `${v.states[i].id}-${v.states[i].events[j].transition}`,
                                source: v.states[i].id,
                                target: v.states[i].events[j].transition,
                                animated: false,
                                condition: true,
                                conditionString: condition,
                                label: condition,
                                data: {
                                    edge: true,
                                    label: condition
                                },
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
                                condition: true,
                                conditionString: v.states[i].conditions[y].condition,
                                label: v.states[i].conditions[y].condition,
                                data: {
                                    edge: true,
                                    label: v.states[i].conditions[y].condition,
                                    condition: true,
                                    conditionString: v.states[i].conditions[y].condition
                                },
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
                                condition: true,
                                conditionString: v.states[i].catch[x].error,
                                label: v.states[i].catch[x].error,
                                data: {
                                    edge: true,
                                    label: v.states[i].catch[x].error,
                                },
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
                        data: {
                            edge: true
                        },
                        type: 'bezier'
                    })
                } else if(v.states[i].defaultTransition) {

                    newElements.push({
                        id: `${v.states[i].id}-${v.states[i].defaultTransition}`,
                        source: v.states[i].id,
                        target: v.states[i].defaultTransition,
                        defaultTransition: true,
                        label: "default",
                        data: {
                            edge: true,
                            label: "default"
                        },
                        animated: false,
                        type: 'bezier'
                    })
                }
  
            }


            }
        } catch(e) {

        }
    return getLayoutedElements(newElements)
}

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

export function ActionFunction(props) {
    const {data} = props
    return(
        <div key={`function-${randomWords()}`} className="state" style={{width:"80px", height:"30px"}}>
        <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
            <IoChevronForwardSharp/>
            <div style={{flex:"auto"}}>
                {data.type}
            </div>
        </div>
        <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{data.id}</h1>
    </div>
    )
    // return (
    //     <div className="state" style={{width:"80px", height:"30px"}}>
            
    //         <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
    //             <IoChevronForwardSharp/>
    //             <div style={{flex:"auto", color: "#2396d8"}}>
    //                 {data.type}
    //             </div>
    //         </div>
    //         <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px", color:"#2396d8"}}>{data.id}</h1>
    //     </div>
    // )
}

export function SchemaNode(props) {
    const {data, id} = props
    return(
        <div key={`function-${randomWords()}`} className="state" style={{width:"80px", height:"30px"}}>
        <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
            <IoChevronForwardSharp/>
            <div style={{flex:"auto"}}>
                {data.type}
            </div>
        </div>
        <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{data.id}</h1>
    </div>
    )
}

export function State(props) {
    const {data, id} = props

    return(
        <div key={`${id}${randomWords()}`} className="state" style={{width:"80px", height:"30px"}}>
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

export function diagramToYAML(wfname, blocks, setErr , func) {
    let wf = {
        states: [],
        functions: [],
        schemas: []
    }

    let sortStart = ""

    for(let i=0; i < blocks.length; i++) {
        if(blocks[i].source === "startNode") {
            // logic to get first element of the array from the start node
            sortStart = blocks[i].target
        }

        switch(blocks[i].type) {
            case "schema":
                wf.schemas.push({
                    id: blocks[i].data.id,
                    schema: blocks[i].data.schema
                })
                break
            case "function":
                let data = {
                    type: blocks[i].data.type,
                    id: blocks[i].data.id
                }
                switch(blocks[i].data.type) {
                    case "knative-global":
                    case "knative-namespace":
                        data["files"] = blocks[i].data.files
                        data["service"] = blocks[i].data.service
                        break
                    case "isolated":
                    case "reusable":
                        data["image"] = blocks[i].data.image
                        data["files"] = blocks[i].data.files
                        data["cmd"] = blocks[i].data.cmd
                        data["size"] = blocks[i].data.size
                        data["scale"] = blocks[i].data.scale
                        break
                    case "subflow":
                        data["workflow"] = blocks[i].data.workflow
                        break
                    default:
                }
                wf.functions.push(data)
                break
            case "meta":
                if(blocks[i].description) {
                    wf["description"] = blocks[i].description
                }
                if(blocks[i].singular) {
                    wf["singular"] = blocks[i].singular
                }
                if(blocks[i].start) {
                    wf["start"] = blocks[i].start
                }
                if(blocks[i].timeouts) {
                    wf["timeouts"] = blocks[i].timeouts
                }
                if(blocks[i].version) {
                    wf["version"] = blocks[i].version
                }
                break
            case "start":
                break
            default:
                if(!blocks[i].source && !blocks[i].target) {
                    wf.states.push(blocks[i].data)
                }
        }
    }

    for(let y=0; y < blocks.length; y++) {
        if(blocks[y].source && blocks[y].target){
            for(let x=0; x < wf.states.length; x++) {
                if(blocks[y].source === wf.states[x].id) {
                    switch(wf.states[x].type){
                        case "eventXor":
                            if(wf.states[x].transition) {
                                wf.states[x]["transition"] = blocks[y].target
                            }
                            if(blocks[y].condition) {
                                for(let n=0; n < wf.states.length; n++) {
                                    if(wf.states[n].id === blocks[y].source) {
                                        for(let y=0; y < wf.states[n].events.length; y++) {
                                            if(wf.states[n].events[y].event.type === blocks[y].conditionString) {
                                                wf.states[n].events[y].transition = blocks[y].target
                                            }
                                        }
                                    }
                                }
                            }   
                            break
                        case "switch":
                            if(blocks[y].defaultTransition) {
                                wf.states[x]["defaultTransition"] = blocks[y].target
                            }
                            if(blocks[y].condition) {
                                for(let n=0; n < wf.states.length; n++) {
                                    if(wf.states[n].id === blocks[y].source) {
                                        for(let y=0; y < wf.states[n].conditions.length; y++) {
                                            if(wf.states[n].conditions[y].condition === blocks[y].conditionString) {
                                                wf.states[n].conditions[y].transition = blocks[y].target
                                            }
                                        }
                                    }
                                }
                            }
                            break
                        default:
                            // check catch as it should be on all states.
                            if(blocks[y].condition) {
                                for(let n=0; n < wf.states.length; n++) {
                                    if(wf.states[n].id === blocks[y].source) {
                                        for(let y=0; y < wf.states[n].catch.length; y++) {
                                            if(wf.states[n].catch[y].error === blocks[y].conditionString) {
                                                wf.states[n].catch[y].transition = blocks[y].target 
                                            }
                                        }
                                    }
                                }
                            }
                            wf.states[x]["transition"] = blocks[y].target
                    }
                }
            }
        }
    }

    wf.states.sort((x,y)=>{return x.id === sortStart ? -1 : y.id === sortStart ? 1:0})

    // check for null values and dont return
    if(wf.functions.length === 0) {
        delete wf.functions
    } else {
        for(var i=0; i < wf.functions.length; i++) {
            for(const prop in wf.functions[i]) {
                if(prop === "label") {
                    delete wf.functions[i][prop]
                }
                if(!wf.functions[i][prop]){
                    delete wf.functions[i][prop]
                }
            }
        }
    }

    if(wf.schemas.length === 0) {
        delete wf.schemas
    }
    if(wf.states.length === 0) {
        delete wf.states
    } else {
        for( i=0; i < wf.states.length; i++) {
            for(const prop in wf.states[i]) {
                if(prop === "label") {
                    delete wf.states[i][prop]
                }
                if(!wf.states[i][prop]) {
                    delete wf.states[i][prop]
                }
            }
        }
    }

    func(wfname, YAML.stringify(wf))
}
