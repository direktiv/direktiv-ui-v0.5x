import { IoAdd, IoFlash, IoCodeWorkingOutline, IoList, IoCodeOutline,  IoFolderOutline, IoPencil, IoSearch, IoPlaySharp, IoTrash, IoEllipsisVerticalSharp, IoImageSharp, IoPieChartSharp, IoToggle, IoToggleOutline, IoDocumentOutline } from "react-icons/io5";
import Editor from "../workflow-page/editor"

import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { ConfirmButton } from '../confirm-button'
import { useCallback, useContext, useEffect, useState, useRef } from "react";
import MainContext from "../../context";
import LoadingWrapper  from "../loading";
import { useHistory, useLocation, useParams } from "react-router";
import { TemplateHighlighter } from "../instance-page/input-output";
import { SuccessOrFailedWorkflows } from '../dashboard-page'
import Details from "./explorer-components/details";
import EditorDetails from "./explorer-components/editor";
import ExportWorkflow from '../workflow-page/export'
import Modal from 'react-modal';

import { checkStartType, Workflow, WorkflowStateMillisecondMetrics, WorkflowActiveStatus, WorkflowExecute, WorkflowSetActive, WorkflowSetLogToEvent, WorkflowUpdate } from "./api";
import ButtonWithDropDownCmp from "../instance-page/actions-btn";
import { action, consumeEvent, delay, error, eventAnd, eventXor, foreach, generateEvent, generateSolveEvent, getAndSet, noop, parallel, validate, zwitch } from "./templates";
import { NamespaceBroadcastEvent, NamespaceCreateNode, NamespaceDeleteNode, NamespaceTree, RenameNode } from "../../api";
import Attribute from "./attributes";
import { NoResults, validateAgainstNameRegex } from "../../util-funcs";

import Interactions from './interactions'


