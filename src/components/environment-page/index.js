import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import { Plus, XCircle } from 'react-bootstrap-icons'
import { useLocation, useParams } from 'react-router'
import { IoLockOpen, IoSave, IoTrash, IoEyeOffOutline, IoWarningOutline, IoCloudUploadOutline, IoCloudDownloadOutline } from 'react-icons/io5'
import { MiniConfirmButton } from '../confirm-button'
import { useDropzone } from 'react-dropzone'
import LoadingWrapper from "../loading"
import { NamespaceDeleteVariable, NamespaceDownloadVariable, NamespaceGetVariable, NamespaceSetVariable, NamespaceVariables } from '../../api'
import { WorkflowDeleteVariable, WorkflowDownloadVariable, WorkflowGetVariable, WorkflowSetVariable, WorkflowVariables } from '../workflows-page/api'


function useQuery() {
    return new URLSearchParams(useLocation().search);
}
const EnvTableError = (props) => {
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

const EnvTableHeader = () => {
    return (
        <div className={"var-table-row header"}>
            <div style={{ flexGrow: "2", flexBasis: "0px", minWidth: "130pt" }}>
                {/* Name column */}
                Name
            </div>
            <div style={{ flexGrow: "5", flexBasis: "0px" }}>
                {/* Value column */}
                Value
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0px" }}>
                {/* Size column */}
                Size
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0px" }}>
                {/* Action */}
            </div>
        </div>
    )
};

const EnvTableRow = (props) => {
    const { fetch, fetchVariables, env, index, setVar, getVar, downloadVar, setError, namespace, params, mode, handleError } = props
    const [localValue, setLocalValue] = useState("")
    const [remoteValue, setRemoteValue] = useState("")
    const [show, setShow] = useState(false)
    const [isBinary, setIsBinary] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    return (
        <>
        {isLoading || isDownloading ? (<div className={"var-table-overlay"}>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%"}}>
                <div class="loader"></div> 
                <div style={{color: "white", fontWeight: "bold", paddingTop:"4px"}}>
                    {isLoading ? "Setting Variable...": " Downloading Variable..."}
                </div>
            </div>
        </div>) : <></>}
        <div className={`var-table-row ? "show-value" : ""}`}>
            <div style={{ flexGrow: "2", flexBasis: "0px", minWidth: "130pt" }}>
                {/* Name column */}
                {env.node.name}
            </div>
            <div style={{ flexGrow: "4", flexBasis: "0px" }}>
                {/* Value column */}

                {env.node.size < 1000000 ? (<>{show === true ?
                        <textarea id={`env-${index}`} className={"var-table-input"} value={localValue} spellCheck="false" 
                        style={{
                            width: "100%",
                            maxHeight: "38px",
                            fontFamily: "Arial, Helvetica, sans-serif"
                        }}
                        onChange={(ev) => {
                            setLocalValue(ev.target.value)
                        }} />
                        :
                        <div style={{ width: "100%" }} className={`var-table-input show-button rounded button ${isBinary ? "disabled": ""}`} onClick={() => {
                            getVar(env.node.name).then((newVal) => {
                                if (!newVal) {
                                    return // TODO: Throw error
                                }
                                const string_to_test = newVal.substring(0, 50)
                                if(/\ufffd/.test(string_to_test) === true){
                                    setShow(false)
                                    setIsBinary(true)
                                }else{
                                    setLocalValue(newVal)
                                    setRemoteValue(newVal)
                                    setShow(true)
                                }
                            })
                        }}><span>{`${isBinary ? "Cannot Show Binary Variable": "Show Value"}`}</span></div>
                    }</>) : (<div className={`var-table-input show-button rounded button disabled`} style={{width: "100%"}}><span>Variable is too large to preview</span></div>)}

                {/* <div className={`noselect ${ show ? "" : "rounded button" }`} style={{width: "100%", fontSize: "12pt", justifyContent: "center"}} onClick={() => {
                    setShow(true)
                }}>
                    { show === false ?
                    <span>Reveal Value</span>
                     : 
                    <div>
                        <textarea id={`env-${index}`} className={"var-table-input"} value={localValue} spellCheck="false"
                        style={{
                            width: "100%",
                            maxHeight: "38px",
                            fontFamily: "Arial, Helvetica, sans-serif"
                        }}
                        onChange={(ev) => {
                            setLocalValue(ev.target.value)
                        }} />
                    </div>}
                </div> */}
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0px" }}>
                {/* Size column */}
                {env.node.size} B
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0px", display: "flex" }}>
                {/* Actions column */}
                <EnvTableAction fetch={fetch} fetchVariables={fetchVariables} handleError={handleError} namespace={namespace} mode={mode} params={params} setError={setError} downloadVar={(vName) => {
                    setIsDownloading(true)
                    downloadVar(vName, setIsDownloading)
                }} 
                name={env.node.name} 
                setVar={setVar} 
                setLoading={setIsLoading} 
                value={localValue} 
                show={show} 
                resetValue={() => { 
                    setRemoteValue(localValue); 
                    setIsBinary(false) 
                }} hideEnv={() => { 
                        setShow(false); 
                        setLocalValue(remoteValue) 
                }} 
                index={index}
                edited={localValue !== remoteValue} />
            </div>
        </div>
        </>
    )
};

const EnvTableAction = (props) => {
    const { value, fetchVariables, show, hideEnv, name, setVar, edited, resetValue, setError, setLoading, downloadVar, namespace, mode, params, handleError, fetch } = props

    const onDrop = useCallback(
        async (acceptedFiles, fileRejections) => {
            if (fileRejections.length > 0) {
                setError(`Could not read file ${fileRejections[0].file.name}: ${fileRejections[0].errors[0].message}`)
            } else {
                setLoading(true)
                setVar(name, acceptedFiles[0], true).then(()=>{
                    resetValue()
                }).finally(()=>{
                    setLoading(false)
                })
            }
        },
        [name, setVar, resetValue, setError, setLoading]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false
    });

    let buttons = [];

    // Show Hidden Button
    if (show === true) {
        buttons.push(
            <div key={`${name}-btn-hide`} onClick={() => {
                hideEnv()
            }} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px" }} title="Hide" className={`circle button`}>
                <span style={{ flex: "auto" }}>
                    <IoEyeOffOutline style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                </span>
            </div>
        )

        buttons.push(
            <div key={`${name}-btn-save`} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px" }} title="Save Variable" className={`circle button ${edited && value !== "" ? "success" : "disabled"}`} onClick={() => { setLoading(true); setVar(name, value, true).then(() => { resetValue() }).finally(()=>{setLoading(false)}) }} >
                <span style={{ flex: "auto" }}>
                    <IoSave style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                </span>
            </div>
        )
    } else {
        buttons.push(
            <div key={`${name}-btn-download`} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px", display: "flex", justifyContent: "center", alignItems: "center" }} title="Download Variable" className={`circle button`} onClick={() => { 
                    downloadVar(name)
                }}>
                    <span>
                    <IoCloudDownloadOutline/>
                    </span>
            </div>
        )

        buttons.push(
            <div key={`${name}-btn-upload`} {...getRootProps({ className: 'dropzone' })} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px", display: "flex", justifyContent: "center", alignItems: "center" }} title="Upload Variable" className={`circle button`}>
                    <input {...getInputProps()} />
                    <span>
                    <IoCloudUploadOutline/>
                    </span>
            </div>
        )
    }

    buttons.push(
        <div title="Delete Variable" key={`${name}-btn-delete`}>
            <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={IoTrash} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={async () => { 
                try {
                    if(mode === "namespace") {
                        await NamespaceDeleteVariable(fetch, namespace, name, handleError)
                        fetchVariables()
                    } else {
                        await WorkflowDeleteVariable(fetch, namespace, params[0], name, handleError)
                        fetchVariables()
                    }
                } catch(e) {
                    setError(e.message)
                }
             }} />
        </div>
    )

    return (
        <>
            {buttons}
        </>
    )
};

