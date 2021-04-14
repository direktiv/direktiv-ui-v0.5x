import React from 'react'

export default function Breadcrumbs(props) {

    let { elements } = props;
    let spans = [];

    for (let i = 0; i < elements.length; i++) {
        spans.push(<span key={i}>{elements[i]}</span>)
    }

    return (
        <div id="breadcrumbs" className="neumorph fit-content">
            {spans}
        </div>
    )
}