function ShowError(msg, setErr) {
    setErr(msg)
    setTimeout(()=>{
        setErr("")
    },5000)
}

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Explorer() {

    const {fetch, handleError, namespace, namespaceInteractions, workflowInteractions} = useContext(MainContext)
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [typeOfRequest, setTypeOfRequest] = useState("")
    const [, setErr] = useState("")
    const q = useQuery()

    useEffect(()=>{
        async function getTypeOfNode() {
            if(typeOfRequest === "" && q.get("variables") === null && q.get("function") === null && q.get("rev") === null) {
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
    },[q, fetch, handleError, params, typeOfRequest, namespace])

    if(q.get("variables")) {
        return ""
    }
    if(q.get("function")) {
        return ""
    }

    return(
        <div className="container" style={{ flex: "auto" }}>
            <LoadingWrapper isLoading={loading}>
                {typeOfRequest === "workflow" ? 
                    <WorkflowExplorer workflowInteractions={workflowInteractions} setTypeOfRequest={setTypeOfRequest} />
                    :
                    ""
                }  
                {typeOfRequest === "directory" ?
                    <ListExplorer namespaceInteractions={namespaceInteractions} setTypeOfRequest={setTypeOfRequest} fetch={fetch} params={params} namespace={namespace} handleError={handleError} />
                    :
                    ""
                }
            </LoadingWrapper>
        </div>
    )
}

function WorkflowExplorer(props) {

    // context
    const {fetch, handleError,  sse, namespace, workflowInteractions} = useContext(MainContext)
    const { setTypeOfRequest} = props
    // params
    const params = useParams()
    const history = useHistory()

    // Workflow States
    const [workflowValue, setWorkflowValue] = useState("")
    const wfRefValue = useRef("")
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [workflowInfo, setWorkflowInfo] = useState({ revision: 0, active: true, fetching: true })
    
    // tabs
    const [tab, setTab] = useState("functions")
    const [editorTab, setEditorTab] = useState("editor")

    // Logs
    const [logEvent, setLogEvent] = useState("")
    const [showLogEvent, setShowLogEvent] = useState(false)

    // knative functions
    const [functions, setFunctions] = useState([])

    // metrics
    const [metricsLoading, setMetricsLoading] = useState(true)
    const [stateMetrics, setStateMetrics] = useState([])


    // handle execute
    const [jsonInput, setJsonInput] = useState("{\n\n}")
    const jsonRefInput = useRef(jsonInput)
    const [executable, setExecutable] = useState(true)

    // error handling
    const [err, setErr] = useState("")
    const [executeErr, setExecuteErr] = useState("")
    const [actionErr, setActionErr] = useState("")
    const [, setToggleErr] = useState("")
    const [workflowFuncErr, setWorkflowFuncErr] = useState("")

    // export modal
    const [exportModalOpen, setExportModalOpen] = useState(false)

    const [attributes, setAttributes] = useState([])

    const codemirrorRef = useRef()
    const workflowRef = useRef(params[0])

    // const [functions, setFunctions] = useState(null)
    const functionsRef = useRef(functions ? functions: [])
    const [funcSource, setFuncSource] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)

    function toggleModal() {
        setModalOpen(!modalOpen)
    }

    useEffect(()=>{
        if(functions !== null && funcSource === null) {
            // TODO: update route
            let x = `/functions/namespaces/${namespace}/tree/${workflowRef.current}?op=services`

            let eventConnection = sse(`${x}`,{})
            eventConnection.onerror = (e) => {
                if(e.status === 403) {
                    setWorkflowFuncErr("Permission denied.")
                }
            }

            async function getData(e) {
                let funcs = functionsRef.current
                if (e.data === "") {
                    return
                }
                // process the data here
                // pass it to state to be rendered
                let json = JSON.parse(e.data)
                switch (json.event) {
                case "DELETED":
                    for (var i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            funcs.splice(i, 1)
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                case "MODIFIED":
                    for(i=0; i < funcs.length; i++) {
                        if (funcs[i].serviceName === json.function.serviceName) {
                            funcs[i] = json.function
                            functionsRef.current = funcs
                            break
                        }
                    }
                    break
                default:
                    let found = false
                    for(i=0; i < funcs.length; i++) {
                        if(funcs[i].serviceName === json.function.serviceName) {
                            found = true 
                            break
                        }
                    }
                    if (!found){
                        funcs.push(json.function)
                        functionsRef.current = funcs
                    }
                }
                let actFailed = true
                for ( i=0; i < functionsRef.current.length; i++) {
                    if (functionsRef.current[i].status === "False") {
                        actFailed = false
                    }
                }
                x = await checkStartType(wfRefValue.current)
                if (!x) {
                    actFailed = false
                }
                setExecutable(JSON.parse(JSON.stringify(actFailed)))
                setFunctions(JSON.parse(JSON.stringify(functionsRef.current)))
            }

            eventConnection.onmessage = e => getData(e)
            setFuncSource(eventConnection)
        }   
    },[functions, funcSource, namespace, sse])
    useEffect(()=>{
        return () => {
            if (funcSource !== null) {
                funcSource.close()
            }
        }
    },[funcSource])


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
                let {eventLogging, source, attributes} = await Workflow(fetch, params.namespace, params[0])
                let active = await WorkflowActiveStatus(fetch, params.namespace, params[0])

                wfRefValue.current = source
                setWorkflowValue(source)
                setAttributes(attributes)
                setWorkflowValueOld(source)
                setLogEvent(eventLogging)

                setWorkflowInfo((wfI) => {
                    wfI.active = active
                    return { ...wfI }
                })
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
               // todo
               try {
                let json = await WorkflowStateMillisecondMetrics(fetch, namespace, params[0], handleError)
                setStateMetrics(json)
            } catch(e) {
                setActionErr(e.message)
            }
        }
        if(metricsLoading) {
            getStateMetrics().finally(()=>{setMetricsLoading(false)})
        }
    },[metricsLoading, fetch, handleError, namespace, params])
    

    async function updateLogEvent() {
        try {
            let val = await WorkflowSetLogToEvent(fetch, namespace, params[0], logEvent, handleError)
            setLogEvent(val)
        } catch(e) {
            setActionErr(e.message)
        }
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
            name: "Variables",
            func: async () => {
                setTypeOfRequest("")
                history.push(`/n/${params.namespace}/explorer/${params[0]}?variables=true` )
            }
        },
        {
            name: "API Interactions",
            func: async () => {
                // TODO
                toggleModal()
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
                    setToggleErr(`Error: ${e.message}`)
                }               
            },
        }
    ]

    function toggleExportModal() {
        setExportModalOpen(!exportModalOpen)
    }


    return(
        <>
            <Modal 
                isOpen={modalOpen}
                onRequestClose={toggleModal}
                contentLabel="API Interactions"
            >
                <Interactions interactions={workflowInteractions(namespace, params[0])} type="Workflow" />
            </Modal>
            <div className="flex-row">
                <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                    <Breadcrumbs resetData={[setTypeOfRequest]} />
                </div>
                <ButtonWithDropDownCmp height={"-100px"} data={listElements} />
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
                    <div className="shadow-soft rounded tile" style={{ flex: "auto", display: "flex", flexDirection: "column"}}>
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
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "editor" ? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setEditorTab("editor") }}>
                                <IoPencil /> Editor
                            </div>,
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "diagram" ? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setEditorTab("diagram") }}>
                                <IoImageSharp /> Diagram
                            </div>,
                            <div style={{display:"flex", alignItems:"center", fontSize:"10pt", color: editorTab === "sankey" ? "#2396d8":""}} className={"workflow-expand "} onClick={() => { setEditorTab("sankey") }}>
                                <IoPieChartSharp /> Sankey
                            </div>
                        ]}>
                            <IoEllipsisVerticalSharp />
                        </TileTitle >
                    <EditorDetails  
                        path={params[0]} namespace={namespace}
                        workflowValueOld={workflowValueOld} metricsLoading={metricsLoading} stateMetrics={stateMetrics}
                        editorTab={editorTab} wfRefValue={wfRefValue} functions={functions} editorRef={codemirrorRef}
                        actionErr={actionErr} workflowValue={workflowValue} setWorkflowValue={setWorkflowValue} updateWorkflow={updateWorkflow}
                        showLogEvent={showLogEvent} updateLogEvent={updateLogEvent} setShowLogEvent={setShowLogEvent} logEvent={logEvent} setLogEvent={setLogEvent}
                    />
                    </div>
                    <div className="shadow-soft rounded tile" style={{ flex: "auto", maxHeight:"200px", display: "flex", flexDirection: "column"}}>
                        <TileTitle name="Execute Workflow">
                            <IoPlaySharp />
                        </TileTitle >
                        <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "100%", top: "-28px", position: "relative", flex: 1, minHeight: "200px" }}>
                            <div style={{ flex: 1, width: "100%", position: "relative" }}>
                                <div style={{ position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                    <Editor refValSet={jsonRefInput} err={executeErr} value={jsonInput} setValue={setJsonInput} showFooter={true} actions={[executeButton]} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container auto-width-all-896" style={{ flexDirection: "column", maxWidth:"380px", minWidth:"380px", flex: "auto" }} >
                    <SuccessOrFailedWorkflows namespace={params.namespace} fetch={fetch} workflow={params["0"]} handleError={handleError}/>
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
                        <Details setTypeOfRequest={setTypeOfRequest} workflowFuncErr={workflowFuncErr} tab={tab} functions={functions} />
                    </div>
                    <Attribute setErr={setErr} ShowError={ShowError} attributes={attributes} setAttributes={setAttributes} />
                </div>
            </div>
        </>
    )
}

