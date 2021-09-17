import { IoAdd, IoFlash, IoCodeWorkingOutline, IoList,  IoFolderOutline, IoPencil, IoCheckmarkSharp, IoSearch, IoSave, IoPlaySharp, IoSubwayOutline, IoTrash, IoEllipsisVerticalSharp, IoImageSharp, IoPieChartSharp } from "react-icons/io5";
import Editor from "../workflow-page/editor"

import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { ConfirmButton } from '../confirm-button'
import { useCallback, useContext, useEffect, useState, useRef } from "react";
import MainContext from "../../context";
import LoadingWrapper  from "../loading";
import { useHistory, useParams } from "react-router";
import { TemplateHighlighter } from "../instance-page/input-output";
import { SuccessOrFailedWorkflows } from '../dashboard-page'
import Details from "./explorer-components/details";
import EditorDetails from "./explorer-components/editor";
import ExportWorkflow from '../workflow-page/export'
import Modal from 'react-modal';


import { Workflow, WorkflowActiveStatus, WorkflowExecute, WorkflowSetActive, WorkflowUpdate } from "./api";
import ButtonWithDropDownCmp from "../instance-page/actions-btn";

export default function Explorer() {

    const {fetch, handleError, namespace} = useContext(MainContext)
    const params = useParams()

    const [loading, setLoading] = useState(true)
    const [typeOfRequest, setTypeOfRequest] = useState("")
    const [err, setErr] = useState("")

    useEffect(()=>{
        async function getTypeOfNode() {
            if(typeOfRequest === "") {
                try {
                    let uri = `/flow/namespaces/${namespace}/node`
                    if(params[0]) {
                        uri += `/${params[0]}`
                    }
                    let resp = await fetch(`${uri}/`, {
                        method: "GET"
                    })
                    if(resp.ok) {
                        let json = await resp.json()
                        setTypeOfRequest(json.node.type)
                        setLoading(false)
                    } else {
                        await handleError(`fetch details at path /${params[0]}`, resp, "TODO PERMISSION")
                    }
                } catch(e) {
                    setErr(`Error fetching path type: ${e.message}`)
                    setLoading(false)
                }
            }
        }
        getTypeOfNode()
    },[fetch, handleError, params, typeOfRequest])

    return(
        <div className="container" style={{ flex: "auto" }}>
            <LoadingWrapper isLoading={loading}>
                {typeOfRequest === "workflow" ? 
                    <WorkflowExplorer />
                    :
                    ""
                }  
                {typeOfRequest === "directory" ?
                    <ListExplorer fetch={fetch} params={params} namespace={namespace} handleError={handleError} />
                    :
                    ""
                }
            </LoadingWrapper>
        </div>
    )
}

