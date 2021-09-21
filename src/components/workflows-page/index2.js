import { IoAdd, IoFlash, IoCodeWorkingOutline, IoList,  IoFolderOutline, IoPencil, IoSearch, IoPlaySharp, IoTrash, IoEllipsisVerticalSharp, IoImageSharp, IoPieChartSharp, IoBookOutline, IoToggle, IoToggleOutline } from "react-icons/io5";
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
import { action, consumeEvent, delay, error, eventAnd, eventXor, foreach, generateEvent, generateSolveEvent, getAndSet, noop, parallel, validate, zwitch } from "./templates";
import { NamespaceCreateNode, NamespaceDeleteNode, NamespaceTree } from "../../api";


function ShowError(msg, setErr) {
    setErr(msg)
    setTimeout(()=>{
        setErr("")
    },5000)
}

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
                    let type = await NamespaceTree(fetch, namespace, params, false, handleError)
                    setTypeOfRequest(type)
                    setLoading(false)
                } catch(e) {
                    ShowError(`Error: ${e.message}`, setErr)
                    setLoading(false)
                }
            }
        }
        getTypeOfNode()
    },[fetch, handleError, params, typeOfRequest, namespace])

    return(
        <div className="container" style={{ flex: "auto", minWidth: "678px" }}>
            <LoadingWrapper isLoading={loading}>
                {typeOfRequest === "workflow" ? 
                    <WorkflowExplorer setTypeOfRequest={setTypeOfRequest} />
                    :
                    ""
                }  
                {typeOfRequest === "directory" ?
                    <ListExplorer setTypeOfRequest={setTypeOfRequest} fetch={fetch} params={params} namespace={namespace} handleError={handleError} />
                    :
                    ""
                }
            </LoadingWrapper>
        </div>
    )
}

