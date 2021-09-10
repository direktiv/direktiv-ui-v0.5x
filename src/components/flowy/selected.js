import {  useEffect, useState } from "react"

// load the string into an object
import YAML from 'js-yaml'
import Editor from 'react-simple-code-editor';

// Stringify the object
import YAML2String from 'yaml'

var prism = require('prismjs');
require('prismjs/components/prism-yaml')


export function GetterOrSetterSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [variables, setVariables] = useState([])
    const [err, setErr] = useState("")
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
                        setErr(`Variable ${i} must have a value provided to set.`)
                        return
                    }
                }
                if(!json.key || !json.scope) {
                    setErr(`Variable ${i} must have a key and scope provided.`)
                    return
                } else {
                    acts.push(json)
                }
            } catch(e) {
                setErr(`JSON is invalid for Action ${i}.`)
                return
            }
        }

        let bs = blocks
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            return
        } 
        for(let x=0; x < bs.length; x++) {
            if(bs[x].id === element.data.id) {
                bs[x].data["variables"] = acts
                bs[x].data["log"] = log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
                setErr("")
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
                    vars.push({
                        name: `variable-${variables.length}`,
                        value: ""
                    })
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
                        console.log(acs)

                        setVariables(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} />: "" }
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = variables
                        variables.push({
                            name: `action-${variables.length}`,
                            value: ""
                        })
                        setVariables(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )

}

export function EventAndXorSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [events, setEvents] = useState([])
    const [err, setErr] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")


    function changeState() {
        let acts = []
        for(let i=0; i < events.length; i++) {
            console.log(events[i])
            try {
                let json = YAML.load(events[i].value)
                if(element.data.type === "eventXor") {
                    if(!json.event) {
                        setErr(`Event ${i} requires the event object.`)
                        return
                    } else  if(!json.event.type) {
                        setErr(`Event ${i} requires the event type inside the event object.`)
                        return
                    } else {
                        acts.push(json)
                    }
                } else {
                    if(!json.type) {
                        setErr(`Event ${i} requires an event type`)
                        return
                     } else {
                        acts.push(json)
                    }
                }
            } catch(e) {
                setErr(`YAML is invalid for Event ${i}.`)
                return
            }
        }
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            return
        } 
        let bs = blocks
        for(let x=0; x < bs.length; x++) {
            if(bs[x].id === element.data.id) {
                bs[x].data["events"] = acts
                bs[x].data["log"]= log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
                setErr("")
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
                evs.push({
                    name: `event-${events.length}`,
                    value: ""
                })
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
                        console.log(acs)

                        setEvents(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} /> : ""}
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = events
                        events.push({
                            name: `action-${events.length}`,
                            value: ""
                        })
                        setEvents(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
        
        
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
                <hr />
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )

}

export function ParallelSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [actions, setActions] = useState([])
    const [err, setErr] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")


    function changeState() {
        let acts = []
        for(let i=0; i < actions.length; i++) {
            try {
                let yml = YAML.load(actions[i].value)
                if(!yml.function) {
                    setErr(`Action ${i} must have a function name`)
                    return
                } else {
                    acts.push(yml)
                }
            } catch(e) {
                setErr(`YAML is invalid for Action ${i}.`)
                return
            }
        }
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            return
        } 
        let bs = blocks
        for(let x=0; x < bs.length; x++){
            console.log(bs[x])
            if(bs[x].id === element.data.id) {
                bs[x].data["actions"] = acts
                bs[x].data["log"] = log
                bs[x].data["transform"] = yaml
                setBlocks(bs)
                setErr("")
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
                    value: ""
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
                        console.log(acs)

                        setActions(JSON.parse(JSON.stringify(acs)))
                    }}  style={{marginRight:"3px"}} /> : ""}
                                <input type="submit" value="Add" onClick={()=>{
                        let acs = actions
                        actions.push({
                            name: `action-${actions.length}`,
                            value: ""
                        })
                        setActions(JSON.parse(JSON.stringify(acs)))
                    }} />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
        </div>
    )
}

export function SchemaSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [schema, setSchema] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        let bs = blocks

        if(schema !== ""){
            try {
                let json = JSON.parse(schema)
                for(let i=0 ; i < bs.length; i++) {
                    if(bs[i].id === element.id) {
                        bs[i].data["schema"] = json
                        setErr("")
                        setBlocks(bs)
                    }
                }
            } catch(e) {
                setErr("Unable to parse schema as valid YAML")
            }
        } else {
            setErr("Image must be set")
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
                    />{/* <textarea value={schema} style={{width:"100%"}} onChange={(e)=>setSchema(e.target.value)} cols={4} rows={5} placeholder="Enter the JSON Schema to validate on" type="text" /> */}
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
        {
            err !== "" ? 
            <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                {err}
            </div>
            :
            ""
        }
            <input  type="submit" value="Delete Schema" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

        <input  type="submit" value="Change" onClick={()=>changeState()}/>
    </div>
        </div>
    )
}

