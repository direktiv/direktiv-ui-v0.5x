import React from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import { IoLogoDocker } from 'react-icons/io5'
import { Registries } from "../settings-page/index"

export default function GlobalRegistries() {
    return (
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows", "Example"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexGrow: "1" }}>
                <div className="item-0 shadow-soft rounded tile" style={{ flexBasis: "0px" }}>
                    <TileTitle name="Global Registries">
                        <IoLogoDocker title="Create Registries that available to all services" />
                    </TileTitle>
                    <Registries mode="global"/>
                </div>
                <div className="item-0 shadow-soft rounded tile" style={{ flexBasis: "0px" }}>
                    <TileTitle name="Global Private Registries">
                        <IoLogoDocker title="Create Registries that are only available to global services"/>
                    </TileTitle>
                    <Registries mode="global-private"/>
                </div>
            </div>
        </>
    )
}