import React from 'react'
import Breadcrumbs from '../breadcrumbs'

export default function JQPlaygroundPage() {
    return(
        <>
            <div className="container" style={{ flex: "auto", padding: "10px" }}>
                <div className="container">
                    <Breadcrumbs />
                </div>
                <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }}>
                    <div className="shadow-soft rounded tile" style={{ flex: "auto" }}>
                        <p>
                            World
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}