function ListExplorer(props) {
    const {fetch, params, namespace, handleError, setTypeOfRequest, namespaceInteractions} = props
    const [loading, setLoading] = useState(true)
    const [init, setInit] = useState(false)
    const [objects, setObjects] = useState([])
    const [modalOpen, setModalOpen] = useState(false)

    function toggleModal() {
        setModalOpen(!modalOpen)
    }



    const [, setPageInfo] = useState(null)
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
            <Modal 
                isOpen={modalOpen}
                onRequestClose={toggleModal}
                contentLabel="API Interactions"
            >
                <Interactions interactions={namespaceInteractions(namespace, params[0])} type="Namespace" />
            </Modal>
             <div className="flex-row">
                <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                    <Breadcrumbs resetData={[setTypeOfRequest]} />
                </div>
                <div style={{ display: "flex", flex:2, flexDirection: "row-reverse", alignItems: "center", marginRight: "12px" }}>
                                <div onClick={() => toggleModal()} title={"APIs"} className="circle button" style={{ position: "relative", zIndex: "5" }}>
                                    <span style={{ flex: "auto" }}>
                                        <IoCodeOutline className={"toggled-switch"} style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                                    </span>
                                </div> 
                            </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "5"}}>
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
                        <>
                        {objects.length > 0 ?
                        <ul>
                            {objects.map((obj)=>{
                                return(
                                    <FileObject handleError={handleError} fetchData={fetchData} setTypeOfRequest={setTypeOfRequest} fetch={fetch} setErr={setErr} path={params[0]} namespace={namespace} name={obj.node.name}  key={obj.node.name} type={obj.node.type} id={obj.node.path} />
                                )
                            })}
                        </ul>: <NoResults/>}
                        </>
                    </LoadingWrapper>
                </div>
                <div className="container" style={{ flexDirection: "column", flex: "1"}} >
                    <div className="shadow-soft rounded tile" style={{flex: "5", display: "flex", flexDirection: "column", maxHeight: "576px"}}>
                        <TileTitle name="Create Workflow">
                            <IoAdd />
                        </TileTitle >
                        <CreateWorkflow fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr} setTypeOfRequest={setTypeOfRequest}/>
                    </div>
                    <div className="shadow-soft rounded tile" style={{flex: "0 1"}}>
                        <TileTitle name="Create Directory">
                            <IoAdd />
                        </TileTitle >
                        <CreateDirectory fetchData={fetchData} namespace={namespace} path={params[0]} handleError={handleError} fetch={fetch} setErr={setErr} setTypeOfRequest={setTypeOfRequest}/>
                    </div>
                    <div className="shadow-soft rounded tile"  style={{flex: "0 1"}}>
                        <TileTitle name="Send Namespace Event">
                            <IoAdd />
                        </TileTitle>
                        <SendNamespaceEvent fetch={fetch} namespace={namespace} handleError={handleError} setErr={setErr}/>
                    </div>
                </div>
            </div>
        </>
    )
}

