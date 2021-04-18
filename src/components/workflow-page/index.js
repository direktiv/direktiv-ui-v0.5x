import React, { useContext, useState, useCallback, useEffect } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'


import TileTitle from '../tile-title'
import PencilSquare from 'react-bootstrap-icons/dist/icons/pencil-square'
import PieChartFill from 'react-bootstrap-icons/dist/icons/pie-chart-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import Play from 'react-bootstrap-icons/dist/icons/play-btn-fill'
import { FileTextFill, Clipboard, Save } from "react-bootstrap-icons"


import PieChart, {MockData, NuePieLegend} from '../charts/pie'
import { useHistory, useParams } from 'react-router'
import MainContext from '../../context'

export default function WorkflowPage() {
    const {fetch, namespace} = useContext(MainContext)
    const [workflowValue, setWorkflowValue] = useState("")
    const [workflowValueOld, setWorkflowValueOld] = useState("")
    const [workflowInfo, setWorkflowInfo] = useState({uid: "", revision: 0, active: true, fetching: true,})
    const history = useHistory()
    const params = useParams()

    function setFetching(fetchState) {
        setWorkflowInfo((wfI) => {
            wfI.fetching = fetchState;
            return wfI
        })
    }

    const fetchWorkflow = useCallback(()=>{
        setFetching(true)
        async function fetchWf() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}?name`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let wf = atob(json.workflow)
                    setWorkflowValue(wf)
                    setWorkflowValueOld(wf)
                    setWorkflowInfo((wfI) => {
                        wfI.uid = json.uid;
                        return wfI
                    })
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                console.log(e, "todo")
            }
        }
        fetchWf().finally(()=>{setFetching(false)})
    },[namespace])

    const updateWorkflow = useCallback(()=>{
        if (workflowInfo.fetching){
            return // TODO - User Feedback
        }
        setFetching(true)

        console.log("workflowValue =", workflowValue)

        async function updateWf() {
            try {
                // todo pagination
                let resp = await fetch(`/namespaces/${namespace}/workflows/${workflowInfo.uid}`, {
                    method: "put",
                    headers: {
                        "Content-type": "text/yaml",
                        "Content-Length": workflowValue.length,
                    },
                    body: workflowValue
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setWorkflowInfo((wfI) => {
                        wfI.active = json.active;
                        wfI.revision = json.revision;
                        return wfI
                    })
                    setWorkflowValueOld(workflowValue)
                    history.replace(`${json.id}`)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                console.log(e, "todo")
            }
        }
        updateWf().finally(()=>{setFetching(false)})
    },[namespace, workflowValue])

    useEffect(()=>{
        fetchWorkflow()
    },[namespace])

    useEffect(()=>{
        console.log("Workflow page has mounted")
    },[])

    let saveBtn = (
        <div className={workflowValueOld !== workflowValue ? "save-button" : "save-button-disable"} onClick={() => {updateWorkflow()}} >
            <FileTextFill/>
            <span>Save</span>
        </div>
    );

    async function executeWorkflow() {
        try{
            let resp = await fetch(`/namespaces/${namespace}/workflows/${params.workflow}/execute`, {
                method: "POST",
                body: JSON.stringify({"input":"todo"})
            })
            if(resp.ok) {
                let json = await resp.json()    
                history.push(`/i/${json.instanceId}`)
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            console.log(e, "todo execute workflow")
        }
    }

    return(
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows", "Example"]} />
                </div>
                <WorkflowActions executeCB={executeWorkflow}/>
            </div>
            <div id="workflows-page">
                <div className="container" style={{ flexGrow: "2" }}>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name={`Editor ${workflowValueOld !== workflowValue ? "*" : ""}`} >
                            <PencilSquare />
                        </TileTitle>
                        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top:"-28px", position: "relative"}}>
                            <div style={{width: "100%", height: "100%", position: "relative"}}>
                                <div style={{height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                                    <div id="editor-actions">
                                        <div className={workflowValueOld !== workflowValue ? "button success save-btn" : "button disabled"} onClick={() => {updateWorkflow()}}>
                                            <span className="save-btn-label">
                                                Save
                                            </span>
                                            <span className="save-btn-icon">
                                                <Save/>
                                            </span>
                                        </div>
                                    </div>
                                    <Editor value={workflowValue} setValue={setWorkflowValue} saveCallback={updateWorkflow}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Graph">
                            <PipFill />
                        </TileTitle>
                        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                            <div style={{ flex: "auto" }}>
                                <Diagram value={workflowValueOld}/>   
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container graph-contents" style={{ width: "300px" }}>
                    <div className="item-1 shadow-soft rounded tile" style={{ height: "280px" }}>
                        <TileTitle name="Executed Workflows">
                            <PieChartFill />
                        </TileTitle>
                        <div className="tile-contents">
                            <PieChart lineWidth={40} data={MockData}/>
                        </div>
                    </div>
                    <div className="item-0 shadow-soft rounded tile">
                        <TileTitle name="Events">
                            <CardList />
                        </TileTitle>
                        <div style={{ maxHeight: "80%", overflowY: "auto"}}>
                            <div id="events-tile" className="tile-contents">
                                <EventsList />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

function EventsList() {

    let lines = [
        "example message 1",
        "lorem ipsum",
        "nu fone hu dis"
    ];

    let listItems = [];
    for (let i = 0; i < lines.length; i++) {

        let colorClass = "failed";
        let z = i % 3;
        switch (z) {
            case 0:
                colorClass = "failed";
                break;
            case 1:
                colorClass = "pending";
                break;
            case 2:
                colorClass = "success";
                break;
        }

        listItems.push(
            <li className="event-list-item">
                <div>
                    <span><CircleFill className={colorClass} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                    <span style={{ fontSize: "8pt", textAlign: "left", marginRight: "10px" }}>
                        10m ago
                    </span>
                    <span>    
                        {lines[i]}
                    </span>
                </div>
            </li>
        )
    }

    return(
        <div>
            <ul style={{ margin: "0px" }}>
                {listItems}
            </ul>
        </div>
    )
}

// TODO: Add event listener to hide dropdown when clicking outside of dropdown
function WorkflowActions(props) {
    const [show, setShow] = useState(false)
    const {executeCB} = props

    useEffect(()=>{
        // console.log("event listen added" ,show)
        // const { isListOpen } = show;
        // setTimeout(() => {
        //     if(isListOpen){
        //       window.addEventListener('click',  () => {setShow(false)})
        //     }
        //     else{
        //       window.removeEventListener('click',  () => {setShow(false)})
        //     }
        //   }, 0)
    },[show])



    return(
        <div id="workflow-actions" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", padding: "0" }}>
             <div class="dropdown">
                <button onClick={(e)=>{
                    // e.stopPropagation()
                    setShow(!show)
                    }} class="dropbtn">Actions</button>

                {
                    show ? <>
                     <div class="dropdown-content-connector"></div>
                     <div class="dropdown-content">
                    <a onClick={()=>{
                        if (!executeCB) {
                            console.log("executeCB is not set")
                            return
                        }

                        executeCB()
                        setShow(true)
                    }}>Execute</a>
                    <a href="#">Disable</a>
                </div>
                </>:(<></>)
                }
            </div> 
        </div>
    )
}