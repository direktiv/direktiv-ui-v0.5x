import {getBezierPath, getMarkerEnd, getSmoothStepPath} from "react-flow-renderer"
var randomWords = require('random-words');

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    arrowHeadType,
    markerEndId,
  }) {
    const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
    
    return (
      <>
        <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
        <text>
          <textPath href={`#${id}`} style={{ fontSize: '12px' }} startOffset="50%" textAnchor="middle">
            {data ?  data.label: ""}
          </textPath>
        </text>
      </>
    );
}

export function GeneralState(props) {
    const {setElementData, type} = props

    let stateName = `${type}-${randomWords()}`
    
    const data = {
        type: type,
        id: stateName.toLowerCase(),
    }

    switch(type) {
        case "parallel":
            data["actions"] = []
            break
        case "validate":
            data["schema"] = ""
            break
        case "setter":
        case "getter":
            data["variables"] = []
            break
        case "consumeEvent":
            data["event"] = {
                type: ""
            }
            break
        case "foreach":
            data["array"] = ""
            data["action"] = ""
            break
        case "eventXor":
        case "eventAnd":
            data["events"] = []
            break
        case "error":
            data["error"] = ""
            data["message"] = ""
            break
        case "delay":
            data["duration"] = ""
            break
        case "generateEvent":
            data["event"] = {
                type: "",
                source: ""
            }
            break
        case "action": 
            data["action"] = ""
            break
        case "switch":
            data["conditions"] = []
            break
        case "noop":
            break
        case "start":
        default:
            console.log("unsupported state type", type)
    }
    
    return(
        <tr className="spaceUnder" onDragStart={()=>{
            setElementData(data)
        }} draggable="true">
               <td>
                <div className="shadow-soft rounded state-item">
                    {type}
                </div>
            </td>
        </tr>
    )
}

export function ActionFunc(props) {
    const {setElementData} = props

    let stateName = `function-${randomWords()}`

    const data = {
        type: "function",
        id: stateName,
    }

    return(
        <tr className="spaceUnder" onDragStart={()=>{
            setElementData(data)
        }} draggable="true">
               <td>
                <div className="shadow-soft rounded state-item">
                    function
                </div>
            </td>
        </tr>
    )
}

export function Schema(props) {
    const { setElementData} = props

    let  stateName = `schema-${randomWords()}`

    const data = {
        type: "schema",
        id: stateName,
    }

    return(
        <tr className="spaceUnder" onDragStart={()=>{
            setElementData(data)
        }} draggable="true">
               <td>
                <div className="shadow-soft rounded state-item">
                    schema
                </div>
            </td>
        </tr>
    ) 
}