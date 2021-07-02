
import React, { useContext, useState, useCallback, useEffect } from 'react'
import MainContext from '../../context'

import { IoArrowForwardOutline,  IoDocumentTextOutline, IoCheckmarkCircleSharp,  IoInformationCircle, IoKey, IoWarning } from 'react-icons/io5'
import { XCircle } from 'react-bootstrap-icons'
import ContentLoader from 'react-content-loader'

const ExportError = (props) => {
    const { error, hideError } = props
    return (
        <div className={`var-table-error rounded ${error !== "" ? "" : "hide"}`} >
            <div style={{ flexGrow: 1 }}>
                <span>
                    {error}
                </span>
            </div>
            <div style={{ marginRight: "6px", cursor: "pointer" }} onClick={() => {
                hideError()
            }}>
                <span style={{ display: "flex", justifyContent: "center" }}>
                    <XCircle />
                </span>
            </div>
        </div>
    )
};

function TableLoader(props) {
    return (
        <ContentLoader
            width={"100%"}
            viewBox="0 0 700 450"
            backgroundColor="#f5f5f5"
            foregroundColor="#dbdbdb"
            {...props}
        >
            <rect x="114" y="52" rx="6" ry="6" width="483" height="15" />
            <circle cx="77" cy="60" r="15" />
            <rect x="116" y="105" rx="6" ry="6" width="420" height="15" />
            <circle cx="78" cy="113" r="15" />
            <rect x="115" y="158" rx="6" ry="6" width="483" height="15" />
            <circle cx="78" cy="166" r="15" />
            <rect x="117" y="211" rx="6" ry="6" width="444" height="15" />
            <circle cx="79" cy="219" r="15" />
            <rect x="117" y="263" rx="6" ry="6" width="483" height="15" />
            <circle cx="80" cy="271" r="15" />
            <rect x="117" y="314" rx="6" ry="6" width="420" height="15" />
            <circle cx="80" cy="323" r="15" />
            <rect x="117" y="366" rx="6" ry="6" width="483" height="15" />
            <circle cx="80" cy="375" r="15" />
            <rect x="117" y="418" rx="6" ry="6" width="420" height="15" />
            <circle cx="80" cy="427" r="15" />
            <rect x="117" y="470" rx="6" ry="6" width="483" height="15" />
            <circle cx="80" cy="479" r="15" />
        </ContentLoader>
    )
}


