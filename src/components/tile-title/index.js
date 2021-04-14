import React from 'react'

export default function TileTitle(props) {
    
    let {name, children, actionsDiv} = props;
    console.log(props);
    
    return(
        <div className="tile-title" style={{ display: "flex", flex: "none", height: "17px" }}>
            {children} <span>{name}</span> 
            <span style={{ flex: "auto", float: "right", textAlign: "right" }}>{actionsDiv}</span>
        </div>
    )
}