function WorkflowExplorer(props) {

    // context
    const {fetch, handleError, attributeAdd, namespace} = useContext(MainContext)
    const { setTypeOfRequest} = props
    // params
    const params = useParams()
    const history = useHistory()

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

                // console.log(active)

                wfRefValue.current = wf
                setWorkflowValue(wf)
                setWorkflowValueOld(wf)

                // setWorkflowInfo((wfI) => {
                //     wfI.active = active
                //     return { ...wfI }
                // })
            } catch(e) {
                ShowError(e.message, setErr)
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
            let id = await WorkflowExecute(fetch, params.namespace, params[0], handleError, jsonInput)
            history.push(`/n/${namespace}/i/${id}`)
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
            func: async () => {
                setTypeOfRequest("")
                history.push(`/n/${params.namespace}/explorer/${params[0]}/variables` )
            }
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
                    <Breadcrumbs resetData={[setTypeOfRequest]} />
                </div>
                <ButtonWithDropDownCmp height={"-140px"} data={listElements} />
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
                        {err !== "" ?                    
                            <div style={{position:"relative"}}>
                                <div style={{position: "absolute", fontSize:"12pt", background:"#ff8a80", padding:"10px", borderRadius:"10px", zIndex:100, width:"50%", left:"300px"}}>
                                    {err}
                                </div>
                            </div>
                        :
                            ""
                        }
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
    const {fetch, params, namespace, handleError, setTypeOfRequest} = props
    const [loading, setLoading] = useState(true)
    const [init, setInit] = useState(false)
    const [objects, setObjects] = useState([])

    const [pageInfo, setPageInfo] = useState(null)
    const [err, setErr] = useState("")

    const paramsRef = useRef("")

    const fetchData = useCallback(()=>{
        async function grabData() {
            try {
                let obj = await NamespaceTree(fetch, namespace, params, true, handleError) 
                setObjects(obj.list)
                setPageInfo(obj.pageInfo)
                setInit(true)
            } catch(e) {
                ShowError(`Error: ${e.message}`, setErr)
            }
        }
        grabData()
    },[fetch,namespace, handleError, params])

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
                    <Breadcrumbs resetData={[setTypeOfRequest]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "auto"}}>
                    {err !== "" ?                    
                        <div style={{position:"relative"}}>
                            <div style={{position: "absolute", fontSize:"12pt", background:"#ff8a80", padding:"10px", borderRadius:"10px", zIndex:100, width:"50%", left:"300px"}}>
                                {err}
                            </div>
                        </div>
                    :
                        ""
                    }
                    <TileTitle name="Explorer">
                        <IoSearch />
                    </TileTitle >
                    <LoadingWrapper isLoading={loading}>
                        <ul>
                            {objects.map((obj)=>{
                                return(
                                    <FileObject fetchData={fetchData} setTypeOfRequest={setTypeOfRequest} fetch={fetch} setErr={setErr} path={params[0]} namespace={namespace} name={obj.node.name}  key={obj.node.name} type={obj.node.type} id={obj.node.path} />
                                )
                            })}
                        </ul>
                    </LoadingWrapper>
                </div>
                <div className="container" style={{ flexDirection: "column"}} >
                    <div className="shadow-soft rounded tile" style={{flex: "5", display: "flex", flexDirection: "column"}}>
                        <TileTitle name="Create Workflow">
                            <IoAdd />
                        </TileTitle >
                        <CreateWorkflow fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr}/>
                    </div>
                    <div className="shadow-soft rounded tile" style={{flex: "1"}}>
                        <TileTitle name="Create Directory">
                            <IoAdd />
                        </TileTitle >
                        <CreateDirectory fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr}/>
                    </div>
                    <div className="shadow-soft rounded tile"  style={{flex: "1"}}>
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
            <textarea rows={4} value={val} onChange={(e) => setVal(e.target.value)} style={{ width:"100%", resize: "none" }} />
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
    const [templateData, setTemplateData] = useState(noop)

    const createWorkflow = async () => {
       try {
            let success = await NamespaceCreateNode(fetch, namespace, path, wfName, "workflow", templateData, handleError)
            if(success) {
                fetchData()
                setWfName("")
            } 
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    return(
        <div style={{fontSize:"12pt", flex: "1", display: "flex", flexDirection: "column"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p style={{whiteSpace: "nowrap"}}>Workflow Name:</p>
                <input style={{width: "-webkit-fill-available"}} value={wfName} onChange={(e)=>setWfName(e.target.value)} type="text" placeholder="Name of Workflow..." />
            </div>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p style={{whiteSpace: "nowrap"}}>Template Name:</p>
                <select onChange={(e)=>{
                    setTemplate(e.target.value)
                    switch(e.target.value){
                        case "getAndSet":
                            setTemplateData(getAndSet)
                            break
                        case "parallel":
                            setTemplateData(parallel)
                            break
                        case "validate":
                            setTemplateData(validate)
                            break
                        case "generateGreetingEvent":
                            setTemplateData(generateEvent)
                            break
                        case "generateSolveEvent":
                            setTemplateData(generateSolveEvent)
                            break
                        case "foreach":
                            setTemplateData(foreach)
                            break
                        case "eventAnd":
                            setTemplateData(eventAnd)
                            break
                        case "eventXor":
                            setTemplateData(eventXor)
                            break
                        case "error":
                            setTemplateData(error)
                            break
                        case "delay":
                            setTemplateData(delay)
                            break
                        case "consumeEvent":
                            setTemplateData(consumeEvent)
                            break
                        case "action":
                            setTemplateData(action)
                            break
                        case "switch":
                            setTemplateData(zwitch)
                            break
                        case "noop":
                        default:
                            setTemplateData(noop)
                    }
                }}>
                    <option value="default">noop</option>
                    <option value="action">action</option>
                    <option value="switch">switch</option>
                    <option value="delay">delay</option>
                    <option value="consumeEvent">consumeEvent</option>
                    <option value="eventAnd">eventAnd</option>
                    <option value="eventXor">eventXor</option>
                    <option value="error">error</option>
                    <option value="parallel">parallel</option>
                    <option value="validate">validate</option>
                    <option value="getAndSet">getAndSet</option>
                    <option value="generateSolveEvent">generateSolveEvent</option>
                    <option value="generateGreetingEvent">generateGreetingEvent</option>
                </select>
            </div>
            <div className="divider-dark"/>
            <div style={{textAlign:"center", fontSize:"10pt", marginBottom: "10px"}}>
                    Template Preview
            </div>
            <div style={{width:"348px", flex: "1", marginBottom: "5px"}}>
                <TemplateHighlighter id={template} data={templateData} lang={"yaml"} />
            </div>
            <div className="divider-dark"/>
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
            let success = await NamespaceCreateNode(fetch, namespace, path, dir, "directory", undefined, handleError)
            if(success) {
                fetchData()
                setDir("")
            } 
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
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
    const {type, id, name, fetchData, namespace, setErr, handleError, path, fetch, setTypeOfRequest} = props
    const {checkPerm, permissions} = useContext(MainContext)
    const history = useHistory()

    const [active, setActive] = useState(null)

    useEffect(()=>{
        async function checkActive() {
            // TODO if workflow handle active
            setActive(true)
        }
        if(active === null && type === "workflow"){
            checkActive()
        }
    },[active, type])

    function toggleObject() {
        //TODO add toggle workflow
    }

    async function deleteObject() {
        try {
            let success = await NamespaceDeleteNode(fetch, namespace, path, name, handleError)
            if(success) {
                fetchData()
            } 
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    return(
        <li onClick={(ev)=>{
            ev.preventDefault()
            setTypeOfRequest("")
            history.push(`/n/${namespace}/explorer/${id.replace("/", "")}`)
        }} style={{display:"flex", gap:"10px", fontSize:"16pt", marginTop:"10px", cursor:"pointer"}}>
            <div>
                {
                    type === "workflow" ?
                    // replace this?
                    <IoBookOutline />
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
                        {checkPerm(permissions, "toggleWorkflow") ?
                        <>
                            {active ?
                                <div title="Toggle Workflow" className="button circle success" onClick={(ev) => {
                                    ev.preventDefault();
                                    toggleObject(id)
                                    ev.stopPropagation();
                                }}>
                                    <span>
                                        <IoToggle />
                                    </span>
                                </div>
                                :
                                <div title="Toggle Workflow" className="button circle" onClick={(ev) => {
                                    ev.preventDefault();
                                    toggleObject(id)
                                    ev.stopPropagation();
                                }}>
                                    <span>
                                        <IoToggleOutline className={"toggled-switch"} />
                                    </span>
                                </div>
                            }
                        </>: ""}
                        {checkPerm(permissions, "getWorkflow") ?
                        <div title="Workflow Variables">
                            <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
                                setTypeOfRequest("")
                                history.push(`/n/${namespace}/explorer/${id.replace("/", "")}/variables`)
                                ev.preventDefault();
                                ev.stopPropagation();
                            }}>
                                <span style={{fontWeight: "bold"}}>
                                    VAR
                                </span>
                            </div>
                        </div>:""}
                        {checkPerm(permissions, "deleteWorkflow") ? 
                <div title={"Delete Workflow"}>
                    <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                        ev.preventDefault();
                        deleteObject(id)
                    }} /> 
                </div>:""}
                    </>
                    :
                    <div title={"Delete Directory"}>
                        <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                            ev.preventDefault();
                            deleteObject(id)
                        }} /> 
                    </div>
                }
            </div>
        </li>
    )
}