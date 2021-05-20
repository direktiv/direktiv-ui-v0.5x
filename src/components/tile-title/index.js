import React from 'react'

export default function TileTitle(props) {
    
    let {name, children, actionsDiv} = props;
    
    return(
        <div className="tile-title" style={{ display: "flex", flex: "none", height: "17px" }}>
            {children} <span style={{flex: "auto"}}>{name}</span> 
            <span style={{float: "right", textAlign: "right", display:"flex", gap:"10px", fontSize:"10pt"}}>{actionsDiv}</span>
        </div>
    )
}