export function FuncSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [image, setImage] = useState("")
    const [type, setType] = useState("")
    const [currId, setCurrId] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        let bs = blocks

        if(image !== ""){
            for(let i=0 ; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data["image"] = image
                    bs[i].data["type"] = type
                    setErr("")
                    setBlocks(JSON.parse(JSON.stringify(blocks)))
                }
            }
        } else {
            setErr("Image must be set")
        }
    }

    useEffect(()=>{
        if(currId !== element.data.id) {
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
        }
        setCurrId(element.data.id)
    },[element.data.id, element.data.image, currId])

    return(
        <div style={{marginTop:"10px", fontSize:"10pt", display:"flex", flexWrap:"wrap", flexDirection:"column"}}>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Image: </p>
                <input className="edit-input" type="text" value={image} onChange={(e)=>setImage(e.target.value)} placeholder="Enter the image name" />
            </div>
            <div style={{flex: 1, textAlign:"left"}}>
                <p>Type: </p>
                <input className="edit-input" type="text" value={type} onChange={(e)=>setType(e.target.value)} placeholder="Enter the type of function" />
            </div>
            <div style={{flex: 1, textAlign:"right", marginTop:"10px"}}>
                {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete Function" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )
}

export function  ValidateSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props
    const [schema, setSchema] = useState("")
    const [isJson, setIsJson] = useState(false)
    const [err, setErr] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")


    function changeState() {
        let bs = blocks
   let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
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
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function ConsumeEventSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props
    const [type, setType] = useState("")
    const [err, setErr] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")

    function changeState() {
        let bs = blocks
       let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data.event.type = type
                bs[i].data["transform"] = yaml
                bs[i].data["log"]=log
                setBlocks(bs)
                setErr("")
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
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )  
}

export function ForeachSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [array, setArray] = useState("")
    const [action, setAction] = useState("")
    const [err, setErr] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [currId, setCurrId] = useState("")

    
    function changeState() {
        let bs = blocks
        let actionjson = null

        try {
            actionjson = YAML.load(action)
            if(!actionjson.function) {
                setErr("An action must have a function name")
                return
            }
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    if(actionjson !== null) {
                        bs[i].data["action"] = actionjson
                    }
                    bs[i].data["array"] = `jq('${array}')`
                    setErr("")
                    setBlocks(bs)
                }
            }
        } catch(e) {
            setErr("Unable to parse action as valid JSON")
        }
        
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
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
                setAction("")
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
                {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
                <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>
                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )
}

export function ErrorSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        let bs = blocks
    let yaml = YAML.load(transform)
        if(typeof yaml !== "object" && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
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
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )
}

export function DelaySelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props
    const [duration, setDuration] = useState("")
    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        let bs = blocks
        let yaml = YAML.load(transform)
        if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
            setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
            return
        } 
        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                bs[i].data.duration = duration
                bs[i].data["transform"] = yaml
                bs[i].data["log"] = log
                setErr("")
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
        {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function SwitchSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
                return
            } 
            let bs = blocks
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data["defaultTransform"] = yaml
                    bs[i].data["log"] = log
                    setErr("")
                    setBlocks(bs)
                }
            }
        } catch(e) {
            setErr(`YAML is invalid ${e.message}`)
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
                {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
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
    const {element, blocks, setBlocks, deleteElement} = props

    const [currId, setCurrId] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
                return
            } 
            let bs = blocks
            for(let i=0; i < bs.length; i++) {
                if(bs[i].id === element.id) {
                    bs[i].data["transform"] = yaml
                    bs[i].data["log"] = log
                    setErr("")
                    setBlocks(bs)
                }
            }
        } catch(e) {
            setErr(`YAML is invalid ${e.message}`)
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
                {
                    err !== "" ? 
                    <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                        {err}
                    </div>
                    :
                    ""
                }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

                <input  type="submit" value="Change" onClick={()=>changeState()}/>
            </div>
        </div>
    )

}

export function GenerateEventSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [currId, setCurrId] = useState("")
    const [type, setType] = useState("")
    const [source, setSource] = useState("")
    const [transform, setTransform] = useState("")
    const [log, setLog] = useState("")
    const [err, setErr] = useState("")

    function changeState() {
        try {
            let yaml = YAML.load(transform)
            if(typeof yaml !== "object"  && typeof yaml !== "undefined") {
                setErr(`YAML must be an 'object' type not a type of '${typeof yaml}'`)
                return
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
            setErr(`Transform YAML is invalid ${e.message}`)
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
            {
                err !== "" ? 
                <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                    {err}
                </div>
                :
                ""
            }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

            <input  type="submit" value="Change" onClick={()=>changeState()}/>
        </div>
    </div>
    )    

}

export function ActionSelected(props) {
    const {element, blocks, setBlocks, deleteElement} = props

    const [action, setAction] = useState("")
    const [log, setLog] = useState("")
    const [transform, setTransform] = useState("")
    const [currId, setCurrId] = useState("")
    const [err, setErr] = useState("")
    // action text area check if function is provided if not error

    function changeState() {

        let bs = blocks
        let actionjson = null
        let transformyaml = null

        try {
            actionjson = YAML.load(action)
            if(!actionjson.function) {
                setErr("An action must have a function name")
                return
            }
        } catch(e) {
            setErr("Unable to parse action as valid YAML")
        }

        try {
            transformyaml = YAML.load(transform)
        } catch(e) {
            setErr("Unable to parse transform as valid YAML")
        }

        for(let i=0; i < bs.length; i++) {
            if(bs[i].id === element.id) {
                if(actionjson !== null) {
                    bs[i].data["action"] = actionjson
                }
                bs[i].data["transform"] = transformyaml
                bs[i].data["log"] = log
                setErr("")
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
                    setAction("")
                } else {
                    setAction(YAML2String.stringify(element.data.action))
                }
            } else {
                setAction("")
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
        {
            err !== "" ? 
            <div style={{textAlign:"center", color:"red", marginBottom:"10px"}}>
                {err}
            </div>
            :
            ""
        }
            <input  type="submit" value="Delete State" style={{marginRight:"3px"}} onClick={()=>deleteElement()}/>

        <input  type="submit" value="Change" onClick={()=>changeState()}/>
    </div>
        </div>
    )
}
