import React from 'react'
import {SizeMe} from 'react-sizeme'

import Breadcrumbs from '../breadcrumbs'
import Editor from "./editor"
import Diagram from './diagram'



export default function WorkflowPage() {

    return(
        <>
            <div className="flex-row" style={{ maxHeight: "64px" }}>
                <Breadcrumbs />
            </div>
            <div id="workflows-page">
                <div className="flex-child" style={{ width: "700px" }}>
                    <div className="neumorph" style={{display:"flex", height: "auto", padding:"0px"}}>
                        <SizeMe monitorHeight>
                            {({size})=> {
                                return(
                                    <div style={{maxHeight: size.height}}>
                                    <Editor height={size.height} width={size.width}/>
                                    </div>
                                )
                            }
                            }
                        </SizeMe>
                    </div>
                </div>
                <div className="flex-child" style={{ minWidth: "300px", maxWidth: "300px", alignSelf: "stretch", flexDirection: "column" }}>
                    <div className="chart-tile neumorph"></div>
                    <div className="chart-tile neumorph"></div>
                </div>
                <div className="flex-child" style={{ width: "600px"}}>
                    <div className="neumorph" style={{display:"flex", height: "auto"}}>
                        <div style={{ height: "100%", width:"100%" }}>
                          <Diagram/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}