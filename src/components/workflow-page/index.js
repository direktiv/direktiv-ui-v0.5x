import React from 'react'

import Breadcrumbs from '../breadcrumbs'

export default function WorkflowPage() {
    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflows-page">
                <div className="flex-child" style={{ minWidth: "800px" }}>
                    <div className="neumorph" style={{ height: "" }}>

                    </div>
                </div>
                <div className="flex-child" style={{ minWidth: "300px", maxWidth: "300px", alignSelf: "stretch", flexDirection: "column" }}>
                    <div className="chart-tile neumorph"></div>
                    <div className="chart-tile neumorph"></div>
                </div>
                <div className="flex-child" style={{ width: "500px"}}>
                    <div className="neumorph" style={{ height: "" }}>

                    </div>
                </div>
            </div>
        </>
    )
}