const EnvRowEmpty = (props) => {
    return (
        <div className={`var-table-row new-entry new-entry-button`} style={{minHeight:"183px"}}>
            <div style={{ flexGrow: "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                <div style={{ fontSize: "12pt", fontWeight: "normal" }}>List is empty.</div>
            </div>
            <div/>
        </div>
        )
};

const EnvTableNewEntry = (props) => {
    const { setVar, setError } = props
    const [value, setValue] = useState("")
    const [name, setName] = useState("")
    const [show, setShow] = useState(false)
    const [isLoading, setIsLoading] = useState(false)


    const onDrop = useCallback(
        async (acceptedFiles, fileRejections) => {
            if (fileRejections.length > 0) {
                setError(`Could not read file ${fileRejections[0].file.name}: ${fileRejections[0].errors[0].message}`)
            } else {
                if (name === "") {
                    setError("Variable Name Required")
                    return
                }
                setIsLoading(true)
                setVar(name, acceptedFiles[0]).then((ok)=>{
                    if (ok) {
                        cleanup()
                    }
                }).finally(()=>{
                    setIsLoading(false)
                })

            }
        },
        [name, setError, setVar]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false
    });

    const cleanup = () => {
        setName("")
        setValue("")
        setShow(false)
    }


    return (
        <>
            {isLoading ? (<div className={"var-table-overlay"}>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%"}}>
                <div class="loader"></div> 
                <div style={{color: "white", fontSize: "12pt", fontWeight: "normal", paddingTop:"4px"}}>
                    Setting Variable...
                </div>
            </div>
            </div>) : <></>}
            {show ? (
                <div className="var-table-row new-entry">
                    <div style={{ flexGrow: "2", flexBasis: "0px" }}>
                        <div className={"var-table-row-name"} style={{ height: "inherit" }}>
                            <div style={{ display: "flex", height: "100%", justifyContent: "center", padding: "0px 10px 0px 16px" }}>
                             <textarea placeholder={"Name"} id={`new-entry-name`} className={"var-table-input"} value={name} spellCheck="false" onKeyDown={(e) => {
                                 if (e.code === "NumpadEnter" || e.code === "Enter") { e.preventDefault(); }
                             }} onChange={(ev) => {
                                 setName(ev.target.value)
                             }} />
                        </div>
                     </div>
                    </div>
                    <div style={{ flexGrow: "4", flexBasis: "0px" }}>
                        <div className={`var-table-row-value`} >
                            <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                                <textarea placeholder={"Value"} id={`new-entry-value`} className={"var-table-input"} value={value} spellCheck="false" onChange={(ev) => {
                                setValue(ev.target.value)
                                }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ flexGrow: "1", flexBasis: "0px" }}></div>
                    <div style={{ flexGrow: "1", flexBasis: "0px", display: "flex"}}>
                    <div className={"var-table-row-action"} >
                        <div key={`${name}-btn-upload`} {...getRootProps({ className: 'dropzone' })} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px", display: "flex", justifyContent: "center", alignItems: "center" }} title="Upload Variable" className={`circle button`}>
                                <input {...getInputProps()} />
                                <span>
                                    <IoCloudUploadOutline />
                                </span>
                        </div>
                        <div onClick={() => {
                            setIsLoading(true)
                            setVar(name, value).then((ok) => {
                                if (ok) {
                                    cleanup()
                                }
                            }).finally(()=>{
                                setIsLoading(false)
                            })
                        }} title="Save New Variable" className={`circle button ${value !== "" && name !== "" ? "success" : "disabled"}`}>
                            <span style={{ flex: "auto" }}>
                                <Plus style={{ fontSize: "20pt", margin: "4px 0px 0px 1px" }} />
                            </span>
                        </div>
                    </div>         
                    </div>
                </div>
            )
                : (<div className={`var-table-row new-entry new-entry-button`}>
                    <div style={{ flexGrow: "1", flexBasis: "0" }} />
                    <div className={`rounded button`} style={{ maxWidth: "200px", flexGrow: "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt", fontWeight: "normal" }} onClick={() => { setShow(true) }}>
                        <span>Add New Variable</span>
                    </div>
                    <div style={{ flexGrow: "1", flexBasis: "0" }} />
                </div>)}
        </>

    )
};

