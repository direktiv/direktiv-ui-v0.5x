import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '@bit/vorteil.direktiv-legacy.breadcrumbs'
import TileTitle from '@bit/vorteil.direktiv-legacy.tile-title'
import MainContext from '@bit/vorteil.direktiv-legacy.context'
import PlusCircle from 'react-bootstrap-icons/dist/icons/plus-circle'
import XCircle from 'react-bootstrap-icons/dist/icons/x-circle'
import { useHistory } from 'react-router'
import { IoLockOpen, IoLogoDocker, IoTrash, IoWarningOutline } from 'react-icons/io5'
import { ConfirmButton, MiniConfirmButton } from '@bit/vorteil.direktiv-legacy.confirm-button'


function SettingsAction(props) {
    const { namespace, fetch, namespaces, fetchNamespaces, setNamespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const history = useHistory()
    const [err, setErr] = useState("")

    async function deleteNamespace() {
        try {
            let resp = await fetch(`/namespaces/${namespace}`, {
                method: "DELETE"
            })
            if (resp.ok) {
                let goto = ""
                for (let i = 0; i < namespaces.length; i++) {
                    if (namespaces[i] !== namespace) {
                        goto = namespaces[i]
                        break
                    }
                }
                if (goto === "") {
                    // if not found push to / as no namespaces probably exist
                    localStorage.setItem("namespace", "")
                    await fetchNamespaces(false, "")
                    setNamespace("")
                    // window.location.pathname = "/"
                    history.push("/")
                } else {
                    localStorage.setItem("namespace", goto)
                    await fetchNamespaces(false, goto)
                    history.push(`/${goto}`)
                }


            } else {
                await handleError('delete namespace', resp, 'deleteNamespace')
            }
        } catch(e) {
            setErr(`Failed to delete namespace: ${e.message}`)
        }
    }


    return (
       <>
       {
                err !== "" ?    <div style={{ display:"flex", alignItems:"center", marginRight:"20px", fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                {err}
                </div> :"" }
                {checkPerm(permissions, "deleteNamespace") ? 
       <div id="workflow-actions" className="" style={{ margin: "10px 10px 0px 0px" }}>
            <ConfirmButton ConfirmationText={"Delete Namespace Confirmation"} Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                deleteNamespace()
                ev.stopPropagation()
            }} />
        </div>: ""}
        </>
    )
}

export default function SettingsPage() {
    const { namespace } = useContext(MainContext)
    return (
        <>
            {namespace !== "" ?
                <div className="container" style={{ flex: "auto", padding: "10px" }}>
                    <div className="flex-row">
                        <div style={{ flex: "auto" }}>
                            <Breadcrumbs elements={["Namespace Settings"]} />
                        </div>
                        <SettingsAction />
                    </div>
                    <div className="container" style={{ flex: "auto", flexDirection: "row", flexWrap: "wrap" }}>
                        <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content" }}>
                            <TileTitle name="Secrets">
                                <IoLockOpen />
                            </TileTitle>
                            <Secrets />
                        </div>
                        <div className="item-0 shadow-soft rounded tile" style={{ height: "min-content" }}>
                            <TileTitle name="Container Registries">
                                <IoLogoDocker />
                            </TileTitle>
                            <Registries />
                        </div>
                    </div>
                </div>
                : ""}
        </>
    )
}

function Secrets() {

    const { fetch, namespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const [secrets, setSecrets] = useState([])
    const [key, setKey] = useState("")
    const [value, setValue] = useState("")
    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")

    const fetchS = useCallback(() => {
        async function fetchData() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                    method: "GET"
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.secrets) {
                        setSecrets(json.secrets)
                    } else {
                        setSecrets([])
                    }
                } else {
                        await handleError('fetch secrets', resp, 'listSecrets')
                }
            } catch (e) {
                setErr(`Failed to fetch secrets: ${e.message}`)
            }
        }
        fetchData()
    }, [fetch, namespace, handleError])

    useEffect(() => {
        fetchS()
    }, [fetchS])

    async function createSecret() {
        if(key !== "" && value !== "") {
            try {
                let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                    method: "POST",
                    body: JSON.stringify({ name: key, data: value })
                })
                if (resp.ok) {
                    setKey("")
                    setActionErr("")
                    setValue("")
                    fetchS()
                } else {
                        await handleError('create secret', resp, 'createSecret')                        
                }
            } catch (e) {
                setActionErr(`Failed to create secret: ${e.message}`)
            }
        } else {
            setActionErr(`Failed to create Secret: key and value needs to be provided.`)
        }
    
    }

    async function deleteSecret(val) {
        try {
            let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                method: "DELETE",
                body: JSON.stringify({ name: val })
            })
            if (resp.ok) {
                // refetch secrets
                setActionErr("")
                fetchS()
            } else {
                await handleError('delete secret', resp, 'deleteSecret')
            }
        } catch (e) {
            setActionErr(`Failed to delete secret: ${e.message}`)
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
         
            {actionErr !== "" ?    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                             {actionErr}
                             </div>
            :""}
            <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                <thead>
                    <tr className="no-neumorph">
                        <th style={{}}>
                            Key
                                    </th>
                        <th style={{}}>
                            Value
                                    </th>
                        <th style={{ width: "50px" }}>

                        </th>
                    </tr>
                </thead>
                <tbody>
                {
                err !== "" ?    <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                {err}
                </div>
                :
                    secrets.map((obj) => {
                        return (
                            <tr key={obj.name}>
                                <td style={{ paddingLeft: "10px" }}>
                                    <input style={{ maxWidth: "150px" }} type="text" disabled value={obj.name} />
                                </td>
                                <td style={{ paddingRight: "10px" }} colSpan="2">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <input style={{ maxWidth: "150px" }} type="password" disabled value=".........." />
                                        {checkPerm(permissions, "deleteSecret")?  
                                        <div style={{ marginLeft: "10px", maxWidth: "38px" }}>
                                            <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={XCircle} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={(ev) => {
                                                deleteSecret(obj.name)
                                            }} />
                                        </div>:""}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                    {checkPerm(permissions, "createSecret") ? 
                    <tr>
                        <td style={{ paddingLeft: "10px" }}>
                            <input style={{ maxWidth: "150px" }} type="text" placeholder="Enter Key.." value={key} onChange={(e) => setKey(e.target.value)} />
                        </td>
                        <td style={{ paddingRight: "10px" }} colSpan="2">
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <input type="text" style={{ maxWidth: "150px" }} placeholder="Enter Value.." value={value} onChange={(e) => setValue(e.target.value)} />
                                <div className="circle button success" style={{ marginLeft: "10px" }} onClick={() => createSecret()}>
                                    <span style={{ flex: "auto" }}>
                                        <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>:""}
                </tbody>
            </table>
        </div>
    )
}

function Registries() {

    const { fetch, namespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const [name, setName] = useState("")
    const [user, setUser] = useState("")
    const [token, setToken] = useState("")
    const [registries, setRegistries] = useState([])
    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")

    const fetchR = useCallback(() => {
        async function fetchData() {
            try {
                let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                    method: "GET",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    if (json.registries) {
                        setRegistries(json.registries)
                    } else {
                        setRegistries([])
                    }
                } else {
                        await handleError('fetch registries', resp, 'listRegistries')
                }
            } catch (e) {
                setErr(`Failed to fetch registries: ${e.message}`)
            }
        }
        fetchData()
    }, [fetch, namespace, handleError])

    useEffect(() => {
        fetchR()
    }, [fetchR])

    async function createRegistry() {
        if(name !== "" && user !== "" && token !== "") {
            try {
                let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                    method: "POST",
                    body: JSON.stringify({ "name": name, "data": `${user}:${token}` })
                })
                if (resp.ok) {
                    setName("")
                    setToken("")
                    setUser("")
                    setActionErr("")
                    fetchR()
                } else {
                        await handleError('create registry', resp, 'createRegistry')
                }
            } catch (e) {
                setActionErr(`Failed to create registry: ${e.message}`)
            }
        } else {
            setActionErr(`Failed to create a registry: Name, user and Token needs to be provided.`)
        }

    }

    async function deleteRegistry(val) {
        try {
            let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                method: "DELETE",
                body: JSON.stringify({ name: val })
            })
            if (resp.ok) {
                // fetch registries
                setActionErr("")
                fetchR()
            } else {
                    await handleError('delete registry', resp, 'deleteRegistry')
            }
        } catch (e) {
            setActionErr(`Failed to delete registry: ${e.message}`)
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
       
            {actionErr !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                {actionErr}
                </div>: "" }
            <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                <thead>
                    <tr className="no-neumorph">
                        <th style={{}}>
                            URL
                        </th>
                        <th style={{}}>
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
                    <>
                    {err !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                {err}
                </div>
            :
                    registries.map((obj) => {
                        return (
                            <tr key={obj.name}>
                                <td style={{ paddingLeft: "10px" }}>
                                    <input style={{ maxWidth: "150px" }} type="text" disabled value={obj.name} />
                                </td>
                                <td>
                                    <input style={{ maxWidth: "150px" }} type="text" disabled value={"*******"} />
                                </td>
                                <td style={{ paddingRight: "10px" }} colSpan="2">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <input style={{ maxWidth: "150px" }} type="password" disabled value="*******" />
                                        {checkPerm(permissions, "deleteRegistry")?  
                                        
                                        <div style={{ marginLeft: "10px", maxWidth: "38px" }}>
                                            <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={XCircle} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={(ev) => {
                                                deleteRegistry(obj.name)
                                            }} />
                                        </div>: ""}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                        {checkPerm(permissions, "createRegistry") ? 

                    <tr>
                        <td style={{ paddingLeft: "10px" }}>
                            <input style={{ maxWidth: "150px" }} type="text" onChange={(e) => setName(e.target.value)} value={name} placeholder="Enter URL" />
                        </td>
                        <td>
                            <input style={{ maxWidth: "150px" }} type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Enter User" />
                        </td>
                        <td style={{ paddingRight: "10px" }} colSpan="2">
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <input style={{ maxWidth: "150px" }} type="password" value={token} placeholder="Enter Token" onChange={(e) => setToken(e.target.value)} />
                                <div title="Create Registry" className="circle button success" style={{ marginLeft: "10px" }} onClick={() => createRegistry()}>
                                    <span style={{ flex: "auto" }}>
                                        <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>: ""}
                    </>
                </tbody>
            </table>
        </div>
    )
}


