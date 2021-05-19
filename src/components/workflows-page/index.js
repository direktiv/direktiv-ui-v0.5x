import React, { useEffect } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { useDropzone } from 'react-dropzone'

import YAML from "js-yaml"
import YAMLtoString from "yaml"

import { useCallback } from 'react'
import { useState } from 'react'
import { useContext } from 'react'
import MainContext from '../../context'
import { useHistory } from 'react-router'
import {Link} from 'react-router-dom'
import { IoAddSharp, IoCloudUploadSharp, IoList, IoToggle, IoToggleOutline, IoTrash, IoCodeOutline } from 'react-icons/io5'
import {NoResults} from '../../util-funcs'
import Modal from 'react-modal';
import { ConfirmButton } from '../confirm-button'
import { validateName } from "../../util-funcs"
import { TemplateHighlighter } from '../instance-page/input-output'
import Interactions from './interactions'
import {Searcher} from "fast-fuzzy"


const noopState = `id: noop
description: ""
states:
    - id: helloworld
      type: noop
      transform: '{ result: "Hello world!" }'
`

export default function WorkflowsPage() {
    const { fetch, namespace, handleError, checkPerm, permissions, namespaceInteractions } = useContext(MainContext)
    const [workflows, setWorkflows] = useState({})
    const [workflowKeys, setWorkflowKeys] = useState([])
    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")
    const [modalOpen, setModalOpen] = useState(false)

    // Search Engine States, TODO: Optimise for large workflows list
    const [searchPattern, setSerachPattern] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searcher, setSearcher] = useState(new Searcher(
    [],))

    function toggleModal() {
        setModalOpen(!modalOpen)
    }

    function afterOpenModal(){
        console.log('modal open')
    }



    const fetchWorkflows = useCallback(() => {
        // FIXME: This should stop bad fetches when namespace = <empty-string> before useContext 
        // populates the namespace value.
        // This is temp fix, this problem occurs on other components and can probably fixed globally
        // with changes to App.js
        if (!namespace) {
            return
        }
        async function fetchWfs() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/?offset=0`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.workflows) {
                        let wfDictionary = Object.assign({}, ...json.workflows.map((x) => ({[x.id]: x})));
                        setWorkflows(wfDictionary)
                    } else {
                        setWorkflows({})
                    }
                } else {
                    await handleError('fetch workflows', resp, 'listWorkflows')
                }
            } catch (e) {
                setErr(`Failed to fetch workflows: ${e.message}`)
            }
        }
        fetchWfs()
    }, [namespace, fetch, handleError])

    const deleteWorkflow = async (id) => {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${id}`, {
                method: "DELETE"
            })
            if (!resp.ok) {
                    await handleError('delete workflow', resp, 'deleteWorkflow')
            }
            fetchWorkflows()
        } catch (e) {
            setActionErr(`Failed to delete workflow ${id}: ${e.message}`)
        }
    }

    const toggleWorkflow = async (id) => {
        try {
            let resp = await fetch(`/namespaces/${namespace}/workflows/${id}/toggle`, {
                method: "PUT",
            })
            if (!resp.ok) {
                    await handleError('toggle workflow', resp, 'toggleWorkflow')                    
            }
            fetchWorkflows()
        } catch (e) {
            setActionErr(`Failed to toggle workflow ${id}: ${e.message}`)
        }
    }

    useEffect(() => {
        if (workflows !== undefined) {
            const wfKeys = Object.keys(workflows)
            setSearcher(new Searcher(
                wfKeys,
            ))
            setWorkflowKeys(wfKeys)
        }
    }, [workflows])

    useEffect(() => {
        if (searchPattern !== "") {
            setSearchResults(searcher.search(searchPattern))
        } else {
            setSearchResults(workflowKeys)
        }
    }, [searchPattern, workflowKeys, searcher])
    
    useEffect(() => {
        fetchWorkflows()        
    }, [fetchWorkflows])

    return (
        <>
            {namespace !== "" ?
                <div className="container" style={{ flex: "auto", padding: "10px" }}>
                    <Modal 
                        isOpen={modalOpen}
                        onAfterOpen={afterOpenModal}
                        onRequestClose={toggleModal}
                        contentLabel="API Interactions"
                    >
                        <Interactions interactions={namespaceInteractions(namespace)} type="Namespace" />
                    </Modal>
                    <div className="container">
                        <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                            <Breadcrumbs elements={["Workflows"]} />
                            <div style={{ display: "flex", flex:2, flexDirection: "row-reverse", alignItems: "center", marginRight: "12px" }}>
                                <div onClick={() => toggleModal()} title={"APIs"} className="circle button" style={{ position: "relative", zIndex: "5" }}>
                                    <span style={{ flex: "auto" }}>
                                        <IoCodeOutline className={"toggled-switch"} style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                                    </span>
                                </div> 
                            </div>
                        </div>
                    </div>
                    <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                        <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "4", minWidth: "400px" }}>
                            <TileTitle name="All workflows">
                                <IoList />
                            </TileTitle>
                            <div style={{ display: "flex", fontSize: "14pt", fontWeight: "bold", alignItems: "center", padding: "0px 20px 5px 10px"}}>
                                <div style={{paddingRight: "12pt"}}>
                                    Search:
                                </div>
                                <div style={{flexGrow: 1}}>
                                    <input value={searchPattern} style={{width: "100%"}} type="text" placeholder={"Workflow Search Query"} onChange={(ev) => {
                                        setSerachPattern(ev.target.value)
                                      }}></input>
                                </div>
                            </div>

                            <div id="events-table" style={{ display: "flex", flexDirection: "column" }}>
                                {err ? 
                                    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                    {err}
                                </div>
                                :
                                <>
                                {actionErr !== "" ?  <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                            {actionErr}
                        </div>
                                :""}
                                <>
                                {workflowKeys.length === 0 || (searchPattern !== "" && searchResults.length === 0) ?
                                    <NoResults /> :
                                    <>
                                        {searchResults.map(function (wfID) {
                                            if (!(wfID in workflows)) {
                                                return (<></>);
                                            }
                                            return (
                                                <Link key={`workflow-item-${wfID}`} style={{ color: "inherit", textDecoration: "inherit" }} className="workflows-list-item" to={`/${namespace}/w/${wfID}`}>
                                                    <div className="workflows-list-name">
                                                        {wfID}
                                                    </div>
                                                    <div className="workflows-list-description">
                                                        {workflows[wfID].description === "" ? "No description has been provided." : workflows[wfID].description}
                                                    </div>
                                                    <div style={{ flexGrow: "1", flexBasis: "0" }}>
                                                        <div className="actions-button-div">
                                                          {checkPerm(permissions, "toggleWorkflow") ?
                                                          <>
                                                            {workflows[wfID].active ?
                                                                <div className="button circle success" onClick={(ev) => {
                                                                    ev.preventDefault();
                                                                    toggleWorkflow(wfID)
                                                                }}>
                                                                    <span>
                                                                        <IoToggle />
                                                                    </span>
                                                                </div>
                                                                :
                                                                <div className="button circle" onClick={(ev) => {
                                                                    ev.preventDefault();
                                                                    toggleWorkflow(wfID)
                                                                }}>
                                                                    <span>
                                                                        <IoToggleOutline className={"toggled-switch"} />
                                                                    </span>
                                                                </div>
                                                            }
                                                            </>: ""}
                                                            {checkPerm(permissions, "deleteWorkflow") ? 
                                                            
                                                            <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                                                                ev.preventDefault();
                                                                deleteWorkflow(wfID)
                                                            }} /> : ""}
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </>
                                }
                                </>
                                </>
}
                            </div>
                        </div>
                        {checkPerm(permissions, "createWorkflow") || checkPerm(permissions, "namespaceEvent") ? 
                        <div className="container" style={{ flexWrap: "wrap", flex: "auto" }}>
                            {checkPerm(permissions, "createWorkflow") ? 
                            <>
                            <div className="shadow-soft rounded tile" style={{ minWidth: "350px" }}>
                                <TileTitle name="Upload workflow file">
                                    <IoCloudUploadSharp />
                                </TileTitle>
                                <UploadWorkflowForm />
                            </div>
                            <div className="shadow-soft rounded tile" style={{ minWidth: "350px" }}>
                                <TileTitle name="Create new workflow">
                                    <IoAddSharp />
                                </TileTitle>
                                <NewWorkflowForm />
                            </div></>
                            : ""}
                            {checkPerm(permissions, "namespaceEvent") ?
                            <div className="shadow-soft rounded tile" style={{ minWidth: "350px" }}>
                                <TileTitle name="Send namespace event">
                                    <IoAddSharp />
                                </TileTitle>
                                <APIInteractionTile />
                            </div>: ""}
                        </div>:""}
                    </div>
                </div>
                : ""}
        </>
    )
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (res) => {
            resolve(res.target.result)
        }

        reader.onerror = (err) => reject(err)
        reader.readAsText(file)
    })
}

