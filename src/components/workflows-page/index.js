import React, { useEffect } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { useDropzone } from 'react-dropzone'

import YAML from "js-yaml"
import YAMLtoString from "yaml"

import PlusCircleFill from 'react-bootstrap-icons/dist/icons/plus-circle-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import { FileCode } from 'react-bootstrap-icons'
import { useCallback } from 'react'
import { useState } from 'react'
import { useContext } from 'react'
import MainContext from '../../context'
import { useHistory } from 'react-router'

export default function WorkflowsPage() {
    const {fetch, namespace} = useContext(MainContext)
    const history = useHistory()
    const [workflows, setWorkflows] = useState([])
    
    const fetchWorkflows = useCallback(()=>{
        async function fetchWfs() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/?offset=0`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setWorkflows(json.workflows)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                console.log(e, "todo")
            }
        }
        fetchWfs()
    },[namespace])

    const deleteWorkflow = async (id) => {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${id}`,{
                method: "DELETE"
            })
            if(!resp.ok){
                throw new Error(await resp.text())
            }
            fetchWorkflows()
        } catch(e) {
            console.log(e, "todo delete handle err")
        }
    }

    const toggleWorkflow = async (id) => {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${id}/toggle`, {
                method: "PUT",
            })
            if (!resp.ok) {
                throw new Error(await resp.text())
            } 
            fetchWorkflows()
        } catch(e) {
            console.log(e, "todo action")
        }
    }

    useEffect(()=>{
        fetchWorkflows()
    },[namespace])

    return (
        <>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="neumorph" style={{ flex: "auto", flexGrow: "4", minWidth: "400px" }}>
                    <TileTitle name="All workflows">
                        <CardList />
                    </TileTitle>
                    <div id="events-table">
                        <table style={{width: "100%"}}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workflows.map((obj)=>{
                                    return(
                                        <tr className="event-list-item" onClick={()=>history.push(`/w/${obj.id}`)}>
                                            <td style={{textAlign:"left", paddingLeft:"5px"}}>
                                                {obj.id}
                                            </td>
                                            {obj.description === "" ?
                                                <td style={{textAlign:"left", paddingLeft:"5px"}}>No description has been provided.</td>
                                                :
                                                <td style={{textAlign:"left", paddingLeft:"5px"}}>{obj.description}</td>
                                            }
                                            <td onClick={(ev)=>ev.stopPropagation()} style={{paddingLeft:"5px"}}>
                                                <button onClick={()=>deleteWorkflow(obj.uid)}>delete</button>
                                                {obj.active ?
                                                    <button onClick={()=>toggleWorkflow(obj.uid)}>disable</button>
                                                    :
                                                    <button onClick={()=>toggleWorkflow(obj.uid)}>enable</button>
                                                }
                                            </td>
                                        </tr>
                                    )
                                    
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="container" style={{ flexWrap: "wrap", flex: "auto" }}>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Upload workflow file">
                            <FileCode />
                        </TileTitle>
                        <UploadWorkflowForm />
                    </div>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Create new workflow">
                            <PlusCircleFill />
                        </TileTitle>
                        <NewWorkflowForm />
                    </div>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Send namespace event">
                            <PlusCircleFill />
                        </TileTitle>
                        <APIInteractionTile />
                    </div>
                </div>
            </div>
        </>
    )
}

function readFile(file) {
    return new Promise((resolve, reject)=> {
        const reader = new FileReader();

        reader.onload = (res) => {
            resolve(res.target.result)
        }

        reader.onerror = (err) => reject(err)
        reader.readAsText(file)
    })
}

function parseYaml(fetch, name, namespace, data, setErr, history) {
    try {
        let y = YAML.load(data, 'utf8')
        y.id = name
        createWorkflow(fetch, YAMLtoString.stringify(y), namespace, setErr, undefined, history)
    } catch(e) {
        setErr(e.message)
    }
}

async function createWorkflow(fetch, data, namespace, setErr, setFiles, history) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/workflows`, {
            headers: {
                "Content-Type": "text/yaml",
                "Content-Length": data.length,
            },
            method: "post",
            body: data,
        })
        if(resp.ok) {
            let json = await resp.json()
            if(setFiles){
                setFiles([])
            }
            setErr("")
            console.log('todo show message or notification it was created')
            history.push(`/w/${json.id}`)
        } else {
            throw new Error(await resp.text())
        }
    } catch(e) {
        setErr(e.message)
    }
}

