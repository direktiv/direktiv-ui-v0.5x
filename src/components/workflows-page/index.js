import React from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import PlusCircleFill from 'react-bootstrap-icons/dist/icons/plus-circle-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'

export default function WorkflowsPage() {
    return (
        <>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="neumorph" style={{ flex: "auto", flexGrow: "2", minWidth: "400px" }}>
                    <TileTitle name="All workflows">
                        <CardList />
                    </TileTitle>
                </div>
                <div className="neumorph" style={{ flex: "auto", flexGrow: "1", minWidth: "300px" }}>
                    <TileTitle name="Create new workflow">
                        <PlusCircleFill />
                    </TileTitle>
                </div>
            </div>
        </>
    )
}