export default function ExportWorkflow(props) {
    const { namespace, workflow, toggleModal } = props
    const { fetch, handleError } = useContext(MainContext)
    const [availableNamespaces, setAvailableNamespaces] = useState(undefined)


    const [currentWorkflow, setCurrentWorkflow] = useState(undefined)


    // Target Workflow
    const [targetNamespace, setTargetNamespace] = useState("")
    const [targetExists, setTargetExists] = useState(false)

    const [exportReport, setExportReport] = useState({ variables: [], secrets: [] })
    const [fetchingReport, setFetchingReport] = useState(false)
    const [err, setErr] = useState("")

    const exportWorkflow = useCallback(() => {
        async function exportWf() {
            try {
                const workflowValue = atob(currentWorkflow.workflow)
                if (targetExists) {
                    // Update Workflow
                    let resp = await fetch(`/namespaces/${targetNamespace}/workflows/${workflow}`, {
                        method: "put",
                        headers: {
                            "Content-type": "text/yaml",
                            "Content-Length": workflowValue.length,
                        },
                        body: workflowValue
                    })
                    if (resp.ok) {
                    } else {
                        await handleError('update workflow', resp, 'updateWorkflow')
                    }
                } else {
                    // Create new workflow
                    let resp = await fetch(`/namespaces/${targetNamespace}/workflows`, {
                        method: "post",
                        headers: {
                            "Content-type": "text/yaml",
                            "Content-Length": workflowValue.length,
                        },
                        body: workflowValue
                    })
                    if (resp.ok) {
                    } else {
                        await handleError('create workflow', resp, 'createWorkflow')
                    }
                }
                toggleModal();
            } catch (e) {
                setErr(`Failed to export workflow: ${e.message}`)
            }
        }
        exportWf().finally(() => { })
    }, [fetch, handleError, targetExists, targetNamespace, currentWorkflow, workflow, toggleModal])


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

                    setAvailableNamespaces(nsList)
                } else {
                    await handleError('fetch namespaces', resp, 'getNamespaces')
                }
            } catch (e) {
                setErr(`Failed to get target namespace: ${e.message}`)
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
                setErr(`Failed to get current workflow: ${e.message}`)
            }
        }
        fetchWF().finally(() => { })
    }, [fetch, handleError, workflow, namespace])

    const fetchTargetWorkflowAndRefs = useCallback((targetNS) => {
        async function fetchWFR() {
            try {
                // Store aviable vars here
                let targetReferences = { variables: {}, secrets: {} }
                let targetWfExsits = false

                // Check if workflow exists
                let resp = await fetch(`/namespaces/${targetNS}/workflows/${workflow}`, {
                    method: "get",
                })
                if (!resp.ok) {
                    setTargetExists(false)
                    targetWfExsits = false
                } else {
                    setTargetExists(true)
                    targetWfExsits = true
                    // Get Workflow Variables
                    resp = await fetch(`/namespaces/${targetNS}/workflows/${workflow}/variables/`, {
                        method: "get",
                    })

                    if (resp.ok) {
                        let wfVars = await resp.json()
                        if (wfVars.variables) {
                            for (const wfVar of wfVars.variables) {
                                targetReferences.variables[`${wfVar.name}-workflow`] = { key: wfVar.name, scope: "workflow" }
                            }
                        }
                    } else {
                        await handleError('workflow variables', resp, 'getVariables')
                    }
                }

                // Get Namespace Variables
                resp = await fetch(`/namespaces/${targetNS}/variables/`, {
                    method: "get",
                })

                if (resp.ok) {
                    let nsVars = await resp.json()
                    console.log("nsVars = ", nsVars)
                    if (nsVars.variables) {
                        for (const nsVar of nsVars.variables) {
                            targetReferences.variables[`${nsVar.name}-namespace`] = { key: nsVar.name, scope: "namespace" }
                        }
                    }
                } else {
                    await handleError('namespace variables', resp, 'getVariables')
                }

                // Get Namespace Secrets
                resp = await fetch(`/namespaces/${targetNS}/secrets/`, {
                    method: "get",
                })

                if (resp.ok) {
                    let nsSecrets = await resp.json()
                    console.log("nsSecrets = ", nsSecrets)
                    if (nsSecrets.secrets) {
                        for (const nsSecret of nsSecrets.secrets) {
                            targetReferences.secrets[nsSecret.name] = { key: nsSecret.name }
                        }
                    }
                } else {
                    await handleError('namespace secrets', resp, 'getSecrets')
                }

                // Temporary Report var
                let report = { variables: [], secrets: [] }

                // Compare Conflicts
                // variable conflicts
                if (currentWorkflow.references && currentWorkflow.references.variables) {
                    for (const currentVar of currentWorkflow.references.variables) {
                        if (targetReferences.variables[`${currentVar.key}-${currentVar.scope}`]) {
                            // Current workflow variable exists in target workflow
                            report.variables.push({ code: 0, scope: currentVar.scope, msg: `Variable '${currentVar.key}' exists in '${currentVar.scope}' scope.` })
                        } else {
                            // Current workflow variable does not exist in target workflow
                            if (!targetWfExsits && currentVar.scope === "workflow") {
                                report.variables.push({ code: 2, scope: currentVar.scope, msg: `Variable '${currentVar.key}' is referenced but does not exists because workflow does not exist.` })
                            } else {
                                report.variables.push({ code: 1, scope: currentVar.scope, msg: `Variable '${currentVar.key}' is referenced but does not exists.` })
                            }
                        }
                    }
                }

                // secret conflicts
                if (currentWorkflow.references && currentWorkflow.references.secrets) {
                    for (const currentSecret of currentWorkflow.references.secrets) {
                        if (targetReferences.secrets[`${currentSecret.key}`]) {
                            report.secrets.push({ code: 0, msg: `Secret '${currentSecret.key}' exists in namespace.` })
                        } else {
                            // Current workflow secret does not exist in target workflow
                            report.secrets.push({ code: 3, msg: `Secret '${currentSecret.key}' is referenced but does not exists in '${targetNS}' namespace.` })
                        }
                    }
                }

                setExportReport((exReport) => {
                    exReport = report
                    return { ...exReport }
                })

            } catch (e) {
                console.log("e = ", e)
                setErr(`Failed to get target detail: ${e.message}`)
            }
        }
        fetchWFR().finally(() => { setFetchingReport(false) })
    }, [fetch, handleError, workflow, currentWorkflow])


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
                        setErr("")
                        setFetchingReport(true)
                        setTargetNamespace(e.target.value)
                        fetchTargetWorkflowAndRefs(e.target.value)
                    }}>
                        {targetNamespace === "" ? <option key="select-namespace">Select Namespace</option> : <></>}
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
            <h1 style={{ textAlign: "center", marginTop: "0pt" }}>Export Workflow: {workflow}</h1>
            <div><ExportError error={err} hideError={() => { setErr("") }} /></div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                borderBottom: "solid 1px rgba(0, 0, 0, 0.1)",
                paddingBottom: "16pt"
            }}>
                <div style={{ color: "#4a4e4e", fontWeight: "bold", paddingBottom: "4px" }}>
                    Target Namespace
                </div>
                <div style={{ width: "300px" }}>
                    <RenderAvailableNamespaces />
                </div>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "8pt"
            }}>
                <div style={{ color: "#4a4e4e", fontWeight: "bold", paddingBottom: "4px" }}>
                    Export Report
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%"
                }}>
                    <div className={"shadow-soft rounded tile"} style={{ flexGrow: 1, height: "300px", flexBasis: 0, margin: "8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
                            <IoDocumentTextOutline style={{ fontSize: "20pt", color: "#4293c4" }} />

                            <div style={{ fontSize: "12pt", color: "#4293c4" }}>
                                Source: {namespace}/{workflow}
                            </div>
                            <div style={{ width: "100%" }}>
                                {currentWorkflow ?
                                    <>
                                        <div>
                                            <div style={{ paddingTop: "8px" }}>
                                                <div className={"title"} style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                    Workflow Variable References
                                                </div>
                                                <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                    {
                                                        currentWorkflow.references.variables.map((obj) => {
                                                            if (obj.scope === "namespace") { return (<></>) }
                                                            return (
                                                                <div style={{ display: "flex", }}>
                                                                    <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                        <IoInformationCircle />
                                                                    </div>
                                                                    <div style={{ fontSize: "10pt" }}>
                                                                        {obj.key}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            </div>
                                            <div style={{ paddingTop: "8px" }}>
                                                <div className={"title"} style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                    Namespace Variable References
                                                </div>
                                                <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                    {
                                                        currentWorkflow.references.variables.map((obj) => {
                                                            if (obj.scope === "workflow") { return (<></>) }
                                                            return (
                                                                <div style={{ display: "flex", }}>
                                                                    <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                        <IoInformationCircle />
                                                                    </div>
                                                                    <div style={{ fontSize: "10pt" }}>
                                                                        {obj.key}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            </div>
                                            <div style={{ paddingTop: "16px", paddingBottom: "4px" }}>
                                                <div style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                    Secret References
                                                </div>
                                                <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                    {
                                                        currentWorkflow.references.secrets.map((obj) => {
                                                            return (
                                                                <div style={{ display: "flex" }}>
                                                                    <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                        <IoKey />
                                                                    </div>
                                                                    <div style={{ fontSize: "10pt" }}>
                                                                        {obj.key}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>

                                            </div>
                                        </div>
                                    </>
                                    :
                                    <></>
                                }
                            </div>
                        </div>
                    </div>
                    <div style={{ width: "30px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <IoArrowForwardOutline style={{ fontSize: "20pt" }} />
                    </div>
                    <div className={"shadow-soft rounded tile"} style={{ flexGrow: 1, height: "300px", flexBasis: 0, margin: "8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
                            {targetNamespace !== "" ?
                                <>
                                    <IoDocumentTextOutline style={{ fontSize: "20pt", color: "#4293c4" }} />

                                    <div style={{ fontSize: "12pt", color: "#4293c4" }}>
                                        {!targetExists ? "Create:" : "Override:"} {targetNamespace}/{workflow}
                                    </div>
                                </>
                                : <div style={{ fontSize: "12pt" }}>
                                    Please Select Target Namespace
                                </div>
                            }
                            <div style={{ width: "100%" }}>
                                {targetNamespace !== "" ?
                                    <>
                                        {fetchingReport ?
                                            <TableLoader />
                                            :
                                            <div>
                                                <div style={{ paddingTop: "8px" }}>
                                                    <div className={"title"} style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                        Workflow Variables Info
                                                    </div>
                                                    <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                        {
                                                            exportReport.variables.map((obj) => {
                                                                if (obj.scope === "workflow") {
                                                                    return (
                                                                        <div style={{ display: "flex", }}>
                                                                            <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                                {obj.code === 0 ?
                                                                                    <IoCheckmarkCircleSharp className={"success"} />
                                                                                    :
                                                                                    <IoWarning style={{ color: "#e7b038" }} />
                                                                                }
                                                                            </div>
                                                                            <div style={{ fontSize: "10pt" }}>
                                                                                {obj.msg}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (<></>)
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                                <div style={{ paddingTop: "8px" }}>
                                                    <div className={"title"} style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                        Namespace Variables Info
                                                    </div>
                                                    <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                        {
                                                            exportReport.variables.map((obj) => {
                                                                if (obj.scope === "namespace") {
                                                                    return (
                                                                        <div style={{ display: "flex", }}>
                                                                            <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                                {obj.code === 0 ?
                                                                                    <IoCheckmarkCircleSharp className={"success"} />
                                                                                    :
                                                                                    <IoWarning style={{ color: "#e7b038" }} />
                                                                                }
                                                                            </div>
                                                                            <div style={{ fontSize: "10pt" }}>
                                                                                {obj.msg}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (<></>)
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                                <div style={{ paddingTop: "16px", paddingBottom: "4px" }}>
                                                    <div style={{ paddingBottom: "4px", borderBottom: "solid 1px rgba(0, 0, 0, 0.1)", fontSize: "10pt" }}>
                                                        Secrets Info
                                                    </div>
                                                    <div style={{ paddingLeft: "8px", paddingTop: "4px" }}>
                                                        {
                                                            exportReport.secrets.map((obj) => {
                                                                return (
                                                                    <div style={{ display: "flex" }}>
                                                                        <div className={""} style={{ display: "flex", alignItems: "center", marginRight: "4px" }}>
                                                                            {obj.code === 0 ?
                                                                                <IoCheckmarkCircleSharp className={"success"} />
                                                                                :
                                                                                <IoWarning style={{ color: "#e7b038" }} />
                                                                            }
                                                                        </div>
                                                                        <div style={{ fontSize: "10pt" }}>
                                                                            {obj.msg}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </div>

                                                </div>
                                            </div>
                                        }
                                    </>
                                    :
                                    <></>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ width: "180px", marginTop: "10pt" }} className="button jq-button" onClick={() => { exportWorkflow() }}>
                    Export Workflow
                </div>
            </div>
        </div>
    )

}