function SendNamespaceEvent(props){
    const {fetch, namespace, handleError, setErr} = props
    const [val, setVal] = useState("")

    async function sendNamespaceEvent() {
        try {
            await NamespaceBroadcastEvent(fetch, namespace, val, handleError)
            setVal("")
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    return (
        <div>
            <textarea rows={4} value={val} onChange={(e) => setVal(e.target.value)} style={{ width:"100%", resize: "none" }} />
            <div style={{ textAlign: "right" }}>
                <input onClick={() => sendNamespaceEvent()} type="submit" value="Send Event" />
            </div>
        </div>
    )
}

function CreateWorkflow(props) {

    const {fetch, handleError, path, setErr, namespace, setTypeOfRequest} = props

    const [wfName, setWfName] = useState("")
    const [template, setTemplate] = useState("default")
    const [templateData, setTemplateData] = useState(noop)
    const history = useHistory()

    const createWorkflow = async () => {

       // Regex Check
       let regexError = validateAgainstNameRegex(wfName, "Workflow")
       if (regexError) {
        ShowError(`Error: ${regexError}`, setErr)
        return
       }

       try {
            let success = await NamespaceCreateNode(fetch, namespace, path, wfName, "workflow", templateData, handleError)
            if(success) {
                if(path) {
                    history.push(`/n/${namespace}/explorer/${path}/${wfName}`)
                } else {
                    history.push(`/n/${namespace}/explorer/${wfName}`)
                }

                // fetchData()
                setWfName("")
                setTypeOfRequest("workflow")
            } 
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    return(
        <div style={{fontSize:"12pt", flex: "1", display: "flex", flexDirection: "column"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p style={{whiteSpace: "nowrap"}}>Workflow Name:</p>
                <input style={{width: "100%"}} value={wfName} onChange={(e)=>setWfName(e.target.value)} type="text" placeholder="Name of Workflow..." />
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
                    <option value="foreach">foreach</option>
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
            <div  style={{flex: "1", marginBottom: "5px", justifyContent: "center", display: "flex"}}>
                <div className="auto-width-780" style={{height: "100%", width:"348px", margin:"0px", flex: 1 }}>

                <TemplateHighlighter id={template} data={templateData} lang={"yaml"} />
                </div>
            </div>
            <div className="divider-dark"/>
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Workflow Builder" style={{marginRight:"5px"}} onClick={() => {
                    history.push(`/n/${namespace}/flowy?path=${path}`)
                }} />
                <input type="submit" value="Create Workflow" onClick={() => createWorkflow()} />
            </div>
        </div>
    )
}

function CreateDirectory(props) {

    const {fetch, handleError, path, setErr, namespace, setTypeOfRequest} = props
    const [dir, setDir] = useState("")
    const history = useHistory()

    const createDirectory = async () => {

       // Regex Check
       let regexError = validateAgainstNameRegex(dir, "Directory")
       if (regexError) {
        ShowError(`Error: ${regexError}`, setErr)
        return
       }
       
        try {
            let success = await NamespaceCreateNode(fetch, namespace, path, dir, "directory", undefined, handleError)
            if(success) {
                if(path) {
                    history.push(`/n/${namespace}/explorer/${path}/${dir}`)
                } else {
                    history.push(`/n/${namespace}/explorer/${dir}`)
                }
                setDir("")
                setTypeOfRequest("directory")
            } 
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    return(
        <div style={{fontSize:"12pt"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p style={{whiteSpace: "nowrap"}}>Directory Name:</p>
                <input style={{width:"100%"}} value={dir} onChange={(e)=>setDir(e.target.value)} type="text" placeholder="Name of Directory..."/>
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
    const [rename, setRename] = useState(false)
    const [rname, setRName] = useState(id)

    useEffect(()=>{
        async function checkActive() {
            try {
                let active = await WorkflowActiveStatus(fetch, namespace, id, handleError)
                setActive(active)
            } catch(e) {
                ShowError(`Error: ${e.message}`)
            }
        }
        if(active === null && type === "workflow"){
            checkActive()
        }
    },[active, type, fetch, handleError, id, namespace])

    async function toggleObject() {
        try {
            let active2 = await WorkflowSetActive(fetch, namespace, id, handleError, !active)
            setActive(active2)
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
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

    async function renameObject() {
        try {
            let success = await RenameNode(fetch, namespace, path, name, rname, handleError)
            if(success) {
                fetchData()
                setRename(false)
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
        }} className="neumorph-hover" style={{display:"flex", gap:"10px", fontSize:"14pt", marginTop:"10px", padding:"5px", cursor:"pointer"}}>
            <div>
                {
                    type === "workflow" ?
                    // replace this?
                    <IoDocumentOutline />
                    :
                    <IoFolderOutline />
                }
            </div>
            {rename ? <div style={{flex: 1, fontSize:"11pt"}}>
                <input onKeyPress={(e)=>{
                    console.log(e)
                    if(e.key === "Enter") {
                        renameObject()
                    }
                }} onClick={(e)=>{
                        e.preventDefault();
                        e.stopPropagation();
                }} type="text" id={name} value={rname} onChange={(e)=>setRName(e.target.value)}/>
            </div> :
            <div style={{flex: 1, fontSize:"11pt"}}>
                {name}
            </div>}
            <div style={{display:"flex", gap:"10px"}}>
            <div title="Rename ">
                            <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
                                setRename(true)
                                setTimeout(()=>{
                                    document.getElementById(name).focus()
                                },100)
                                ev.preventDefault();
                                ev.stopPropagation();
                            }}>
                                <span style={{fontWeight: "bold", marginTop:"6px"}}>
                                    <IoPencil />
                                </span>
                            </div>
                        </div>
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
                                history.push(`/n/${namespace}/explorer/${id.replace("/", "")}?variables=true`)
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