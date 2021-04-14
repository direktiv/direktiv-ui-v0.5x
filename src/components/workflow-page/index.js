import React from 'react'

import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import PencilSquare from 'react-bootstrap-icons/dist/icons/pencil-square'
import PieChartFill from 'react-bootstrap-icons/dist/icons/pie-chart-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'

import PieChart, {MockData, NuePieLegend} from '../charts/pie'

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
                        <div className="tile-contents">
                            <h2 style={{fontSize: "15pt", marginTop: "15px", marginBottom: "15px"}} >Executed Workflows</h2>
                            <PieChart lineWidth={40} data={MockData}/>
                        </div>
                    </div>
                    <div className="chart-tile neumorph">
                        <TileTitle name="Events">
                            <CardList />
                        </TileTitle>
                        <div className="tile-contents">
                            <EventsList />
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
        "how you doin"
    ];

    let listItems = [];
    for (let i = 0; i < lines.length; i++) {
        listItems.push(
            <li>
                {lines[i]}
            </li>
        )
    }

    return(
        <div>
            <ul>
                {listItems}
            </ul>
        </div>
    )
}