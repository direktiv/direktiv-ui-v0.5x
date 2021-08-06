import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import { Plus, XCircle } from 'react-bootstrap-icons'
import { useParams } from 'react-router'
import { IoLockOpen, IoSave, IoTrash, IoEyeOffOutline, IoWarningOutline, IoCloudUploadOutline, IoCloudDownloadOutline } from 'react-icons/io5'
import { MiniConfirmButton } from '../confirm-button'
import { useDropzone } from 'react-dropzone'
import LoadingWrapper from "../loading"
import bytes from 'bytes'


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
            <div className={"var-table-row-name"} >
                Name
                </div>
            <div className={"var-table-row-value"} style={{ paddingTop: "0px", paddingBottom: "0px" }} >
                Value
                </div>
            <div className={"var-table-row-size"} >
                Size
                </div>
            <div className={"var-table-row-action"} style={{ justifyContent: "center", paddingTop: "0px", paddingBottom: "0px" }}>
                Action
                </div>
        </div>
    )
};

const EnvTableRow = (props) => {
    const { env, index, setVar, getVar, downloadVar, setError } = props
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
        <div className={`var-table-row ${show === true ? "show-value" : ""}`}>
            <div className={"var-table-row-name"} >
                {env.name}
            </div>
            <div className={`var-table-row-value`} >
                <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                    {env.size < 1000000 ? (<>{show === true ?
                        <textarea id={`env-${index}`} className={"var-table-input"} value={localValue} spellCheck="false" onChange={(ev) => {
                            setLocalValue(ev.target.value)
                        }} />
                        :
                        <div className={`var-table-input show-button rounded button ${isBinary ? "disabled": ""}`} onClick={() => {
                            getVar(env.name).then((newVal) => {
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
                    }</>) : (<div className={"var-table-input show-button rounded button disabled"}><span>Variable is too large to preview</span></div>)}
                    
                </div>
            </div>
            <div className={"var-table-row-size"} >
                {bytes(env.size)}
            </div>
            <div className={"var-table-row-action"} >
                <EnvTableAction setError={setError} downloadVar={(vName) => {
                    setIsDownloading(true)
                    downloadVar(vName, setIsDownloading)
                }} name={env.name} setVar={setVar} setLoading={setIsLoading} value={localValue} show={show} resetValue={() => { setRemoteValue(localValue); setIsBinary(false) }} hideEnv={() => { setShow(false); setLocalValue(remoteValue) }} index={index} edited={localValue !== remoteValue} />
            </div>
        </div>
        </>
    )
};

const EnvTableAction = (props) => {
    const { value, show, hideEnv, name, setVar, edited, resetValue, setError, setLoading, downloadVar } = props

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
            <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={IoTrash} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={() => { setVar(name, undefined, true) }} />
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
            <div style={{ flexGrow: "1", flexBasis: "0" }} />
            <div style={{ flexGrow: "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                <span>No Variables</span>
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0" }} />
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
                <div style={{color: "white", fontWeight: "bold", paddingTop:"4px"}}>
                    Setting Variable...
                </div>
            </div>
            </div>) : <></>}
            {show ? (
                <div className={`var-table-row new-entry`}>
                    <div className={"var-table-row-name"} style={{ height: "inherit" }}>
                        <div style={{ display: "flex", height: "100%", justifyContent: "center", padding: "0px 10px 0px 16px" }}>
                            <textarea placeholder={"Name"} id={`new-entry-name`} className={"var-table-input"} value={name} spellCheck="false" onKeyDown={(e) => {
                                if (e.code === "NumpadEnter" || e.code === "Enter") { e.preventDefault(); }
                            }} onChange={(ev) => {
                                setName(ev.target.value)
                            }} />
                        </div>
                    </div>
                    <div className={`var-table-row-value`} >
                        <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                            <textarea placeholder={"Value"} id={`new-entry-value`} className={"var-table-input"} value={value} spellCheck="false" onChange={(ev) => {
                                setValue(ev.target.value)
                            }} />
                        </div>
                    </div>
                    <div className={"var-table-row-size"} >
                    </div>
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
                </div>) : (<div className={`var-table-row new-entry new-entry-button`}>
                    <div style={{ flexGrow: "1", flexBasis: "0" }} />
                    <div className={`rounded button`} style={{ flexGrow: "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }} onClick={() => { setShow(true) }}>
                        <span>Add New Variable</span>
                    </div>
                    <div style={{ flexGrow: "1", flexBasis: "0" }} />
                </div>)}
        </>

    )
};

export default function EnvrionmentPage(props) {
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

    const getPath = useCallback(() => {
        function generatePath() {
            if (mode === "namespace") {
                return `/namespaces/${namespace}`
            } else {
                return `/namespaces/${namespace}/workflows/${params.workflow}`
            }


        }
        return generatePath()
    }, [namespace, params.workflow, mode])

    const fetchVariables = useCallback(() => {
        setError("")
        setFetching(true)
        async function fetchVars() {
            try {
                let resp = await fetch(`${getPath()}/variables/`, {
                    method: "get",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.variables) {
                        setEnvList([...json.variables])
                    } else {
                        setEnvList([])
                    }
                } else {
                    await handleError('fetch variables', resp, 'getVariables')
                }
            } catch (e) {
                setError(`Failed to fetch variables: ${e.message}`)
            }
        }
        return fetchVars().finally(() => { setFetching(false) })
    }, [fetch, handleError, getPath, setFetching])

    const downloadVaraible = useCallback((varName, setIsDownloading) => {
        setError("")
        setFetching(true)
        async function fetchVars() {
            try {
                let resp = await fetch(`${getPath()}/variables/${varName}`, {
                    method: "get",
                })
                if (resp.ok) {
                    let blob = await resp.blob()

                    // Create blob link to download
                    const url = window.URL.createObjectURL(
                        new Blob([blob]),
                    );
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute(
                        'download',
                        `${varName}`,
                    );
                
                    // Append to html link element page
                    document.body.appendChild(link);
                
                    // Start download
                    link.click();
                
                    // Clean up and remove the link
                    link.parentNode.removeChild(link);
                } else {
                    await handleError('fetch variables', resp, 'getVariables')
                }
            } catch (e) {
                setError(`Failed to fetch variables: ${e.message}`)
            }
        }
        fetchVars().finally(() => { setFetching(false); setIsDownloading(false)})
    }, [fetch, handleError, getPath, setFetching])

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
                    setError("Failed To Create New Varaible: Variable Name Already Exists")
                    setFetching(false)
                    return ok
                }
            }
        }

        envValue = envValue === undefined ? "" : envValue
        try {
            let resp = await fetch(`${getPath()}/variables/${envName}`, {
                method: "post",
                body: envValue,
            })
            if (resp.ok) {
                ok = true
                fetchVariables()
            } else {
                await handleError('fetch variables', resp, 'getVariables')
            }
        } catch (e) {
            setError(`Failed to fetch variables: ${e.message}`)
        }
        setFetching(false)
        return ok
    }

    async function getRemoteVariable(envName) {
        let returnValue
        setError("")
        setFetching(true)
        try {
            let resp = await fetch(`${getPath()}/variables/${envName}`, {
                method: "get",
            })
            if (resp.ok) {
                returnValue = await resp.text()
                setEnvList((oldE) => {
                    for (let i = 0; i < oldE.length; i++) {
                        if (oldE[i].name === envName) {
                            oldE[i].value = returnValue
                            return oldE
                        }
                    }

                    oldE.push({ name: envName, value: returnValue, size: 999 })
                })
            } else {
                await handleError('fetch variable', resp, 'getVariables')
            }
        } catch (e) {
            setError(`Failed to get variable: ${e.message}`)
        }
        setFetching(false)
        return returnValue
    }

    return (
        <LoadingWrapper isLoading={isLoading} text={`Loading ${mode === "namespace" ? "Namespace" : "Workflow"} Variables`}>
            <div className="container" style={{ flex: "auto", flexDirection: "column", flexWrap: "wrap" }}>
                <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content", paddingBottom:"0px" }}>
                    <TileTitle name="Variables">
                        <IoLockOpen />
                    </TileTitle>
                    <div style={{ display: "flex", alignItems: "center", flexDirection: "column", marginRight: "-10px", marginLeft: "-10px" }}>
                        <div className={"var-table"}>
                            <div><EnvTableError error={error} hideError={() => { setError("") }} /></div>
                            <div className={`var-table-accent-header`}><EnvTableHeader /></div>
                            {envList.map((env, index) => {
                                return (<div key={`var-${env.name}`} className={`var-table-accent-${index % 2}`}>
                                    <EnvTableRow env={env} index={index} getVar={getRemoteVariable} setVar={setRemoteVariable} setError={setError} downloadVar={downloadVaraible}/></div>)
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
                                    <div className={`var-table-accent-${envList.length % 2} var-table-accent-end`}><EnvTableNewEntry setError={setError} setVar={setRemoteVariable} /></div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </LoadingWrapper>
    )
}