function WorkflowExplorer(props) {

    // context
    const {fetch, handleError, attributeAdd} = useContext(MainContext)
    // params
    const params = useParams()

    // Workflow States
    const [workflowValue, setWorkflowValue] = useState("")
    const wfRefValue = useRef(workflowValue)
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [workflowInfo, setWorkflowInfo] = useState({ revision: 0, active: true, fetching: true })
    
    // tabs
    const [tab, setTab] = useState("functions")
    const [editorTab, setEditorTab] = useState("editor")

    // Logs
    const [logEvent, setLogEvent] = useState("hello-world")
    const [showLogEvent, setShowLogEvent] = useState(false)

    // knative functions
    const [functions, setFunctions] = useState([])

    // metrics
    const [metricsLoading, setMetricsLoading] = useState(true)
    const [stateMetrics, setStateMetrics] = useState([])


    // handle execute
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const [executable, setExecutable] = useState(true)

    // error handling
    const [err, setErr] = useState("")
    const [executeErr, setExecuteErr] = useState("")
    const [actionErr, setActionErr] = useState("")
    const [toggleErr, setToggleErr] = useState("")
    const [workflowFuncErr, setWorkflowFuncErr] = useState("")

    // export modal
    const [exportModalOpen, setExportModalOpen] = useState(false)


    const codemirrorRef = useRef()


    // fetch workflow
    function setFetching(fetchState) {
        setWorkflowInfo((wfI) => {
            wfI.fetching = fetchState;
            return { ...wfI }
        })
    }

    const fetchWorkflow = useCallback(()=>{
        setFetching(true)
        async function fetchData() {
            try {
                let wf = await Workflow(fetch, params.namespace, params[0])
                // TODO
                // let active = await WorkflowActiveStatus(fetch, params.namespace, params[0])
                // TODO
                // let logToEvents = await FetchLogToEvents(fetch, params.namespace, params[0])

                console.log(wf)
                // console.log(active)

                wfRefValue.current = wf
                setWorkflowValue(wf)
                setWorkflowValueOld(wf)

                // setWorkflowInfo((wfI) => {
                //     wfI.active = active
                //     return { ...wfI }
                // })
            } catch(e) {
                setErr(e.message)
            }
        }
        return fetchData().finally((()=>{setFetching(false)}))
    },[params, fetch])

    useEffect(()=>{
        fetchWorkflow()
    },[fetchWorkflow])

    // fetch metrics
    useEffect(()=>{
        async function getStateMetrics() {
            setStateMetrics([])
        }
        if(metricsLoading) {
            getStateMetrics().finally(()=>{setMetricsLoading(false)})
        }
    },[metricsLoading])
    

    async function updateLogEvent() {
        // TODO :)
    }

    async function updateWorkflow() {
        if(workflowInfo.fetching) {
            return // TODO - User Feedback
        }
        setFetching(true)
        try {
            let {revision, active, exec} = await WorkflowUpdate(fetch, params.namespace, params[0], handleError, workflowValue)
            setExecutable(exec)
            setWorkflowInfo((wfI) => {
                wfI.active= active;
                wfI.revision= revision;
                return { ...wfI }
            })
            setWorkflowValueOld(workflowValue)
            setActionErr("")
        } catch(e) {
            setActionErr(e.message)
        }
        setFetching(false)
    }

    async function executeWorkflow() {
        try {
            await WorkflowExecute(fetch, params.namespace, params[0], handleError, jsonInput)
        } catch (e) {
            setExecuteErr(e.message)
        }
    }

    let executeButton = (
        <div className={workflowInfo.active && executable ? "editor-footer-button" : "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => {
            if (workflowInfo.active && executable) {
                executeWorkflow()
            }
        }}>
            <span style={{}} >Execute</span>
            <IoPlaySharp style={{ marginLeft: "5px" }} />
        </div>
    );

    let listElements = [
        {
            name: "Workflow Variables",
            link: true,
            path: `/n/${params.namespace}/w/${params[0]}/variables` 
        },
        {
            name: "Export Workflow",
            func: async () => {
                // TODO
                toggleExportModal()
            },
        },
        {
            name: workflowInfo.active ? "Disable" : "Enable",
            func: async () => {
                try {
                    let active = await WorkflowSetActive(fetch, params.namespace, params[0], handleError, !workflowInfo.active)
                    setWorkflowInfo((wfI)=>{
                        wfI.active = active
                        return { ...wfI }
                    })
                    setToggleErr("")
                } catch(e) {
                    setToggleErr(`Failed to toggle workflow: ${e.message}`)
                }               
            },
        }
    ]

    function toggleExportModal() {
        setExportModalOpen(!exportModalOpen)
    }


    return(
        <>
            <div className="flex-row">
                <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                    <Breadcrumbs />
                </div>
                <ButtonWithDropDownCmp data={listElements} />
            </div>
            <div className="container" style={{flexDirection: "row", flexWrap: "wrap", flex: "auto"}}>
                <Modal 
                    isOpen={exportModalOpen}
                    onRequestClose={toggleExportModal}
                    contentLabel="Export Workflow"
                >
                    <ExportWorkflow workflow={params[0]} namespace={params.namespace} toggleModal={toggleExportModal}/>
                </Modal>
                <div className="container" style={{flexDirection: "column", flex: "auto"}}>
                    <div className="shadow-soft rounded tile" style={{ flex: "auto"}}>
                        <TileTitle name="Details" actionsDiv={[
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "editor" ? "#2396d8":""}} onClick={() => { setEditorTab("editor") }}>
                                <IoPencil /> Editor
                            </div>,
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "diagram" ? "#2396d8":""}} onClick={() => { setEditorTab("diagram") }}>
                                <IoImageSharp /> Diagram
                            </div>,
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "sankey" ? "#2396d8":""}} onClick={() => { setEditorTab("sankey") }}>
                                <IoPieChartSharp /> Sankey
                            </div>
                        ]}>
                            <IoEllipsisVerticalSharp />
                        </TileTitle >
                    <EditorDetails  workflowValueOld={workflowValueOld} metricsLoading={metricsLoading} stateMetrics={stateMetrics} editorTab={editorTab} wfRefValue={wfRefValue} functions={functions} codemirrorRef={codemirrorRef} actionErr={actionErr} workflowValue={workflowValue} setWorkflowValue={setWorkflowValue} updateWorkflow={updateWorkflow} />
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flex: "auto", maxHeight:"200px"}}>
                        <TileTitle name="Execute Workflow">
                            <IoPlaySharp />
                        </TileTitle >
                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", top: "-28px", position: "relative" }}>
                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                    <Editor err={executeErr} value={jsonInput} setValue={setJsonInput} showFooter={true} actions={[executeButton]} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container" style={{ flexDirection: "column", maxWidth:"380px", minWidth:"380px", flex: "auto" }} >
                    <SuccessOrFailedWorkflows namespace={params.namespace} fetch={fetch} workflow={params.workflow} handleError={handleError}/>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle actionsDiv={[
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "events"? "#2396d8":""}} className={"workflow-expand"} onClick={() => { setTab("events") }} >
                                <IoFlash />  Instances
                            </div>,
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: tab === "functions"? "#2396d8":""}} className={"workflow-expand"} onClick={() => { setTab("functions") }} >
                                <IoCodeWorkingOutline /> Functions
                            </div>]}>
                                <IoList /> Details
                        </TileTitle>
                        <Details tab={tab} />
                    </div>
                    {attributeAdd ? attributeAdd : ""}
                </div>
            </div>
        </>
    )
}

