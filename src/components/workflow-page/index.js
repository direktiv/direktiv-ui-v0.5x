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
import Play from 'react-bootstrap-icons/dist/icons/play-btn-fill'

import PieChart, {MockData, NuePieLegend} from '../charts/pie'

export default function WorkflowPage() {

    let playBtn = (
        <div>
            <Play className="success" style={{ fontSize: "18pt" }} />
        </div>
    );

    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflows-page">
                <div className="container" style={{ flexGrow: "2" }}>
                    <div className="item-0 neumorph" style={{ minWidth: "600px" }}>
                        <TileTitle name="Editor" actionsDiv={playBtn}>
                            <PencilSquare />
                        </TileTitle>
                        <div>
                            <Editor/>
                        </div>
                        {/* <SizeMe monitorHeight>
                            {({size})=> {
                                console.log(size)
                                return(
                                    <div style={{maxHeight: size.height, maxWidth: size.width}}>
                                        <Editor height={size.height} width={size.width}/>
                                    </div>
                                )
                            }
                            }
                        </SizeMe> */}
                    </div>
                    <div className="item-0 neumorph" style={{ minWidth: "600px" }}>
                        <TileTitle name="Graph">
                            <PipFill />
                        </TileTitle>
                        <div style={{ display: "flex", width: "100%", height: "100%" }}>
                            <div style={{ flex: "auto" }}>
                                <Diagram />   
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container" style={{ width: "300px" }}>
                    <div className="item-1 neumorph" style={{ height: "280px" }}>
                        <TileTitle name="Executed Workflows">
                            <PieChartFill />
                        </TileTitle>
                        <div className="tile-contents">
                            <PieChart lineWidth={40} data={MockData}/>
                        </div>
                    </div>
                    <div className="item-0 neumorph">
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
            </div>
        </>
    )
}

function EventsList() {

    let lines = [
        "example message 1",
        "lorem ipsum",
        "nu fone hu dis"
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