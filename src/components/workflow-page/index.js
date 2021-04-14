import React from 'react'
import {SizeMe} from 'react-sizeme'

import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'


import TileTitle from '../tile-title'
import PencilSquare from 'react-bootstrap-icons/dist/icons/pencil-square'
import PieChartFill from 'react-bootstrap-icons/dist/icons/pie-chart-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'
import { Circle } from 'react-bootstrap-icons'

export default function WorkflowPage() {

    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflows-page">
                <div className="flex-child" style={{ width: "550px", maxHeight: "520px" }}>
                    <div className="neumorph" style={{  height: "auto", display:"flex", flexDirection:"column", alignSelf:"stretch", minHeight:"300px", maxHeight: "500px", maxWidth: "1080px" }}>
                        <TileTitle name="Editor">
                            <PencilSquare />
                        </TileTitle>
                        <SizeMe monitorHeight>
                            {({size})=> {
                                console.log(size)
                                return(
                                    <div style={{maxHeight: size.height, maxWidth: size.width}}>
                                        <Editor height={size.height} width={size.width}/>
                                    </div>
                                )
                            }
                            }
                        </SizeMe>
                    </div>
                </div>
                <div className="flex-child" style={{ minWidth: "300px", maxWidth: "300px", maxHeight: "520px", alignSelf: "stretch", flexDirection: "column" }}>
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
                <div className="flex-child" style={{ width: "600px", minHeight: "360px"}}>
                    <div className="neumorph" style={{ height: "auto", display:"flex", flexDirection:"column" }}>
                        <TileTitle name="Graph">
                            <PipFill />
                        </TileTitle>
                        <div style={{ height: "100%", width:"100%" }}>
                          <Diagram/>
                        </div>
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

        let colorClass = "failed";
        let z = i % 3;
        switch (z) {
            case 0:
                colorClass = "failed";
                break;
            case 1:
                colorClass = "pending";
                break;
            case 2:
                colorClass = "success";
                break;
        }

        listItems.push(
            <li className="event-list-item">
                <div>
                    <span><CircleFill className={colorClass} style={{ paddingTop: "5px", marginRight: "4px", maxHeight: "8px" }} /></span>
                    <span style={{ fontSize: "8pt", textAlign: "left", marginRight: "10px" }}>
                        10m ago
                    </span>
                    <span>    
                        {lines[i]}
                    </span>
                </div>
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