import React from 'react'

import Breadcrumbs from '../breadcrumbs'

export default function WorkflowPage() {
    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflow-row-1" className="flex-row">
                <div id="workflow-yaml-tile" className="neumorph">
                    <div style={{  }}>
                        <h3>YAML Editor</h3>
                    </div>
                </div>
                <div style={{ marginRight: "10px", height: "max-content",  display: "flex", flexWrap: "wrap"}}>
                    <div className="neumorph chart-box">
                        <p>Chart 1</p>
                    </div>
                    <div className="neumorph chart-box">
                        <p>Chart 1</p>
                    </div>
                </div>
            </div>
            <div id="workflow-row-2" className="flex-row">
                <div id="workflow-graph-tile" className="neumorph">

                </div>
            </div>
        </>
    )
}