export default function EnvrionmentPage(props) {
    const q = useQuery()

    if(q.get("variables") === null) {
        return ""
    }
    return (
        <>
            <div className="container" style={{ flex: "auto", padding: "10px" }}>
                <div className="flex-row">
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs elements={["Namespace Settings"]} />
                    </div>
                </div>
                <EnvrionmentContainer />
            </div>
        </>
    )

}


export function EnvrionmentContainer(props) {
    const { namespace, fetch, handleError } = useContext(MainContext)
    const { mode } = props
    const [, setFetching] = useState(false) // TODO fetching safety checks
    const [error, setError] = useState("")
    const [envList, setEnvList] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const params = useParams()


    const fetchVariables = useCallback(() => {
        setError("")
        setFetching(true)
        async function fetchVars() {
            try {
                let vars = null
                if(mode === "namespace") {
                    vars = await NamespaceVariables(fetch, namespace, handleError)
                } else {
                    vars = await WorkflowVariables(fetch, namespace, params[0], handleError) 
                }
                setEnvList([...vars])
            } catch (e) {
                setError(`Error: ${e.message}`)
            }
        }
        return fetchVars().finally(() => { setFetching(false) })
    }, [fetch, handleError,  setFetching, mode, namespace ,params])

    const downloadVariable = useCallback((varName, setIsDownloading) => {
        setError("")
        setFetching(true)
        async function fetchVars() {
            try {
                let rr = null
                if(mode === "namespace") {
                    rr = await NamespaceDownloadVariable(fetch, namespace, varName, handleError)
                } else {
                    rr = await WorkflowDownloadVariable(fetch, namespace, params[0], varName, handleError)
                }
                const url = window.URL.createObjectURL(
                    new Blob([rr.blob],{
                        type: rr.contentType
                    }),
                )
                
                const link = document.createElement('a')
                link.href = url;
                link.setAttribute(
                    'download',
                    `${varName}`
                )

                document.body.appendChild(link)

                link.click()
                link.parentNode.removeChild(link)
            } catch (e) {
                setError(`Error: ${e.message}`)
            }
        }
        fetchVars().finally(() => { setFetching(false); setIsDownloading(false)})
    }, [fetch, handleError, setFetching, mode, namespace, params])

    useEffect(() => {
        if (namespace !== "") {
            fetchVariables().finally(() => { setIsLoading(false)})
        }
    }, [fetchVariables, namespace])

    async function setRemoteVariable(envName, envValue, force) {
        let ok = false
        setError("")
        setFetching(true)

        // EnvValue is a File
        const isFile = envValue instanceof File

        // Name and Value cannot be empty strings
        if (envName === "" || (envValue === "" && !isFile)) {
            setError("Failed To Create New Varaible: Variable Name and Value must not be empty...")
            setFetching(false)
            return ok
        }

        if (!force) {
            for (let i = 0; i < envList.length; i++) {
                if (envList[i].name === envName) {
                    setError("Failed To Create New Variable: Variable Name Already Exists")
                    setFetching(false)
                    return ok
                }
            }
        }

        envValue = envValue === undefined ? "" : envValue
        try {
            if(mode === "namespace") {
                ok = await NamespaceSetVariable(fetch, namespace, envName, envValue, handleError)            
            } else {
                ok = await WorkflowSetVariable(fetch, namespace, params[0], envName, envValue, handleError)
            }
            fetchVariables()
        } catch (e) {
            setError(`Error: ${e.message}`)
        }
        setFetching(false)
        return ok
    }

    async function getRemoteVariable(envName) {
        let data
        setError("")
        setFetching(true)
        try {
            if(mode === "namespace") {
                data = await NamespaceGetVariable(fetch, namespace, envName, handleError)
            } else {
                data = await WorkflowGetVariable(fetch, namespace, params[0], envName, handleError)
            }
            setEnvList((oldE) => {
                for (let i = 0; i < oldE.length; i++) {
                    if (oldE[i].node.name === envName) {
                        oldE[i].node.value = data
                        return oldE
                    }
                }
                oldE.push({ name: envName, value: data, size: 999 })
            })
        } catch (e) {
            setError(e.message)
        }
        setFetching(false)
        return data
    }

    return (
        <LoadingWrapper isLoading={isLoading} text={`Loading ${mode === "namespace" ? "Namespace" : "Workflow"} Variables`}>
            <div className="container" style={{ flex: "auto", flexDirection: "column", flexWrap: "wrap" }}>
                <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content", paddingBottom:"0px", flexGrow: "unset" }}>
                    <TileTitle name="Variables">
                        <IoLockOpen />
                    </TileTitle>
                    <div style={{ display: "flex", alignItems: "center", flexDirection: "column", marginRight: "-10px", marginLeft: "-10px" }}>
                        <div className={"var-table"}>
                            <div><EnvTableError error={error} hideError={() => { setError("") }} /></div>
                            <div className={`var-table-accent-header`}><EnvTableHeader /></div>
                            {envList.map((env, index) => {
                                return (<div key={`var-${env.node.name}`} className={`var-table-accent-${index % 2}`}>
                                    <EnvTableRow fetchVariables={fetchVariables} fetch={fetch} handleError={handleError} namespace={namespace} params={params} mode={mode} env={env} index={index} getVar={getRemoteVariable} setVar={setRemoteVariable} setError={setError} downloadVar={downloadVariable}/></div>)
                            })}
                            {
                                envList.length === 0 ? (
                                    <>
                                        <div className={`var-table-accent-0`}><EnvRowEmpty /></div>
                                        <div className={`var-table-accent-1 var-table-accent-end`}>
                                            <EnvTableNewEntry setError={setError} setVar={setRemoteVariable}/>
                                        </div>
                                    </>
                                ):(
                                    <div style={{ borderBottomRightRadius: "5px", borderBottomLeftRadius: "5px" }} className={`var-table-accent-${envList.length % 2} var-table-accent-end`}><EnvTableNewEntry setError={setError} setVar={setRemoteVariable} /></div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </LoadingWrapper>
    )
}