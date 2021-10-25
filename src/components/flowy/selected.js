import {  useEffect, useState } from "react"

// load the string into an object
import YAML from 'js-yaml'
import Editor from 'react-simple-code-editor';

// Stringify the object
import YAML2String from 'yaml'

import {ShowErr} from "./index"

var prism = require('prismjs');
require('prismjs/components/prism-yaml')


export function GetterOrSetterSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [variables, setVariables] = useState([])
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        let acts = []
        for(let i=0; i < variables.length; i++) {
            try {
                let json = YAML.load(variables[i].value)
                if(element.data.type === "setter") {
                    if(!json.value) {
                        throw(new Error(`Variable ${i} must have a value provided to set.`))
                    }
                }
                if(!json.key || !json.scope) {
                    throw(new Error(`Variable ${i} must have a key and scope provided`))
                } else {
                    acts.push(json)
                }
            } catch(e) {
                ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
                return
            }
        }

        let bs = blocks
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let x=0; x < bs.length; x++) {
            if(bs[x].id === element.data.id) {
                bs[x].data["variables"] = acts
                bs[x].data["log"] = log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
            if(currId !== element.data.id) {
                let vars = []
                if(element.data.variables.length > 0) {
                    for(let x=0; x < element.data.variables.length; x++) {
                        vars.push({
                            name: `variable-${x}`,
                            value: YAML2String.stringify(element.data.variables[x])
                        })
                    }
                } else {
                    if(element.data.type === "setter"){
                        vars.push({
                            name: `variable-${variables.length}`,
                            value: YAML2String.stringify({
                                key: "variable name",
                                scope: "instance, workflow or namespace",
                                value: "value of variable"
                            })
                        })
                    } else {
                        vars.push({
                            name: `variable-${variables.length}`,
                            value: YAML2String.stringify({
                                key: "variable name",
                                scope: "instance, workflow or namespace"
                            })
                        })
                    }
                }
                setVariables(vars)
                if(element.data.transform) {
                    setTransform(YAML2String.stringify(element.data.transform))
                } else {
                    setTransform("")
                }
                if(element.data.log) {
                    setLog(element.data.log)
                } else {
                    setLog("")
                }
            }
            setCurrId(element.data.id)
    },[currId, element.data, variables.length])


    const handleChange = (i,event) => {
        variables[i].value = event
        setVariables([...variables])
    }


    return (
<div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            
            <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
            {variables.map((obj,i)=>{
                return <div key={i} style={{flex: 1, textAlign:"left"}}>
                <p>Variable {i}: </p>
                
                <Editor
                        placeholder="Please enter YAML for the variable."
                        className={"language-yaml"}
                        value={obj.value}
                        onValueChange={code => handleChange(i, code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
            </div>
            })}
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            {variables.length > 1 ?
            <input type="submit" value="Remove" onClick={()=>{
                        let acs = variables
                        acs.pop()
                        setVariables(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} />: "" }
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = variables
                        if(element.data.type === "setter"){
                            acs.push({
                                name: `variable-${variables.length}`,
                                value: YAML2String.stringify({
                                    key: "variable name",
                                    scope: "instance, workflow or namespace",
                                    value: "value of variable"
                                })
                            })
                        } else {
                            acs.push({
                                name: `variable-${variables.length}`,
                                value: YAML2String.stringify({
                                    key: "variable name",
                                    scope: "instance, workflow or namespace"
                                })
                            })
                        }

                        setVariables(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )

}

export function EventAndXorSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [events, setEvents] = useState([])
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")


    function changeState() {
        let acts = []
        for(let i=0; i < events.length; i++) {
            try {
                let json = YAML.load(events[i].value)
                if(element.data.type === "eventXor") {
                    if(!json.event) {
                        throw new Error(`Event ${i} requires the event object.`)
                    } else  if(!json.event.type) {
                        throw new Error(`Event ${i} requires the event type inside the event object.`)
                    } else {
                        acts.push(json)
                    }
                } else {
                    if(!json.type) {
                        throw new Error(`Event ${i} requires an event type`)
                     } else {
                        acts.push(json)
                    }
                }
            } catch(e) {
                ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
                return
            }
        }
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        let bs = blocks
        for(let x=0; x < bs.length; x++) {
            if(bs[x].id === element.data.id) {
                bs[x].data["events"] = acts
                bs[x].data["log"]= log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            let evs = []
            if(element.data.events.length > 0) {
                for(let x=0; x < element.data.events.length; x++) {
                    evs.push({
                        name: `event-${x}`,
                        value: YAML2String.stringify(element.data.events[x])
                    })
                }
            } else {
                if(element.data.type === "eventXor") {
                    evs.push({
                        name: `event-${events.length}`,
                        value: YAML2String.stringify({
                            event: {
                                type: "placeholderEventType"
                            },
                            transform: {
                                object: "value"
                            }
                        })
                    })
                } else {
                    evs.push({
                        name: `event-${events.length}`,
                        value: YAML2String.stringify({
                            type: "placeholderEventType"
                        })
                    })
                }
                
            }
            setEvents([...evs])
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[currId, element.data, events.length])

    const handleChange = (i,event) => {
        events[i].value = event
        setEvents([...events])
    }

    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            
            <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
            {events.map((obj,i)=>{
                return <div key={i} style={{flex: 1, textAlign:"left"}}>
                <p>Event {i}: </p>
                
                <Editor
                        placeholder="Please enter YAML for the event action"
                        className={"language-yaml"}
                        value={obj.value}
                        onValueChange={code => handleChange(i, code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
            </div>
            })}
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                {events.length > 1 ?
            <input type="submit" value="Remove" onClick={()=>{
                        let acs = events
                        acs.pop()
                        setEvents(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} /> : ""}
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = events
                        if(element.data.type === "eventXor") {
                            acs.push({
                                name: `event-${events.length}`,
                                value: YAML2String.stringify({
                                    event: {
                                        type: "placeholderEventType"
                                    },
                                    transform: {
                                        object: "value"
                                    }
                                })
                            })
                        } else {
                            acs.push({
                                name: `event-${events.length}`,
                                value: YAML2String.stringify({
                                    type: "placeholderEventType"
                                })
                            })
                        }
         
                        setEvents(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                <hr />
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )

}

export function ParallelSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [actions, setActions] = useState([])
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")


    function changeState() {
        let acts = []
        for(let i=0; i < actions.length; i++) {
            try {
                let yml = YAML.load(actions[i].value)
                if(!yml.function) {
                    throw new Error(`Action ${i} must have a function name.`)
                } else {
                    acts.push(yml)
                }
            } catch(e) {
                ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
                return
            }
        }
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        let bs = blocks
        for(let x=0; x < bs.length; x++){
            if(bs[x].id === element.data.id) {
                bs[x].data["actions"] = acts
                bs[x].data["log"] = log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            let acts = []
            if(element.data.actions.length > 0) {
                for(let x=0; x < element.data.actions.length; x++) {
                    acts.push({
                        name: `action-${x}`,
                        value: YAML2String.stringify(element.data.actions[x])
                    })
                }
            } else {
                acts.push({
                    name: `action-${actions.length}`,
                    value: YAML2String.stringify({
                        function: "",
                        input: {
                            placeholder: "value"
                        }
                    })
                })
            }
            setActions([...acts])

            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[actions.length, currId, element.data])

    const handleChange = (i,event) => {
        actions[i].value = event
        setActions([...actions])
    }

    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            
            <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
            {actions.map((obj,i)=>{
                return <div key={i} style={{flex: 1, textAlign:"left"}}>
                <p>Action {i}: </p>
                
                <Editor
                        placeholder="Please enter YAML for an action"
                        className={"language-yaml"}
                        value={obj.value}
                        onValueChange={code => handleChange(i, code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
            </div>
            })}
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            {actions.length > 1 ?
            <input type="submit" value="Remove" onClick={()=>{
                        let acs = actions
                        acs.pop()
                        setActions(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} /> : ""}
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = actions
                        actions.push({
                            name: `action-${actions.length}`,
                            value: YAML2String.stringify({
                                function: "",
                                input: {
                                    placeholder: "value"
                                }
                            })
                        })
                        setActions(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )
}

export function SchemaSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [schema, setSchema] = useState("")

    function changeState() {
        let bs = blocks

        if(schema !== ""){
            try {
                let json = JSON.parse(schema)
                for(let i=0 ; i < bs.length; i++) {
                    if(bs[i].id === element.id) {
                        bs[i].data["schema"] = json
                        setBlocks(bs)
                    }
                }
            } catch(e) {
                ShowErr(`Error changing '${element.id}': Unable to parse schema as valid YAML`, setErr)
            }
        } else {
            ShowErr(`Error changing '${element.id}': Image must be set`, setErr)
        }
    }

    useEffect(()=>{
        if(element.data.schema) {
            setSchema(YAML2String.stringify(element.data.schema))
        } else {
            setSchema("")
        }
    },[element.data])

    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Schema: </p>
                
                <Editor
                        placeholder="Please enter YAML for a JSON Schema"
                        className={"language-yaml"}
                        value={schema}
                        onValueChange={code => setSchema(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete Schema" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

        <input  type="submit" value="Change" onClick={()=>changeState()}/>
    </div>
        </div>
    )
}

export function FuncSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [image, setImage] = useState("")
    const [type, setType] = useState("")
    const [service, setService] = useState("")
    const [currId, setCurrId] = useState("")
    const [size, setSize] = useState("")
    const [scale, setScale] = useState("")
    const [workflow, setWorkflow] = useState("")
    const [cmd, setCmd] = useState("")
    const [files, setFiles] = useState([])

    function changeState() {
        let bs = blocks

            for(let i=0 ; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    switch(element.data.type){
                        case "knative-global":
                        case "knative-namespace":
                            bs[i].data["service"] = service
                            break
                        case "reusable":
                        case "isolated":
                            bs[i].data["image"] = image
                            bs[i].data["cmd"] = cmd
                            bs[i].data["size"] = size
                            bs[i].data["scale"] = parseInt(scale)
                            break
                        case "subflow":
                            bs[i].data["workflow"] = workflow
                            break
                        default:
                    }
                    let acts = []
                    for(let i=0; i < files.length; i++) {
                        try {
                            if(files[i].value !== "") {
                                let yml = YAML.load(files[i].value)
                                if(!yml.key) {
                                    throw new Error(`File ${i} must have a key name`)
                                } else {
                                    acts.push(yml)
                                }
                            }
        
                        } catch(e) {
                            ShowErr(`Error changing '${element.id}': ${e.message}.`, setErr)
                            return
                        }
                    }

                    if(acts.length > 0) {
                        bs[i].data["files"] = acts
                    }
                    bs[i].data["type"] = type


                    setBlocks(JSON.parse(JSON.stringify(blocks)))
                }
            }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            let acts = []
            if(element.data.image) {
                setImage(element.data.image)
            } else {
                setImage("")
            }
            if(element.data.type) {
                setType(element.data.type)
            } else {
                setType("")
            }
            if(element.data.service){
                setService(element.data.service) 
            } else {
                setService("")
            }
            if(element.data.files) {
                if(element.data.files.length > 0) {
                    for(let x=0; x < element.data.files.length; x++) {
                        acts.push({
                            name: `file-${x}`,
                            value: YAML2String.stringify(element.data.files[x])
                        })
                    }
                } 
            }else {
                acts.push({
                    name: `file-${files.length}`,
                    value: YAML2String.stringify({
                        key: "identifier",
                        scope: "namespace, workflow or instance"
                    })
                })
            }
            setFiles(acts)

            if(element.data.cmd) {
                setCmd(element.data.cmd)
            } else {
                setCmd("")
            }
            if(element.data.size) {
                setSize(element.data.size) 
            } else {
                setSize("")
            }
            if(element.data.scale){
                setScale(element.data.scale)
            } else {
                setScale("")
            }
            if(element.data.workflow){
                setWorkflow(element.data.workflow)
            } else {
                setWorkflow("")
            }
        }
        setCurrId(element.data.id)
    },[element.data,  currId, files.length])

    const handleChange = (i,event) => {
        files[i].value = event
        setFiles([...files])
    }

    switch(type) {
        case "knative-global":
        case "knative-namespace":
            return(
                <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                   <div style={{flex: 1, textAlign:"left"}}>
                        <p>Type: </p>
                        <select className="edit-select" value={type} onChange={(e)=>setType(e.target.value)}>
                            <option value="">Select a type</option>
                            <option value="reusable">reusable</option>
                            <option value="subflow">subflow</option>
                            <option value="knative-global">knative-global</option>
                            <option value="knative-namespace">knative-namespace</option>
                            <option value="isolated">isolated</option>
                        </select>
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Service: </p>
                        <input className="edit-input" type="text" value={service} onChange={(e)=>setService(e.target.value)} placeholder="Enter the service name" />
                    </div>
                    {files.length > 0 ?
                        <div style={{flex: 1, textAlign:"left"}}>
                            {files.map((obj,i)=>{
                                            return <div key={i} style={{flex: 1, textAlign:"left"}}>
                                            <p>File {i}: </p>
                                            
                                            <Editor
                                                    placeholder="Please enter YAML for a file object"
                                                    className={"language-yaml"}
                                                    value={obj.value}
                                                    onValueChange={code => handleChange(i, code)}
                                                    highlight={code => prism.highlight(code, prism.languages.yaml)}
                                                    padding={3}
                                                    style={{
                                                        minHeight:"100px",
                                                        borderRadius:"3px",
                                                        maxWidth: "270px",
                                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                                        fontSize: 12,
                                                    }}
                                                />
                                        </div>
                                        })}
                                </div>
                            :
                            ""}
                    <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                        {files.length > 1 ?
                        <input type="submit" value="Remove" onClick={()=>{
                                    let acs = files
                                    acs.pop()
                                    setFiles(JSON.parse(JSON.stringify(acs)))
                                }}  style={{marginRight:"3px"}} /> : ""}
                                            <input type="submit" value="Add" onClick={()=>{
                                    let acs = files
                                    acs.push({
                                        name: `file-${files.length}`,
                                        value: YAML2String.stringify({
                                            key: "identifier",
                                            scope: "namespace, workflow or instance"
                                        })
                                    })
                                    setFiles(JSON.parse(JSON.stringify(acs)))
                                }} />
                    </div>
                    <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                        <input  type="submit" value="Delete Function" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
                        <input  type="submit" value="Change" onClick={()=>changeState()}/>
                    </div>
                </div>
            )
        case "isolated":
        case "reusable":
            return(
                <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Type: </p>
                        <select className="edit-select" value={type} onChange={(e)=>setType(e.target.value)}>
                            <option value="">Select a type</option>
                            <option value="reusable">reusable</option>
                            <option value="subflow">subflow</option>
                            <option value="knative-global">knative-global</option>
                            <option value="knative-namespace">knative-namespace</option>
                            <option value="isolated">isolated</option>
                        </select>
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Image: </p>
                        <input className="edit-input" type="text" value={image} onChange={(e)=>setImage(e.target.value)} placeholder="Enter the image name" />
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>CMD: </p>
                        <input className="edit-input" type="text" value={cmd} onChange={(e)=>setCmd(e.target.value)} placeholder="Enter the cmd for the service" />
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Size: </p>
                        <select className="edit-select" value={size} onChange={(e)=>setSize(e.target.value)}>
                            <option value=""> Select size</option>
                            <option value="small">small</option>
                            <option value="medium">medium</option>
                            <option value="large">large</option>
                        </select>
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Scale: </p>
                        <input className="edit-input" type="text" value={scale} onChange={(e)=>setScale(e.target.value)} placeholder="Enter the scale for the image" />
                    </div>
                    {files.length > 0 ?
                        <div style={{flex: 1, textAlign:"left"}}>
                            {files.map((obj,i)=>{
                                            return <div key={i} style={{flex: 1, textAlign:"left"}}>
                                            <p>File {i}: </p>
                                            
                                            <Editor
                                                    placeholder="Please enter YAML for a file object"
                                                    className={"language-yaml"}
                                                    value={obj.value}
                                                    onValueChange={code => handleChange(i, code)}
                                                    highlight={code => prism.highlight(code, prism.languages.yaml)}
                                                    padding={3}
                                                    style={{
                                                        minHeight:"100px",
                                                        borderRadius:"3px",
                                                        maxWidth: "270px",
                                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                                        fontSize: 12,
                                                    }}
                                                />
                                        </div>
                                        })}
                                </div>
                            :
                            ""}
                      <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                        {files.length > 1 ?
                        <input type="submit" value="Remove" onClick={()=>{
                                    let acs = files
                                    acs.pop()
                                    setFiles(JSON.parse(JSON.stringify(acs)))
                                }}  style={{marginRight:"3px"}} /> : ""}
                                            <input type="submit" value="Add" onClick={()=>{
                                    let acs = files
                                    acs.push({
                                        name: `file-${files.length}`,
                                        value: ""
                                    })
                                    setFiles(JSON.parse(JSON.stringify(acs)))
                                }} />
                    </div>
                    <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                    <input  type="submit" value="Delete Function" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
        
                        <input  type="submit" value="Change" onClick={()=>changeState()}/>
                    </div>
                </div>
            )
        case "subflow":
            return(
                <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Type: </p>
                        <select className="edit-select" value={type} onChange={(e)=>setType(e.target.value)}>
                            <option value="">Select a type</option>
                            <option value="reusable">reusable</option>
                            <option value="subflow">subflow</option>
                            <option value="knative-global">knative-global</option>
                            <option value="knative-namespace">knative-namespace</option>
                            <option value="isolated">isolated</option>
                        </select>
                    </div>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Workflow: </p>
                        <input className="edit-input" type="text" value={workflow} onChange={(e)=>setWorkflow(e.target.value)} placeholder="Enter the workflow name" />
                    </div>
                    <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                        <input  type="submit" value="Delete Function" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
                        <input  type="submit" value="Change" onClick={()=>changeState()}/>
                    </div>
                </div>
            )
        default:
            return(
                <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                    <div style={{flex: 1, textAlign:"left"}}>
                        <p>Type: </p>
                        <select className="edit-select" value={type} onChange={(e)=>setType(e.target.value)}>
                            <option value="">Select a type</option>
                            <option value="reusable">reusable</option>
                            <option value="subflow">subflow</option>
                            <option value="knative-global">knative-global</option>
                            <option value="knative-namespace">knative-namespace</option>
                            <option value="isolated">isolated</option>
                        </select>
                    </div>
                    <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                        <input  type="submit" value="Delete Function" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
                        <input  type="submit" value="Change" onClick={()=>changeState()}/>
                    </div>
                </div>
            )
    }
}

export function  ValidateSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props
    const [schema, setSchema] = useState("")
    const [isJson, setIsJson] = useState(false)
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")


    function changeState() {
        let bs = blocks
        let yaml = YAML.load(transform)  
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            ShowErr(`Error changing state '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data.schema = schema
                bs[i].data["transform"] = yaml
                bs[i].data["log"] = log
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.schema !== "") {
                if(typeof element.data.schema === "object") {
                    setSchema(YAML2String.stringify(element.data.schema))
                    setIsJson(true)
                } else {
                    setIsJson(false)
                    setSchema(element.data.schema)
                }
            } else {
                setIsJson(false)
                setSchema("")
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[element.data, currId])


    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Schema: </p>
            {isJson ? 
                        <Editor
                        placeholder="Please enter YAML to transform state"
                        className={"language-yaml"}
                        value={schema}
                        onValueChange={code => setSchema(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
            :
                <input className="edit-input" type="text" value={schema} onChange={(e)=>setSchema(e.target.value)} placeholder="Validation schema to refer to" />
            }
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function ConsumeEventSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props
    const [type, setType] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")

    function changeState() {
        let bs = blocks
       let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data.event.type = type
                bs[i].data["transform"] = yaml
                bs[i].data["log"]=log
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.event.type !== "") {
                setType(element.data.event.type)
            } else {
                setType("")
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
  
    },[element.data, currId])


    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Type: </p>
            <input className="edit-input" type="text" value={type} onChange={(e)=>setType(e.target.value)} placeholder="CloudEvent type" />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )  
}

export function ForeachSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [array, setArray] = useState("")
    const [action, setAction] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")

    
    function changeState() {
        let bs = blocks
        let actionjson = null

        try {
            actionjson = YAML.load(action)
            if(!actionjson.function) {
                throw new Error("An action must have a function name")
            }
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    if(actionjson !== null) {
                        bs[i].data["action"] = actionjson
                    }
                    bs[i].data["array"] = `jq('${array}')`
                    setBlocks(bs)
                }
            }
        } catch(e) {
            ShowErr(`Error changing ${element.id}: ${e.message}`)
        }
        
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            ShowErr(`Error changing ${element.id}: YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data["action"] = actionjson
                bs[i].data["transform"] = yaml
                bs[i].data["log"]=log
                bs[i].data["array"] = array
                setBlocks(bs)
            }
        }

    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.array !== "") {
                setArray(element.data.array)
            } else {
                setArray("")
            }
            if(element.data.action) {
                setAction(YAML2String.stringify(element.data.action))
            } else {
                setAction(YAML2String.stringify({
                    function: "",
                    input: {
                        placeholder: "value"
                    }
                }))
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[currId, element.data.action, element.data.array, element.data.id, element.data.log, element.data.transform])

    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
               <div style={{flex: 1, textAlign:"left"}}>
                <p>Array: </p>
                <input className="edit-input" type="text" value={array} onChange={(e)=>setArray(e.target.value)} placeholder="jq command to produce an array of objects" />
            </div>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Action: </p>
                <Editor
                    placeholder="Please enter YAML object as the action"
                    className={"language-yaml"}
                    value={action}
                    onValueChange={code => setAction(code)}
                    highlight={code => prism.highlight(code, prism.languages.yaml)}
                    padding={3}
                    style={{
                        minHeight:"100px",
                        borderRadius:"3px",
                        maxWidth: "270px",
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                    }}
                />
            </div>
            <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )
}

export function ErrorSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        let bs = blocks
    let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data.error = error
                bs[i].data.message = message
                bs[i].data["transform"] = yaml
                bs[i].data["log"] = log
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.error !== "") {
                setError(element.data.error)
            } else {
                setError("")
            }
    
            if(element.data.message !== "") {
                setMessage(element.data.message)
            } else {
                setMessage("")
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[element.data, currId])

    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Error: </p>
            <input className="edit-input" type="text" value={error} onChange={(e)=>setError(e.target.value)} placeholder="Error code, catchable on a calling workflow." />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Message: </p>
            <input className="edit-input" type="text" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Format string to provide more context to the error." />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Transform: </p>
                    <Editor
                        placeholder="Enter Transform as YAML."
                        className={"language-yaml"}
                        value={transform}
                        onValueChange={code => setTransform(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )
}

export function DelaySelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props
    const [duration, setDuration] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        let bs = blocks
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            ShowErr(`Error changing '${element.id}': YAML must be an 'object' type not a type of '${typeof yaml}'`, setErr)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                if(duration === "") {
                    ShowErr(`Error changing '${element.id}': Requires a duration`, setErr)
                    return
                }
                bs[i].data.duration = duration
                bs[i].data["transform"] = yaml
                bs[i].data["log"] = log
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.duration !== "") {
                setDuration(element.data.duration)
            } else {
                setDuration("")
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
  
    },[element.data, currId])


    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Duration: </p>
            <input className="edit-input" type="text" value={duration} onChange={(e)=>setDuration(e.target.value)} placeholder="Duration to delay eg PT5S" />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Transform: </p>
                    <Editor
                        placeholder="Enter Transform as YAML."
                        className={"language-yaml"}
                        value={transform}
                        onValueChange={code => setTransform(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function SwitchSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                throw new Error(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            } 
            let bs = blocks
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data["defaultTransform"] = yaml
                    bs[i].data["log"] = log
                    setBlocks(bs)
                }
            }
        } catch(e) {
            ShowErr(`Error changing state '${element.id}': ${e.message}`, setErr)
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.defaultTransform) {
                setTransform(YAML2String.stringify(element.data.defaultTransform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[currId, element.data.id, element.data.log, element.data.defaultTransform])


    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Default Transform: </p>
                    <Editor
                        placeholder="Enter Transform as YAML."
                        className={"language-yaml"}
                        value={transform}
                        onValueChange={code => setTransform(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
                <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )
}

export function EdgeSelected(props) {
    const {element, deleteElement} = props
    const [currId, setCurrId] = useState("")

    useEffect(()=>{
        if(currId !== element.id) {
        }
        setCurrId(element.id)
    },[currId, element.id])

    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
  
    <input  type="submit" value="Delete Edge" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

        {/* <input  type="submit" value="Change" onClick={()=>changeState()}/> */}
    </div>
</div>
    )

}

export function NoopSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                throw new Error(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            } 
            let bs = blocks
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data["transform"] = yaml
                    bs[i].data["log"] = log
                    setBlocks(bs)
                }
            }
        } catch(e) {
            ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[currId, element.data.id, element.data.log, element.data.transform])

    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Transform: </p>
                    <Editor
                        placeholder="Enter Transform as YAML."
                        className={"language-yaml"}
                        value={transform}
                        onValueChange={code => setTransform(code)}
                        highlight={code => prism.highlight(code, prism.languages.yaml)}
                        padding={3}
                        style={{
                            minHeight:"100px",
                            borderRadius:"3px",
                            maxWidth: "270px",
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                        }}
                    />
                </div>
                <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
                <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )

}

