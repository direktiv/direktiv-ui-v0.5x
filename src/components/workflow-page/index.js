import React from 'react'

import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import PencilSquare from 'react-bootstrap-icons/dist/icons/pencil-square'
import PieChartFill from 'react-bootstrap-icons/dist/icons/pie-chart-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'

export default function WorkflowPage() {
    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflows-page">
                <div className="flex-child" style={{ minWidth: "800px" }}>
                    <div className="neumorph" style={{ height: "" }}>
                        <TileTitle name="Editor">
                            <PencilSquare />
                        </TileTitle>
                    </div>
                </div>
                <div className="flex-child" style={{ minWidth: "300px", maxWidth: "300px", alignSelf: "stretch", flexDirection: "column" }}>
                    <div className="chart-tile neumorph">
                        <TileTitle name="Chart">
                            <PieChartFill />
                        </TileTitle>
                    </div>
                    <div className="chart-tile neumorph" style={{ display: "flex", flexDirection: "column" }}>
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
                <div className="flex-child" style={{ width: "500px"}}>
                    <div className="neumorph" style={{ height: "" }}>
                        <TileTitle name="Graph">
                            <PipFill />
                        </TileTitle>
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
        "nu fone hu dis",
        "how you doin",
        "example message 1",
        "lorem ipsum",
        "nu fone hu dis",
        "how you doin"
    ];

    let listItems = [];
    for (let i = 0; i < lines.length; i++) {
        listItems.push(
            <li className="event-list-item">
                <span style={{ fontSize: "8pt", textAlign: "left", marginRight: "10px" }}>
                    10m ago
                </span>
                <span>    
                    {lines[i]}
                </span>
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