import React from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'

import ShieldLockFill from 'react-bootstrap-icons/dist/icons/shield-lock-fill'
import CloudDownloadFill from 'react-bootstrap-icons/dist/icons/cloud-download-fill'

export default function SettingsPage() {
    return (
        <>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Namespace Settings"]} />
                </div>
            </div>
            <div className="container" style={{ flex: "auto", flexDirection: "row" }}>
                <div className="item-0 neumorph" style={{ flex: "auto" }}>
                    <TileTitle name="Secrets">
                        <ShieldLockFill />
                    </TileTitle>
                </div>
                <div className="item-0 neumorph">
                    <TileTitle name="Registries">
                        <CloudDownloadFill />
                    </TileTitle>
                </div>
            </div>
        </>
    )
}