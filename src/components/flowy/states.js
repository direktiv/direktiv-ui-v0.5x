import { IoChevronForwardSharp } from 'react-icons/io5';

export function StartNode(props) {
    const {index, setElementData} = props
    
    if (index === 0) {
        return(
            <div onDragStart={()=>{
                setElementData({
                type: "start",
                id: "startNode",
                })
                }} draggable="true" style={{width:"fit-content"}}>
                    <div className="normal">
                        <div className="start" />
                    </div>
            </div>
        )
    } else {
        return (
            <div title="Start Node has already been added to flow." style={{width:"fit-content"}}>
                <div className="normal" style={{background: "#b5b5b5"}}>
                    <div className="start" />
                </div>
            </div>
        )
    }
}

// Noop state for flowy generation, takes index to create a counter for each one being added. If state not defined label is called noop
export function Noop(props) {
    const {index, setElementData} = props

    let stateName = `noop`
    if(index !== undefined) stateName = `noop-${index}`
    
    
    return(
        <div onDragStart={()=>{
            setElementData({
                type: "noop",
                id: stateName,
            })
        }} draggable="true" state={stateName} type="noop" className="create-flowy state" style={{width:"80px", height:"30px"}}>
            <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
                <IoChevronForwardSharp/>
                <div style={{flex:"auto"}}>
                    noop
                </div>
            </div>
            <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{stateName}</h1>
        </div>
    )
}

// Switch state for flowy graph generation, takes index to create a counter for each one being added. If state not defined label is called switch
export function Switch(props) {
    const {index, setElementData} = props

    let stateName = `switch`
    if(index !== undefined) stateName = `switch-${index}`
    
    
    return(
        <div onDragStart={()=>{
            setElementData({
                type: "switch",
                conditions: [],
                id: stateName,
            })
        }} draggable="true" state={stateName} type="noop" className="create-flowy state" style={{width:"80px", height:"30px"}}>
            <div style={{display:"flex", padding:"1px", gap:"3px", alignItems:"center", fontSize:"6pt", textAlign:"left", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)"}}> 
                <IoChevronForwardSharp/>
                <div style={{flex:"auto"}}>
                    switch
                </div>
            </div>
            <h1 style={{fontWeight:"300", fontSize:"7pt", marginTop:"2px"}}>{stateName}</h1>
        </div>
    )
}