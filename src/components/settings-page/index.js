import React from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'

import ShieldLockFill from 'react-bootstrap-icons/dist/icons/shield-lock-fill'
import CloudDownloadFill from 'react-bootstrap-icons/dist/icons/cloud-download-fill'
import { PlusCircle, PlusCircleFill, XCircle, XCircleFill } from 'react-bootstrap-icons'

export default function SettingsPage() {
    return (
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Namespace Settings"]} />
                </div>
            </div>
            <div className="container" style={{ flex: "auto", flexDirection: "row", flexWrap: "wrap" }}>
                <div className="item-0 shadow-soft rounded tile" style={{ flex: "auto", minWidth: "400px" }}>
                    <TileTitle name="Secrets">
                        <ShieldLockFill />
                    </TileTitle>
                    <Secrets />
                </div>
                <div className="item-0 shadow-soft rounded tile" style={{ flex: "auto", minWidth: "400px" }}>
                    <TileTitle name="Container Registries">
                        <CloudDownloadFill />
                    </TileTitle>
                    <Registries />
                </div>
            </div>
        </div>
        </>
    )
}

function Secrets() {

    let secretKeys = ["TOKEN", "MY_WORST_FEARS", "DAILY_SCHEDULE"]
    let secretRows = [];

    for (let i = 0; i < secretKeys.length; i++) {

        secretRows.push(
            <tr>
                <td style={{ paddingLeft: "10px" }}>
                    <input style={{ maxWidth: "150px" }} type="text" disabled value={secretKeys[i]} />
                </td>
                <td style={{ paddingRight: "10px" }} colspan="2">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <input style={{ maxWidth: "150px" }} type="password" disabled value=".........." />
                        <div className="circle button danger" style={{ marginLeft: "10px" }}>
                            <span style={{ flex: "auto" }}>
                                <XCircle style={{ marginBottom: "6px" }} />
                            </span>
                        </div>    
                    </div>
                </td>
            </tr>
        )

    }

    secretRows.push(
        <tr>
            <td style={{ paddingLeft: "10px" }}>
                <input style={{ maxWidth: "150px" }} type="text" />
            </td>
            <td style={{ paddingRight: "10px" }} colspan="2">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input style={{ maxWidth: "150px" }} type="text" />
                    <div className="circle button success" style={{ marginLeft: "10px" }}>
                        <span style={{ flex: "auto" }}>
                            <PlusCircle style={{ marginBottom: "6px" }} />
                        </span>
                    </div>    
                </div>
            </td>
        </tr>
    )

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
            <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                <thead>
                    <tr className="no-neumorph">
                        <th style={{ }}>
                            Key
                        </th>
                        <th style={{  }}>
                            Value
                        </th>
                        <th style={{ width: "50px" }}>
                            
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {secretRows}
                </tbody>
            </table>
        </div>
    )
}

function Registries() {

    let secretKeys = ["TOKEN", "MY_WORST_FEARS", "DAILY_SCHEDULE"]
    let secretRows = [];

    for (let i = 0; i < secretKeys.length; i++) {

        secretRows.push(
            <tr>
                <td style={{ paddingLeft: "10px" }}>
                    <input style={{ maxWidth: "150px" }} type="text" disabled value={secretKeys[i]} />
                </td>
                <td>
                    <input style={{ maxWidth: "150px" }} type="text" disabled value={secretKeys[i]} />
                </td>
                <td style={{ paddingRight: "10px" }} colspan="2">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <input style={{ maxWidth: "150px" }} type="password" disabled value=".........." />
                        <div className="circle button danger" style={{ marginLeft: "10px" }}>
                            <span style={{ flex: "auto" }}>
                                <XCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                            </span>
                        </div>    
                    </div>
                </td>
            </tr>
        )

    }

    secretRows.push(
        <tr>
            <td style={{ paddingLeft: "10px" }}>
                <input style={{ maxWidth: "150px" }} type="text"/>
            </td>
            <td>
                <input style={{ maxWidth: "150px" }} type="text"/>
            </td>
            <td style={{ paddingRight: "10px" }} colspan="2">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input style={{ maxWidth: "150px" }} type="password" />
                    <div className="circle button success" style={{ marginLeft: "10px" }}>
                        <span style={{ flex: "auto" }}>
                            <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                        </span>
                    </div>    
                </div>
            </td>
        </tr>
    )

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
            <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                <thead>
                    <tr className="no-neumorph">
                        <th style={{ }}>
                            URL
                        </th>
                        <th style={{  }}>
                            User
                        </th>
                        <th>
                            Token
                        </th>
                        <th style={{ width: "50px" }}>
                            
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {secretRows}
                </tbody>
            </table>
        </div>
    )
}