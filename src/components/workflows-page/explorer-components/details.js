import { useParams } from "react-router"
import {FuncComponent} from './index'
import { WorkflowInstanceList } from "./instances-workflow"

export default function Details(props) {

    const {tab, workflowFuncErr, functions, setTypeOfRequest} = props
    const params = useParams()

    return(
        <div>
            {tab === "events"?
            <div id="workflow-page-events" style={{ maxHeight: "512px", overflowY: "auto" }}>
                <div id="events-tile" className="tile-contents">
                    <WorkflowInstanceList workflow={params[0]} />
                </div>
            </div>:""
            }
            {tab === "functions" ?
                    <div id="workflow-page-events" style={{ maxHeight: "512px", maxWidth:"270px", minWidth:"270px", overflowY: "auto" }}>
                    {
                        workflowFuncErr !== "" ? 
                        <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                            {workflowFuncErr}
                        </div> 
                    :
                        <div id="events-tile" className="tile-contents">
                            <FuncComponent setTypeOfRequest={setTypeOfRequest} namespace={params.namespace} workflow={params[0]} functions={functions}/>
                        </div>
                    }
                </div>:""
            }
        </div>
    )
}