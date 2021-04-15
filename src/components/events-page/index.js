import React from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import './style.css'

import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import CircleFill from 'react-bootstrap-icons/dist/icons/circle-fill'

export default function EventsPage() {
    return (
        <>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Events / Logs"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flex: "auto" }}>
                <div className="neumorph">
                    <TileTitle name="Instances">
                        <CardList />
                    </TileTitle>
                    <EventsPageBody />
                </div>
            </div>
        </>
    )
}

function EventsPageBody() {
    return(
        <div id="events-table">
            <table style={{ width: "" }}>
                <thead>
                    <tr>
                        <th style={{ width: "60px" }}>Status</th>
                        <th style={{ width: "100px" }}>Time</th>
                        <th style={{ width: "400px" }}>Instance ID</th>
                        <th style={{ minWidth: "100px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: "center" }}><EventStatus status="Completed" /></td>
                        <td>2s ago</td>
                        <td>demo-fza6/test-wf/blahblah</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "center" }}><EventStatus status="Pending" /></td>
                        <td>2s ago</td>
                        <td>demo-fza6/test-wf/blahblah</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "center" }}><EventStatus status="Failed" /></td>
                        <td>2s ago</td>
                        <td>demo-fza6/test-wf/blahblah</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "center" }}><EventStatus status="Completed" /></td>
                        <td>2s ago</td>
                        <td>demo-fza6/test-wf/blahblah</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

function EventStatus(props) {

    let { status } = props;

    return(
        <CircleFill title={status} className={status.toLowerCase()} style={{ marginRight: "5px", marginTop: "4px" }} />
    )
}