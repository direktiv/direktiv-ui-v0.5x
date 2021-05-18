import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import { Plus, XCircle } from 'react-bootstrap-icons'
import { useHistory } from 'react-router'
import { IoLockOpen, IoSave, IoTrash, IoEyeOffOutline, IoWarningOutline } from 'react-icons/io5'
import { ConfirmButton, MiniConfirmButton } from '../confirm-button'



export default function EnvrionmentPage() {
    const { namespace, permissions, checkPerm, fetch } = useContext(MainContext)
    const [envList, setEnvList] = useState([
        { name: "username", value: "admin", size: "10kb" },
        { name: "password", value: "secure-password", size: "1kb" },
])
    console.log("hello?")

    async function deleteEnv(envName) {
        return
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
                    <span>
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
        const { env, index } = props
        const [localValue, setLocalValue] = useState(env.value)
        const [show, setShow] = useState(false)

        return (
            <div className={`var-table-row ${show === true ? "show-value" : ""}`}>
                <div className={"var-table-row-name"} >
                    {env.name}
                </div>
                <div className={`var-table-row-value`} >
                    <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                        {show === true ?
                            <textarea id={`env-${index}`} className={"var-table-input"} value={localValue} spellCheck="false" onChange={(ev) => {
                                setLocalValue(ev.target.value)
                            }} />
                            :
                            <div className={"var-table-input show-button rounded button"} onClick={() => {
                                setShow(true)
                            }}><span>Show Value</span></div>
                        }
                    </div>
                </div>
                <div className={"var-table-row-size"} >
                    {localValue === env.value ? env.size : ""}
                </div>
                <div className={"var-table-row-action"} >
                    <EnvTableAction value={localValue} show={show} hideEnv={() => { setShow(false); setLocalValue(env.value) }} index={index} />
                </div>
            </div>
        )
    };

    const EnvTableAction = (props) => {
        const { value, show, index, hideEnv } = props
        let buttons = [];

        // Show Hidden Button
        if (show === true) {
            buttons.push(<div onClick={() => {
                hideEnv()
            }} style={{ marginRight: "6pt" }} title="Hide" className={`circle button`}>
                <span style={{ flex: "auto" }}>
                    <IoEyeOffOutline style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
                </span>
            </div>)
        }

        buttons.push(<div onClick={() => {
            console.log(" value =", value)
        }} style={{ marginRight: "6pt" }} title="Save Variable" className={`circle button ${envList[index].value !== value ? "success" : "disabled"}`}>
            <span style={{ flex: "auto" }}>
                <IoSave style={{ fontSize: "12pt", marginBottom: "6px", marginLeft: "0px" }} />
            </span>
        </div>)

        buttons.push(
            <div title="Delete Variable">
                <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={IoTrash} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={(ev) => {
                    deleteEnv("hello").then(() => {
                        // TODO
                    })
                }} /></div>
        )


        return (
            <>
                {buttons}
            </>
        )
    };

    const EnvTableNewEntry = (props) => {
        const { setError } = props
        const [value, setValue] = useState("")
        const [name, setName] = useState("")
        const [show, setShow] = useState(false)


        return (
            <>
                {show ? (<div className={`var-table-row new-entry`}>
                    <div className={"var-table-row-name"} style={{ height: "inherit" }}>
                        <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                            <textarea placeholder={"Name"} id={`env-new-entry`} className={"var-table-input"} value={name} spellCheck="false" onChange={(ev) => {
                                setName(ev.target.value)
                            }} />
                        </div>
                    </div>
                    <div className={`var-table-row-value`} >
                        <div style={{ display: "flex", height: "100%", justifyContent: "center" }}>
                            <textarea placeholder={"Value"} id={`env-new-entry`} className={"var-table-input"} value={value} spellCheck="false" onChange={(ev) => {
                                setValue(ev.target.value)
                            }} />
                        </div>
                    </div>
                    <div className={"var-table-row-size"} >
                    </div>
                    <div className={"var-table-row-action"} >
                        <div onClick={() => {
                            setError("Failed To Create New Varaible: Variable Name must not be empty...")
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

    const EnvTable = () => {
        const [error, setError] = useState("")

        return (
            <>
                <div className={"var-table"}>
                    <div><EnvTableError error={error} hideError={() => { setError("") }} /></div>
                    <div className={`var-table-accent-header`}><EnvTableHeader /></div>
                    {envList.map((env, index) => { return (<div className={`var-table-accent-${index % 2}`}><EnvTableRow env={env} index={index} /></div>) })}
                    <div className={`var-table-accent-${envList.length % 2}`}><EnvTableNewEntry setError={setError} /></div>
                </div>
            </>
        )
    };

    return (
        <>
            <div className="container" style={{ flex: "auto", padding: "10px" }}>
                <div className="flex-row">
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs elements={["Namespace Settings"]} />
                    </div>
                </div>
                <div className="container" style={{ flex: "auto", flexDirection: "column", flexWrap: "wrap" }}>
                    <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content" }}>
                        <TileTitle name="Variables">
                            <IoLockOpen />
                        </TileTitle>
                        <div style={{ display: "flex", alignItems: "center", flexDirection: "column", marginRight: "-10px", marginLeft: "-10px" }}>
                            <EnvTable />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}