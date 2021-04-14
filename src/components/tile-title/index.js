import React from 'react'

export default function TileTitle(props) {
    
    let {name, children} = props;
    console.log(props);
    
    return(
        <div className="tile-title">
            {children} <span>{name}</span>
        </div>
    )
}