function APIInteractionTile() {
    return (
        <div>
            
        </div>
    )
}

function UploadWorkflowForm() {
    const {fetch, namespace} = useContext(MainContext)
    const history = useHistory()

    const [data, setData] = useState("")
    const [files, setFiles] = useState([])
    const [err, setErr] = useState("")

    return(
        <div>
            <div className="file-form">
                <Basic files={files} setFiles={setFiles} data={data} setData={setData} />
            </div>
            {err !== "" ?
                <div style={{fontSize:"12px", paddingTop:"5px", paddingBottom:"5px", color:"red"}}>
                    {err}
                </div>
                :
                ""
            }
            <div style={{ textAlign: "right" }}>
                <input onClick={()=>createWorkflow(fetch, data, namespace, setErr, setFiles, history)} type="submit" value="Submit" />
            </div>
        </div>
    )
}

function NewWorkflowForm() {

    const {fetch, namespace} = useContext(MainContext)
    const history = useHistory()

    const [name, setName] = useState("")
    const [template, setTemplate] = useState("")
    const [templates, setTemplates] = useState([])
    const [templateData, setTemplateData] = useState("")
    const [err, setErr] = useState("")

    async function fetchTempData(temp, setData) {
        try {
            let resp = await fetch(`/github/templates/vorteil/direktiv-apps`, {
                method: "POST",
                body: JSON.stringify({id: temp})
            })
            if(resp.ok) {
                let text = await resp.text()
                setData(text)       
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            console.log("todo", e)
        }
    }

    const fetchTemps = useCallback((load)=>{
        async function fetchTemplates(){
            try {
                let resp = await fetch(`/github/templates/vorteil/direktiv-apps`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    if(load){
                        setTemplate("noop")
                        fetchTempData("noop", setTemplateData)
                        setTemplates(json)
                    }
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                console.log(e)
                console.log('todo handle error')
            }
        }
        fetchTemplates()
    },[])

    useEffect(()=>{
        fetchTemps(true)
    },[])

    return(
        <div style={{ fontSize: "12pt" }}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Name:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder="Workflow name" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Template:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <select value={template} onChange={(e)=>{
                                setTemplate(e.target.value)
                                fetchTempData(e.target.value, setTemplateData)
                            }}>
                                {
                                    templates.map((obj) => <option key={obj} value={obj}>{obj}</option>)
                                }
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className="divider-dark" />
            <div>
                <div style={{ textAlign: "left", fontSize: "10pt" }}>
                    <span>
                        Template Preview
                    </span>
                </div>
                <div style={{ marginTop: "10px", backgroundColor: "#252525", borderRadius: "4px", padding: "10px" }}>
                    <code style={{ textAlign: "left", maxWidth:"300px" }}>
                       <pre>
                           {templateData}
                       </pre>
                    </code>
                </div>
            </div>
            <div className="divider-dark" />
            {
                err !== "" ?
                <div style={{fontSize:"12px", paddingTop:"5px", paddingBottom:"5px", color:"red"}}>
                    {err}
                </div>
                :
                ""
            }
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Submit" onClick={()=>{parseYaml(fetch, name, namespace, templateData, setErr, history)}} />
            </div>
        </div>
    )
}

function Basic(props) {
    const {setData, files, setFiles} = props
    
    const onDrop = useCallback(async(f) => {
        setData(await readFile(f[0]))
        setFiles(f)
    },[])

    const {getRootProps, getInputProps} = useDropzone({onDrop});
    
    return (
      <section className="container">
        <div {...getRootProps({className: 'dropzone'})}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        <aside>
          <ul>
            {
              files.map((file)=><li key={file.path}>{file.path} - {file.size} bytes</li>)
            }
          </ul>
        </aside>
      </section>
    );
  }