function ListExplorer(props) {
    const {fetch, params, namespace, handleError} = props
    const [loading, setLoading] = useState(true)
    const [init, setInit] = useState(false)
    const [objects, setObjects] = useState([])
    const [pageInfo, setPageInfo] = useState(null)
    const [err, setErr] = useState("")

    const paramsRef = useRef("")

    const fetchData = useCallback(()=>{
        async function grabData() {
            try {
                let uriPath = `/flow/namespaces/${namespace}/directory`
                // add the full path to the request
                if(params[0]) {
                    // handle listing details about a directory
                    uriPath += `/${params[0]}`
                }
                let resp = await fetch(`${uriPath}/`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    if(json.children && json.children.edges.length > 0) {
                        setObjects(json.children.edges)
                        setPageInfo(json.children.pageInfo)
                    } else {
                        setObjects([])
                    }
                    setInit(true)
                } else {
                    // TODO what permission we giving this?
                    await handleError('fetch objects', resp, "TODO")
                }

            } catch(e) {
                setErr(`Error fetching filelist: ${e.message}`)
            }
        }
        grabData()
    },[fetch, handleError, params])

    useEffect(()=>{
        if(!init || params[0] !== paramsRef.current){
            fetchData()
            setLoading(false)
            paramsRef.current = params[0]
        }
    },[fetchData, init, params])

    return(
        <>
             <div className="flex-row">
                <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                    <Breadcrumbs />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "auto"}}>
                    <TileTitle name="Explorer">
                        <IoSearch />
                    </TileTitle >
                    <LoadingWrapper isLoading={loading}>
                        <ul>
                            {objects.map((obj)=>{
                                return(
                                    <FileObject fetch={fetch} setErr={setErr} path={params[0]} namespace={namespace} name={obj.node.name}  key={obj.node.name} type={obj.node.type} id={obj.node.path} />
                                )
                            })}
                        </ul>
                    </LoadingWrapper>
                </div>
                <div className="container" style={{ flexDirection: "column" }} >
                    <div className="shadow-soft rounded tile">
                        <TileTitle name="Create Directory">
                            <IoAdd />
                        </TileTitle >
                        <CreateDirectory fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr}/>
                    </div>
                    <div className="shadow-soft rounded tile">
                        <TileTitle name="Create Workflow">
                            <IoAdd />
                        </TileTitle >
                        <CreateWorkflow fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr}/>
                    </div>
                    <div className="shadow-soft rounded tile"  style={{flex: "auto"}}>
                        <TileTitle name="Send Namespace Event">
                            <IoAdd />
                        </TileTitle>
                        <SendNamespaceEvent />
                    </div>
                </div>
            </div>
        </>
    )
}

function SendNamespaceEvent(props){
    const [val, setVal] = useState("")

    // TODO handle broadcasting namespace event
    return (
        <div>
            <textarea rows={8} value={val} onChange={(e) => setVal(e.target.value)} style={{ width:"100%", resize: "none" }} />
            <div style={{ textAlign: "right" }}>
                <input onClick={() => {}} type="submit" value="Send Event" />
            </div>
        </div>
    )
}