function parseYaml(fetch, name, namespace, data, setErr, history, handleError) {
    const invalidNameErr = validateName(name, "workflow name")
    if (invalidNameErr) {
        setErr(`Name is invalid: ${invalidNameErr}`)
        return
    }

    try {
        let y = YAML.load(data, 'utf8')
        y.id = name
        createWorkflow(fetch, YAMLtoString.stringify(y), namespace, setErr, undefined, history, handleError)
    } catch (e) {
        setErr(`Unable to parse YAML: ${e.message}`)
    }
}

async function createWorkflow(fetch, data, namespace, setErr, setFiles, history, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/workflows`, {
            headers: {
                "Content-Type": "text/yaml",
                "Content-Length": data.length,
            },
            method: "post",
            body: data,
        })
        if (resp.ok) {
            let json = await resp.json()
            if (setFiles) {
                setFiles([])
            }
            // setErr("")
            history.push(`/${namespace}/w/${json.id}`)
        } else {
                await handleError('create workflow', resp, 'createWorkflow')
        }
    } catch (e) {
        setErr(`Workflow creation failed: ${e.message}`)
    }
}

function APIInteractionTile() {

    const { fetch, namespace, handleError } = useContext(MainContext)

    const [val, setVal] = useState("")
    const [err, setErr] = useState("")

    async function sendEvent() {
        if (val !== "") {
            try {
                let resp = await fetch(`/namespaces/${namespace}/event`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: val
                })
                if (resp.ok) {
                    setVal("")
                    setErr("")
                } else {
                        await handleError('send event', resp, 'namespaceEvent')
                }
            } catch (e) {
                setErr(`Failed to send cloud event: ${e.message}`)
            }
        } else {
            setErr(`Send Cloud Event: Failed to send cloud event as input is empty`)
        }
        
    }


    return (
        <div>
            <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={13} style={{ width: "100%", height: "100%", resize: "none" }} />
            {err !== "" ?
                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {err}
                </div>
                :
                ""
            }
            <div style={{ textAlign: "right" }}>
                <input onClick={() => sendEvent()} type="submit" value="Submit" />
            </div>
        </div>
    )
}

function UploadWorkflowForm() {
    const { fetch, namespace, handleError } = useContext(MainContext)
    const history = useHistory()

    const [data, setData] = useState("")
    const [files, setFiles] = useState([])
    const [err, setErr] = useState("")

    return (
        <div>
            <div className="file-form">
                <Basic setErr={setErr} files={files} setFiles={setFiles} data={data} setData={setData} />
            </div>
            {err !== "" ?
                <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {err}
                </div>
                :
                ""
            }
            <div style={{ textAlign: "right" }}>
                <input onClick={() => {
                    let invalidNameErr;
                    try {
                        // Check if file is a valid yaml
                        const y = YAML.load(data, 'utf8')
                        invalidNameErr = validateName(y.id, "id")
                    } catch (e) {
                        setErr(`File is not a valid: ${e.reason}`)
                        return
                    }

                    // Check if id is a valid name
                    if (invalidNameErr) {
                        setErr(`Invalid workflow: ID: ${invalidNameErr}`)
                    } else {
                        createWorkflow(fetch, data, namespace, setErr, setFiles, history, handleError)
                    }
                }} type="submit" value="Submit" />
            </div>
        </div>
    )
}

function NewWorkflowForm() {

    const { fetch, namespace, handleError } = useContext(MainContext)
    const history = useHistory()

    const [name, setName] = useState("")
    const [template, setTemplate] = useState("")
    const [templates, setTemplates] = useState([])
    const [templateData, setTemplateData] = useState("")
    const [err, setErr] = useState("")

    const fetchTempData = useCallback((temp, setData) => {
        async function fetchd() {
            if(temp !== "default-noop"){
                try {
                    let resp = await fetch(`/workflow-templates/default/${temp}`, {
                        method: "GET"
                    })
                    if (resp.ok) {
                        let text = await resp.text()
                        setData(text)
                    } else {
                            await handleError('fetch template', resp, 'getWorkflowTemplate')
                    }
                } catch (e) {
                    setErr(`Failed to fetch template data: ${e.message}`)
                }
            } else {
                setTemplateData(noopState)
            }
        }
        fetchd()
    }, [fetch, handleError])

    const fetchTemps = useCallback((load) => {
        async function fetchTemplates() {
            try {
                let resp = await fetch(`/workflow-templates/default/`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if(load){
                        setTemplate("default-noop")
                        setTemplateData(noopState)
                        setTemplates(json)
                    }
                } else {
                        await handleError('fetch templates', resp, 'listWorkflowTemplates')
                }
            } catch (e) {
                setErr(`Failed to fetch a list of templates: ${e.message}`)
                setTemplate("default-noop")
                setTemplateData(noopState)
            }
        }
        fetchTemplates()
    }, [fetch, handleError])

    useEffect(() => {
        fetchTemps(true)
    }, [fetchTemps])

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            parseYaml(fetch, name, namespace, templateData, setErr, history, handleError)
        }
    }

    return (
        <div style={{ fontSize: "12pt" }}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Name:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input value={name}  onKeyDown={handleKeyDown} onChange={(e) => setName(e.target.value)} type="text" placeholder="Workflow name" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Template:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <select value={template} onChange={(e) => {
                                setTemplate(e.target.value)
                                fetchTempData(e.target.value, setTemplateData)
                            }}>
                                <option key="default-noop">default-noop</option>
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
                <div style={{ marginTop: "10px",  borderRadius: "4px", padding: "10px" }}>
                        <div style={{ maxWidth: "550px", minWidth: "550px", margin:"auto" }}>
                            {templateData !== "" ?
                            <TemplateHighlighter id={template} data={templateData} lang={"yaml"}/>
                            :
""}
                        </div>
                </div>
            </div>
            <div className="divider-dark" />
            {
                err !== "" ?
                    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                        {err}
                    </div>
                    :
                    ""
            }
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Submit" onClick={() => { parseYaml(fetch, name, namespace, templateData, setErr, history) }} />
            </div>
        </div>
    )
}

function Basic(props) {
    const { setData, files, setFiles, setErr } = props

    const onDrop = useCallback(
        async (acceptedFiles, fileRejections) => {
            if (fileRejections.length > 0) {
                setErr(`Invalid File: File: '${fileRejections[0].file.name}' is not supported, ${fileRejections[0].errors[0].message}`)
            } else {
                setData(await readFile(acceptedFiles[0]))
                setFiles([...acceptedFiles]);
            }
        },
        [setData, setFiles, setErr]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: "application/x-yaml, .yaml, .yml",
        maxFiles: 1,
        multiple: false
    });

    return (
        <section className="container">
            <div {...getRootProps({ className: 'dropzone' })} style={{ cursor: "pointer" }}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop a file here, or click to select file</p>
                <aside style={{ minHeight: "32px", textAlign: "center" }}>
                    <ul>
                        {
                            files.map((file) => <li key={file.path}>{file.path} - {file.size} bytes</li>)
                        }
                    </ul>
                </aside>
            </div>
        </section>
    );
}