export function GenerateEventSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [currId, setCurrId] = useState("")
    const [type, setType] = useState("")
    const [source, setSource] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                throw new Error(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            } 
            let bs = blocks
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data.event.type = type
                    bs[i].data.event.source = source
                    bs[i].data.transform = yaml
                    bs[i].data.log = log
                    setBlocks(bs)
                }
            }
        } catch(e) {
            ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
        }
     
    }


    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.event.type !== "") {
                setType(element.data.event.type)
            } else {
                setType("")
            }
    
            if(element.data.event.source !== "") {
                setSource(element.data.event.source)
            } else {
                setSource("")
            }
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
        }
        setCurrId(element.data.id)
    },[element.data, currId])


    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Type: </p>
            <input className="edit-input" type="text" value={type} onChange={(e)=>setType(e.target.value)} placeholder="Cloudevent type" />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Source: </p>
            <input className="edit-input"  type="text" value={source} onChange={(e)=>setSource(e.target.value)} placeholder="Cloudevent source" />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
            <p>Transform: </p>
            <Editor
                placeholder="Please enter YAML to transform state"
                className={"language-yaml"}
                value={transform}
                onValueChange={code => setTransform(code)}
                highlight={code => prism.highlight(code, prism.languages.yaml)}
                padding={3}
                style={{
                    minHeight:"100px",
                    borderRadius:"3px",
                    maxWidth: "270px",
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                }}
            />
        </div>
        <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
        <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function ActionSelected(props) {
    const {element, blocks, setBlocks, deleteElement, setErr} = props

    const [action, setAction] = useState("")
    const [log, setLog] = useState("")
    const [transform, setTransform] = useState("")
    const [currId, setCurrId] = useState("")
    // action text area check if function is provided if not error

    function changeState() {

        let bs = blocks
        let actionjson = null
        let transformyaml = null

        try {
            actionjson = YAML.load(action)
            if(!actionjson.function) {
                throw new Error("An action must have a function name")
            }
        } catch(e) {
            ShowErr(`Error changing '${element.id}': ${e.message}`, setErr)
            return
        }

        try {
            transformyaml = YAML.load(transform)
        } catch(e) {
            ShowErr(`Error changing '${element.id}': Unable to parse transform as valid YAML`, setErr)
            return
        }

        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                if(actionjson !== null) {
                    bs[i].data["action"] = actionjson
                }
                bs[i].data["transform"] = transformyaml
                bs[i].data["log"] = log
                setBlocks(bs)
            }
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
            if(element.data.transform) {
                setTransform(YAML2String.stringify(element.data.transform))
            } else {
                setTransform("")
            }
            if(element.data.log) {
                setLog(element.data.log)
            } else {
                setLog("")
            }
            if(element.data.action) {
                if(Object.keys(element.data.action).length === 0) {
                    setAction(YAML2String.stringify({
                        function: "",
                        input: {
                            placeholder: "value"
                        }
                    }))
                } else {
                    setAction(YAML2String.stringify(element.data.action))
                }
            } else {
                setAction(YAML2String.stringify({
                    function: "",
                    input: {
                        placeholder: "value"
                    }
                }))
            }
        }
        setCurrId(element.data.id)
    },[element.data, currId])


    return (
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Action: </p>
                <Editor
                    placeholder="Please enter YAML object as the action"
                    className={"language-yaml"}
                    value={action}
                    onValueChange={code => setAction(code)}
                    highlight={code => prism.highlight(code, prism.languages.yaml)}
                    padding={3}
                    style={{
                        minHeight:"100px",
                        borderRadius:"3px",
                        maxWidth: "270px",
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                    }}
                />
            </div>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Transform: </p>
                <Editor
                    placeholder="Please enter YAML to transform state"
                    className={"language-yaml"}
                    value={transform}
                    onValueChange={code => setTransform(code)}
                    highlight={code => prism.highlight(code, prism.languages.yaml)}
                    padding={3}
                    style={{
                        minHeight:"100px",
                        borderRadius:"3px",
                        maxWidth: "270px",
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                    }}
                />
            </div>
            <div style={{flex: 1, textAlign:"left"}}>
                    <p>Log: </p>
                    <input className="edit-input" type="text" value={log} onChange={(e)=>setLog(e.target.value)} />
                </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

        <input  type="submit" value="Change" onClick={()=>changeState()}/>
    </div>
        </div>
    )
}
