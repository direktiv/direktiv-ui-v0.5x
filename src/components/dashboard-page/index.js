import React, { useContext } from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'

import { IoBarChartSharp, IoCodeSlashOutline, IoList } from 'react-icons/io5'
import {EventsPageBody} from '../events-page'
import MainContext from '../../context'

export default function DashboardPage() {
    // used to hide loading
    const {namespace} = useContext(MainContext)
    
    return (
        <>
        {namespace !== "" ?
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs dashboard={true} elements={["Dashboard"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "2", minWidth: "400px" }}>
                    <TileTitle name="Top Workflows">
                        <IoBarChartSharp />
                    </TileTitle>
                </div>
                <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "1", minWidth: "300px" }}>
                    <TileTitle name="Total Executions">
                        <IoCodeSlashOutline />
                    </TileTitle>
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }}>
                <div className="shadow-soft rounded tile" style={{ flex: "auto" }}>
                    <TileTitle name="Events">
                        <IoList />
                    </TileTitle>
                    <EventsPageBody />
                </div>
            </div>
        </div>
        :
    
    ""}
        </>
    )
}