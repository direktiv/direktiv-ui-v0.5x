import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import { Plus, XCircle } from 'react-bootstrap-icons'
import { useParams } from 'react-router'
import { IoLockOpen, IoSave, IoTrash, IoEyeOffOutline, IoWarningOutline, IoCloudUploadOutline } from 'react-icons/io5'
import { MiniConfirmButton } from '../confirm-button'
import { useDropzone } from 'react-dropzone'


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
    const { env, index, setVar, getVar } = props
    const [localValue, setLocalValue] = useState("")
    const [remoteValue, setRemoteValue] = useState("")
    const [show, setShow] = useState(false)

    return (
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
                        <div className={"var-table-input show-button rounded button"} onClick={() => {
                            getVar(env.name).then((newVal) => {
                                if (!newVal) {
                                    return // TODO: Throw error
                                }
                                setLocalValue(newVal)
                                setRemoteValue(newVal)
                                setShow(true)
                            })
                        }}><span>Show Value</span></div>
                    }</>) : (<div className={"var-table-input show-button rounded button disabled"}><span>Variable is too large to preview</span></div>)}
                    
                </div>
            </div>
            <div className={"var-table-row-size"} >
                {env.size} bytes
            </div>
            <div className={"var-table-row-action"} >
                <EnvTableAction name={env.name} setVar={setVar} value={localValue} show={show} resetValue={() => { setRemoteValue(localValue) }} hideEnv={() => { setShow(false); setLocalValue(remoteValue) }} index={index} edited={localValue !== remoteValue} />
            </div>
        </div>
    )
};

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (res) => {
            resolve(res.target.result)
        }

        reader.onerror = (err) => reject(err)
        reader.readAsText(file)
    })
}

function Basic(props) {
    const { setData, files, setFiles, setErr, setVar, varName } = props

    const onDrop = useCallback(
        async (acceptedFiles, fileRejections) => {
            if (fileRejections.length > 0) {
                console.log(`Invalid File: File: '${fileRejections[0].file.name}' is not supported, ${fileRejections[0].errors[0].message}`)
            } else {
                setVar(varName, await readFile(acceptedFiles[0]), true)
            }
        },
        [setData, setFiles, setErr]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false
    });

    return (
            <div {...getRootProps({ className: 'dropzone' })} style={{ cursor: "pointer", height: "36px", width: "36px" }}>
                <input {...getInputProps()} />
                <IoCloudUploadOutline/>
            </div>
    );
}

const EnvTableAction = (props) => {
    const { value, show, hideEnv, name, setVar, edited, resetValue } = props
    const [data, setData] = useState("")
    const [files, setFiles] = useState([])
    const [err, setErr] = useState("")

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
    }

    buttons.push(
        <div key={`${name}-btn-save`} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px" }} title="Save Variable" className={`circle button ${edited && value !== "" ? "success" : "disabled"}`} onClick={() => { setVar(name, value, true).then(() => { resetValue() }) }} >
            <span style={{ flex: "auto" }}>
                <IoSave style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
            </span>
        </div>
    )

    buttons.push(
        <div key={`${name}-btn-upload`} style={{ marginRight: "6pt", minWidth: "36px", minHeight: "36px" }} title="Save Variable" className={`circle button`}>
                            <Basic setErr={setErr} files={files} setFiles={setFiles} data={data} setData={setData} setVar={setVar} varName={name}/>

        </div>
    )

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
        <div className={`var-table-row new-entry new-entry-button`}>
            <div style={{ flexGrow: "1", flexBasis: "0" }} />
            <div style={{ flexGrow: "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                <span>No Variables</span>
            </div>
            <div style={{ flexGrow: "1", flexBasis: "0" }} />
        </div>
        )
};

const EnvTableNewEntry = (props) => {
    const { setVar } = props
    const [value, setValue] = useState("")
    const [name, setName] = useState("")
    const [show, setShow] = useState(false)

    const cleanup = () => {
        setName("")
        setValue("")
        setShow(false)
    }


    return (
        <>
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
                        <div onClick={() => {
                            setVar(name, value).then((ok) => {
                                if (ok) {
                                    cleanup()
                                }
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
    const [fetching, setFetching] = useState(false) // TODO fetching safety checks
    const [error, setError] = useState("")
    const [envList, setEnvList] = useState([])

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
        fetchVars().finally(() => { setFetching(false) })
    }, [fetch, handleError, getPath, setFetching])

    useEffect(() => {
        if (namespace !== "") {
            fetchVariables()
        }
    }, [fetchVariables, namespace])

    async function setRemoteVariable(envName, envValue, force) {
        let ok = false
        setError("")
        setFetching(true)

        // Name and Value cannot be empty strings
        if (envName === "" || envValue === "") {
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
        <div className="container" style={{ flex: "auto", flexDirection: "column", flexWrap: "wrap" }}>
            <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content" }}>
                <TileTitle name="Variables">
                    <IoLockOpen />
                </TileTitle>
                <div style={{ display: "flex", alignItems: "center", flexDirection: "column", marginRight: "-10px", marginLeft: "-10px" }}>
                    <div className={"var-table"}>
                        <div><EnvTableError error={error} hideError={() => { setError("") }} /></div>
                        <div className={`var-table-accent-header`}><EnvTableHeader /></div>
                        {envList.map((env, index) => {
                            return (<div key={`var-${env.name}`} className={`var-table-accent-${index % 2}`}>
                                <EnvTableRow env={env} index={index} getVar={getRemoteVariable} setVar={setRemoteVariable} /></div>)
                        })}
                        {
                            envList.length === 0 ? (
                                <>
                                    <div className={`var-table-accent-0`}><EnvRowEmpty /></div>
                                    <div className={`var-table-accent-1 var-table-accent-end`}>
                                        <EnvTableNewEntry setError={setError} setVar={setRemoteVariable} />
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
    )
}