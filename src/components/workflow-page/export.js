
import React, { useContext, useState, useCallback, useEffect, useRef } from 'react'
import MainContext from '../../context'


const debugNSLIST = [
    "trent",
    "james",
    "prod"
]

const WarningBadge = (
    <div>
        not good
    </div>
)

const OkBadge = (
    <div>
        good
    </div>
)

const infoList = [
    { message: "missing workflow varaible", Badge: WarningBadge },
    { message: "missing workflow secret", Badge: WarningBadge },
    { message: "all workflow secrets exist", Badge: OkBadge },
]



export default function ExportWorkflow(props) {
    const { namespace, workflow } = props
    const { fetch, handleError } = useContext(MainContext)
    const [availableNamespaces, setAvailableNamespaces] = useState(undefined)


    const [currentWorkflow, setCurrentWorkflow] = useState(undefined)


    // Target Workflow
    const [targetNamespace, setTargetNamespace] = useState("")
    const [targetExists, setTargetExists] = useState(false)
    const [targetRefs, setTargetRefs] = useState({ variables: {}, secrets: {} })

    const [exportReport, setExportReport] = useState({ variables: [], secrets: [] })



    console.log(infoList)

    const fetchNamespaces = useCallback(() => {
        async function fetchNS() {
            try {
                let resp = await fetch(`/namespaces/`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    let nsList = []


                    // trim self namespace from targets
                    const index = nsList.indexOf(namespace);
                    console.log(index)
                    console.log(namespace)
                    if (index > -1) {
                        nsList.splice(index, 1);
                    }

                    for (const ns of json.namespaces) {
                        if (ns.name !== namespace) {
                            nsList.push(ns.name)
                        }
                    }

                    console.log("nsList = ", nsList)

                    setAvailableNamespaces(nsList)
                } else {
                    await handleError('fetch namespaces', resp, 'getNamespaces')
                }
            } catch (e) {
                // FIXME:
                console.log(`Failed to fetch Namespaces: ${e.message}`)
            }
        }
        fetchNS().finally(() => { })
    }, [fetch, handleError, namespace])

    const fetchWorkflow = useCallback(() => {
        async function fetchWF() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/workflows/${workflow}?get_refs=true`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setCurrentWorkflow(json)
                } else {
                    await handleError('fetch workflow', resp, 'getWorkflow')
                }
            } catch (e) {
                // FIXME:
                console.log(`Failed to fetch Workflow: ${e.message}`)
            }
        }
        fetchWF().finally(() => { })
    }, [fetch, handleError, workflow, namespace])

    const fetchTargetWorkflowAndRefs = useCallback((targetNS) => {
        async function fetchWFR() {
            try {
                // Store aviable vars here
                let targetReferences = { variables: {}, secrets: {} }

                // Check if workflow exists
                let resp = await fetch(`/namespaces/${targetNS}/workflows/${workflow}`, {
                    method: "get",
                })
                if (!resp.ok) {
                    setTargetExists(false)
                } else {
                    setTargetExists(true)
                    // Get Workflow Varaibles
                    resp = await fetch(`/namespaces/${targetNS}/workflows/${workflow}/variables/`, {
                        method: "get",
                    })

                    if (resp.ok) {
                        let wfVars = await resp.json()
                        if (wfVars.variables) {
                            for (const wfVar of wfVars.variables) {
                                targetReferences.variables[`${wfVar.key}-workflow`] = { key: wfVar.key, scope: "workflow" }
                            }
                        }
                    } else {
                        // TODO: Error handle
                    }
                }

                // Get Namespace Varaibles
                resp = await fetch(`/namespaces/${targetNS}/variables/`, {
                    method: "get",
                })

                if (resp.ok) {
                    let nsVars = await resp.json()
                    if (nsVars.variables) {
                        for (const nsVar of nsVars.variables) {
                            targetReferences.variables[`${nsVar.key}-namespace`] = { key: nsVar.key, scope: "namespace" }
                        }
                    }
                } else {
                    // TODO: Error handle
                }

                // Get Namespace Secrets
                resp = await fetch(`/namespaces/${targetNS}/secrets/`, {
                    method: "get",
                })

                if (resp.ok) {
                    let nsSecrets = await resp.json()
                    if (nsSecrets.secrets) {
                        for (const nsSecret of nsSecrets.secrets) {
                            targetReferences.secrets[nsSecret.key] = { key: nsSecret.key }
                        }
                    }
                } else {
                    // TODO: Error handle
                }

                // Set refs
                setTargetRefs(targetReferences)

                console.log("currentWorkflow", currentWorkflow)

                // Temporary Report var
                let report = { variables: [], secrets: [] }

                // Compare Conflicts
                // variable conflicts
                if (currentWorkflow.references && currentWorkflow.references.variables) {
                    for (const currentVar of currentWorkflow.references.variables) {
                        if (targetReferences.variables[`${currentVar.key}-${currentVar.scope}`]) {
                            // Current workflow variable exists in target workflow
                            if (!targetExists && currentVar.scope === "workflow") {
                                report.variables.push({ code: 2, msg: `Variable ${currentVar.key} is referenced but does not exists in ${currentVar.scope} scope because workflow does not exist.` })
                            } else {
                                report.variables.push({ code: 1, msg: `Variable ${currentVar.key} is referenced but does not exists in ${currentVar.scope} scope` })
                            }
                        } else {
                            // Current workflow variable does not exist in target workflow
                            report.variables.push({ code: 0, msg: `Variable ${currentVar.key} exists in ${currentVar.scope} scope` })
                        }
                    }
                }

                // secret conflicts
                if (currentWorkflow.references && currentWorkflow.references.secrets) {
                    for (const currentSecret of currentWorkflow.references.secrets) {
                        if (targetReferences.secrets[`${currentSecret.key}`]) {
                            report.variables.push({ code: 3, msg: `Secret ${currentSecret.key} is referenced but does not exists in ${targetNamespace} namespace` })
                        } else {
                            // Current workflow secret does not exist in target workflow
                            report.variables.push({ code: 0, msg: `Secret ${currentSecret.key} exists in ${targetNamespace} namespace` })
                        }
                    }
                }

                setExportReport(report)

            } catch (e) {
                // FIXME:
                console.log(`Failed to fetch Workflow: ${e.message}`)
            }
        }
        fetchWFR().finally(() => { })
    }, [fetch, handleError, targetNamespace, workflow])


    // Fetch namespaces on mount
    useEffect(() => {
        if (availableNamespaces === undefined) {
            fetchNamespaces()
        }
    }, [fetchNamespaces, availableNamespaces])

    // Fetch current workflow on mount
    useEffect(() => {
        if (currentWorkflow === undefined) {
            fetchWorkflow()
        }
    }, [fetchWorkflow, currentWorkflow])

    const RenderAvailableNamespaces = () => {
        console.log("availableNamespaces = ", availableNamespaces)

        if (availableNamespaces === undefined) {
            return (
                <div>
                    undefined
                </div>
            );
        } else if (availableNamespaces.length === 0) {
            return (
                <div>
                    empty
                </div>
            );
        } else {
            return (
                <>
                    <select value={targetNamespace} onChange={(e) => {
                        setTargetNamespace(e.target.value)
                        fetchTargetWorkflowAndRefs(e.target.value)
                    }}>
                        {targetNamespace == "" ? <option key="select-namespace">Select Namespace</option> : <></>}
                        {
                            availableNamespaces.map((obj) => <option key={obj} value={obj}>{obj}</option>)
                        }
                    </select>
                </>
            )
        }
    }


    return (
        <div>
            <h1 style={{ textAlign: "center" }}>Export Workflow: {workflow}</h1>
            <div>
                <div>
                    <b>Target Namespace:</b>
                </div>
                <div>
                    <RenderAvailableNamespaces />
                </div>
            </div>
            <div>
                <div>
                    <b>Workflow Conflicts</b>
                </div>
                <div>
                    {
                        targetExists ?
                            <div>Yes workflow conflict</div>
                            :
                            <div>No workflow conflict</div>
                    }
                </div>
            </div>
            <div>
                <div>
                    <b>Export Information</b>
                </div>
                <div>
                    {
                        infoList.map((info) => {
                            return (
                                <div>
                                    {info.Badge}
                                    <div>
                                        {info.message}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>

            {/* {interactions.map((obj)=>
                <div className="api-item">
                    <div style={{display:"flex", alignItems:"center"}} className={"api-title " + obj.method} onClick={()=>document.getElementById(obj.title).classList.toggle('hide')}>
                        <span style={{width:"55px", textAlign:"center", marginRight:"10px"}} className={"api-btn "+ obj.method}>{obj.method}</span>
                        <span style={{marginRight:"10px", fontSize:"10pt"}}>{obj.url}</span>
                        <span style={{fontStyle:"italic", fontSize:"10pt"}}>{obj.title}</span>
                    </div>
                    <pre className="api-desc" id={obj.title} >
                        <code>
                            {obj.description}
                        </code>
                    </pre>
                </div>
            )} */}
        </div>
    )

}