function CreateWorkflow(props) {

    const {fetch, handleError, path, setErr, namespace, fetchData} = props

    const [wfName, setWfName] = useState("")
    const [template, setTemplate] = useState("default")
    const templateData = `description: A simple 'no-op' state that returns 'Hello world!'
states:
- id: helloworld
  type: noop
  transform:
    result: Hello world!
`

    const createWorkflow = async () => {
       try {
            let uriPath = `namespaces/${namespace}/workflow`
            if(path) {
                uriPath += `/${path}`
            }
            let resp = await fetch(`/flow/${uriPath}/${wfName}`, {
                method: "POST",
                body: JSON.stringify(
                    {
                        source: templateData
                    }
                )
            })
            if(resp.ok) {
                fetchData()
                setWfName("")
            } else {
                // TODO what permission we giving this?
                await handleError('create workflow', resp, "TODO")
            }
        } catch(e) {
            setErr(`Error creating workflow: ${e.message}`)
        }
    }

    return(
        <div style={{fontSize:"12pt"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p>Workflow Name:</p>
                <input value={wfName} onChange={(e)=>setWfName(e.target.value)} type="text" placeholder="Name of Workflow..." />
            </div>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p>Template Name:</p>
                <select style={{width:"191px"}}>
                    <option value="">noop</option>
                </select>
            </div>
            <div className="divider-dark"/>
            <div>
                <div style={{textAlign:"center", fontSize:"10pt"}}>
                    Template Preview
                </div>
                <div style={{marginTop:"10px", maxWidth:"320px"}}>
                    <TemplateHighlighter id={template} data={templateData} lang={"yaml"} />
                </div>
            </div>
            <div className="divider-dark" />
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Create Workflow" onClick={() => createWorkflow()} />
            </div>
        </div>
    )
}

function CreateDirectory(props) {

    const {fetch, handleError, path, setErr, fetchData, namespace} = props
    const [dir, setDir] = useState("")

    const createDirectory = async () => {
        try {
            let uriPath = `namespaces/${namespace}/directory`
            if(path) {
                uriPath += `/${path}`
            }
            let resp = await fetch(`/flow/${uriPath}/${dir}`, {
                method: "POST"
            })
            if(resp.ok) {
                fetchData()
                setDir("")
            } else {
                // TODO what permission we giving this?
                await handleError('create directory', resp, "TODO")
            }
        } catch(e) {
            setErr(`Error creating directory: ${e.message}`)
        }
    }

    return(
        <div style={{fontSize:"12pt"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p>Directory Name:</p>
                <input value={dir} onChange={(e)=>setDir(e.target.value)} type="text" placeholder="Name of Directory..."/>
            </div>
            <div className="divider-dark" />
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Create Directory" onClick={() => createDirectory()} />
            </div>
        </div>
    )
}

function FileObject(props) {
    const {type, id, name, fetchData, namespace, setErr, handleError, path, fetch} = props
    const history = useHistory()

    function toggleObject() {
        //TODO add toggle workflow
    }

    async function deleteObject() {
        try {
            let uriPath = `/namespaces/${namespace}/node`
            if(path) {
                uriPath += `/${path}`
            }
            console.log(uriPath, "URI PATH")
            let resp = await fetch(`${uriPath}/${name}`, {
                method: "DELETE"
            })
            if(resp.ok) {
                fetchData()
            } else {
                // TODO what permission we giving this?
                await handleError('delete directory', resp, "TODO")
            }
        } catch(e) {
            setErr(`Error creating directory: ${e.message}`)
        }
    }

    return(
        <li onClick={()=>{
            history.push(`/n/${namespace}/explorer/${id.replace("/", "")}`)
        }} style={{display:"flex", gap:"10px", fontSize:"16pt", marginTop:"10px"}}>
            <div>
                {
                    type === "workflow" ?
                    // replace this?
                    <IoSubwayOutline />
                    :
                    <IoFolderOutline />
                }
            </div>
            <div style={{flex: 1}}>
                {name}
            </div>
            <div style={{display:"flex", gap:"10px"}}>
                {
                    type === "workflow" ? 
                    <>
                        <div title="Workflow Variables">
                            <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
                                ev.preventDefault();
                                history.push(`/n/${namespace}/w/${name}/variables`)
                            }}>
                                <span style={{fontWeight: "bold"}}>
                                    VAR
                                </span>
                            </div>
                        </div>
                    </>
                    :
                    <>
                    </>
                }
                <div title={type === "workflow" ? "Delete Workflow":"Delete Directory"}>
                    <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                        ev.preventDefault();
                        deleteObject(id)
                    }} /> 
                </div>
            </div>
        </li>
    )
}