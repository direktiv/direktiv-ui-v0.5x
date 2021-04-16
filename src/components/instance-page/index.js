import React from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import PipFill from 'react-bootstrap-icons/dist/icons/pip-fill'
import Braces from 'react-bootstrap-icons/dist/icons/braces'
import CaretDownSquareFill from 'react-bootstrap-icons/dist/icons/caret-down-square-fill'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

import { Link, useParams } from 'react-router-dom'

export default function InstancePage() {
    const params = useParams()
    let instanceId = params[0]

    return(
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto", display: "flex" }}>
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs instanceId={instanceId} />
                    </div>
                    <div id="" className="neumorph fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px" }}>
                        <div style={{ alignItems: "center" }}>
                            <Link className="dashboard-btn" to="/w/test">
                                View Workflow
                            </Link>
                        </div>
                    </div>
                    <div id="" className="neumorph fit-content" style={{ fontSize: "11pt", width: "130px", maxHeight: "36px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ marginRight: "10px" }}>
                                Instance status: 
                            </span>
                            <CircleFill style={{ fontSize: "12pt" }} className="completed"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container" style={{ flexGrow: "1", flexDirection: "row" }}>
                <div className="container" style={{ flexGrow: "inherit" }}>
                    <div className="neumorph" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Logs">
                            <CardList />
                        </TileTitle>
                    </div>
                    <div className="neumorph" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Graph">
                            <PipFill />
                        </TileTitle>
                    </div>
                </div>
                <div className="container" style={{ flexGrow: "inherit", maxWidth: "400px" }}>
                    <div className="neumorph" style={{ flexGrow: "inherit" }}>
                        <TileTitle name="Input / Output">
                            <Braces />
                        </TileTitle>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}