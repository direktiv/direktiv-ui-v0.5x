import React, { useCallback, useContext, useEffect, useState, useRef } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import PlusCircle from 'react-bootstrap-icons/dist/icons/plus-circle'
import XCircle from 'react-bootstrap-icons/dist/icons/x-circle'
import { useHistory } from 'react-router'
import { IoLockOpen, IoLogoDocker, IoSave, IoTrash, IoWarningOutline, IoSettingsSharp } from 'react-icons/io5'
import { ConfirmButton, MiniConfirmButton } from '../confirm-button'
import { EnvrionmentContainer } from "../environment-page"
import LoadingWrapper from "../loading"
import { SetNamespaceConfiguration, NamespaceConfiguration, NamespaceCreateRegistry, NamespaceCreateSecret, NamespaceDelete, NamespaceDeleteRegistry, NamespaceDeleteSecret, NamespaceRegistries, NamespaceSecrets, GlobalCreateRegistry, GlobalDeleteRegistry, GlobalRegistries, GlobalPrivateCreateRegistry, GlobalPrivateDeleteRegistry, GlobalPrivateRegistries } from '../../api'
import Editor from "../workflow-page/editor"

import YAML2String from 'yaml'
import YAML from 'js-yaml'




function SettingsAction(props) {
    const { namespace, fetch, namespaces, fetchNamespaces, setNamespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const history = useHistory()
    const [err, setErr] = useState("")

    async function deleteNamespace() {
        try {
            await NamespaceDelete(fetch, namespace, handleError)
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
                history.push(`/n/${goto}`)
            }
        } catch (e) {
            setErr(`Error: ${e.message}`)
        }
    }


    return (
        <>
            {
                err !== "" ? <div style={{ display: "flex", alignItems: "center", marginRight: "20px", fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {err}
                </div> : ""}
            {checkPerm(permissions, "deleteNamespace") ?
                <div id="workflow-actions" className="" style={{ margin: "10px 10px 0px 0px" }}>
                    <ConfirmButton ConfirmationText={"Delete Namespace Confirmation"} Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                        deleteNamespace()
                        ev.stopPropagation()
                    }} />
                </div> : ""}
        </>
    )
}

export default function SettingsPage() {
    const { namespace } = useContext(MainContext)
    return (
        <>
            {namespace !== "" ?
                <>
                    <div className="flex-row" style={{ maxHeight: "64px" }}>
                        <div style={{ flex: "auto" }}>
                            <Breadcrumbs elements={["Workflows", "Example"]} />
                        </div>
                        <SettingsAction />
                    </div>
                    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
                        <div className="container" style={{ flexDirection: "row", flexWrap: "nowrap" }}>
                            <div className="container" style={{ flexDirection: "column", flexGrow: 1, flexBasis: "0px" }}>
                                <div className="item-0 shadow-soft rounded tile" style={{ minHeight: "300px" }}>
                                    <TileTitle name="Secrets">
                                        <IoLockOpen />
                                    </TileTitle>
                                    <Secrets />
                                </div>
                                <div className="item-0 shadow-soft rounded tile" style={{ flexBasis: "unset" }}>
                                    <TileTitle name="Container Registries">
                                        <IoLogoDocker />
                                    </TileTitle>
                                    <Registries />
                                </div>
                            </div>
                            <div className="item-0 shadow-soft rounded tile" style={{ flexBasis: "0px"}}>
                                <TileTitle name="Configuration">
                                    <IoSettingsSharp />
                                </TileTitle>
                                <Configuration />
                            </div>
                        </div>
                        <EnvrionmentContainer mode={"namespace"} />
                    </div>
                </>
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

    // Loading 
    const [isLoading, setIsLoading] = useState(true)
    const [opacity, setOpacity] = useState(null)
    const [loadingText, setLoadingText] = useState("Loading Namespace Secrets")

    const fetchS = useCallback(() => {
        async function fetchData() {
            try {
                let secrets = await NamespaceSecrets(fetch, namespace, handleError)
                setSecrets(secrets)
            } catch (e) {
                setErr(e.message)
            }
        }
        return fetchData()
    }, [fetch, namespace, handleError])

    useEffect(() => {
        fetchS().finally(() => { setIsLoading(false); setOpacity(30) })
    }, [fetchS])

    async function createSecret() {
        if (key !== "" && value !== "") {
            try {
                await NamespaceCreateSecret(fetch, namespace, key, value, handleError)
                setKey("")
                setActionErr("")
                setValue("")
                return fetchS()
            } catch(e) {
                setActionErr(`Error: ${e.message}`)
            }
        } else {
            setActionErr(`Failed to create Secret: key and value needs to be provided.`)
        }

    }

    async function deleteSecret(val) {
        try {
            await NamespaceDeleteSecret(fetch, namespace, val, handleError)
            // refetch secrets
            setActionErr("")
            return fetchS()
        } catch (e) {
            setActionErr(e.message)
        }
    }

    return (
        <LoadingWrapper isLoading={isLoading} text={loadingText} opacity={opacity}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", maxHeight: "320px", overflow: "auto", minHeight: "265px", height:"1px" }}>

                {actionErr !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                    {actionErr}
                </div>
                    : ""}
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
                    <tbody>                        {checkPerm(permissions, "createSecret") ?
                            <tr>
                                <td style={{ paddingLeft: "10px" }}>
                                    <input style={{ maxWidth: "150px" }} type="text" placeholder="Enter Key.." value={key} onChange={(e) => setKey(e.target.value)} />
                                </td>
                                <td style={{ paddingRight: "10px" }} colSpan="2">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <input type="text" style={{ maxWidth: "150px" }} placeholder="Enter Value.." value={value} onChange={(e) => setValue(e.target.value)} />
                                        <div className="circle button success" style={{ marginLeft: "10px" }} onClick={() => {
                                            setLoadingText("Creating Secret")
                                            setIsLoading(true)
                                            createSecret().finally(() => { setIsLoading(false)})
                                        }}>
                                            <span style={{ flex: "auto" }}>
                                                <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr> : ""}
                        {
                            err !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                {err}
                            </div>
                                :
                                secrets.map((obj) => {
                                    return (
                                        <tr key={obj.node.name}>
                                            <td style={{ paddingLeft: "10px" }}>
                                                <input style={{ maxWidth: "150px" }} type="text" disabled value={obj.node.name} />
                                            </td>
                                            <td style={{ paddingRight: "10px" }} colSpan="2">
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    <input style={{ maxWidth: "150px" }} type="password" disabled value=".........." />
                                                    {checkPerm(permissions, "deleteSecret") ?
                                                        <div style={{ marginLeft: "10px", maxWidth: "38px" }}>
                                                            <MiniConfirmButton IconConfirm={IoWarningOutline} IconConfirmColor={"#ff9104"} style={{ fontSize: "12pt" }} Icon={XCircle} IconColor={"var(--danger-color)"} Minified={true} OnConfirm={(ev) => {
                                                                setLoadingText("Deleting Secret")
                                                                setIsLoading(true)
                                                                deleteSecret(obj.node.name).finally(() => { setIsLoading(false)})
                                                            }} />
                                                        </div> : ""}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}

                    </tbody>
                </table>
            </div>
        </LoadingWrapper>
    )
}

export function Registries(props) {

    const { mode } = props
    const { fetch, namespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const [name, setName] = useState("")
    const [user, setUser] = useState("")
    const [token, setToken] = useState("")
    const [registries, setRegistries] = useState([])
    const [err, setErr] = useState("")
    const [actionErr, setActionErr] = useState("")

    // Loading 
    const [isLoading, setIsLoading] = useState(true)
    const [opacity, setOpacity] = useState(null)
    const [loadingText, setLoadingText] = useState("Loading Registries")

    const fetchR = useCallback(() => {
        async function fetchData() {
            try {
                var remoteRegistries
                switch(mode) {
                    case "global":
                        remoteRegistries = await GlobalRegistries(fetch, handleError)
                      break;
                    case "global-private":
                        remoteRegistries = await GlobalPrivateRegistries(fetch, handleError)
                      break;
                    default:
                        remoteRegistries = await NamespaceRegistries(fetch, namespace, handleError)
                  } 
                setRegistries(remoteRegistries)
            } catch (e) {
                setErr(e.message)
            }
        }
        return fetchData()
    }, [fetch, namespace, handleError, mode])

    useEffect(() => {
        fetchR().finally(() => { setIsLoading(false); setOpacity(30) })
    }, [fetchR])

    async function createRegistry() {
        if (name !== "" && user !== "" && token !== "") {
            try {
                switch(mode) {
                    case "global":
                        await GlobalCreateRegistry(fetch, name, `${user}:${token}`, handleError)
                      break;
                    case "global-private":
                        await GlobalPrivateCreateRegistry(fetch, name, `${user}:${token}`, handleError)
                      break;
                    default:
                        await NamespaceCreateRegistry(fetch, namespace, name, `${user}:${token}`, handleError)
                  } 
                setName("")
                setToken("")
                setUser("")
                setActionErr("")
                return fetchR()
            } catch (e) {
                setActionErr(`Error: ${e.message}`)
            }
        } else {
            setActionErr(`Failed to create a registry: Name, user and Token needs to be provided.`)
        }

    }

    async function deleteRegistry(val) {
        try {
            switch(mode) {
                case "global":
                    await GlobalDeleteRegistry(fetch,  val, handleError)
                  break;
                case "global-private":
                    await GlobalPrivateDeleteRegistry(fetch,  val, handleError)
                  break;
                default:
                    await NamespaceDeleteRegistry(fetch, namespace, val, handleError)
              } 
            // fetch registries
            setActionErr("")
            return fetchR()
        } catch (e) {
            setActionErr(`Error: ${e.message}`)
        }
    }

    return (
        <LoadingWrapper isLoading={isLoading} text={loadingText} opacity={opacity}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", maxHeight: "320px", overflow: "auto", minHeight: "265px", height:"1px"  }}>
        
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
                    checkPerm(permissions, "createRegistry") ? 

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
            <div title="Create Registry" className="circle button success" style={{ marginLeft: "10px" }} onClick={() => {
                setLoadingText("Creating Registry")
                setIsLoading(true)
                createRegistry().finally(() => { setIsLoading(false) })
                }}>
                <span style={{ flex: "auto" }}>
                    <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                </span>
            </div>
        </div>
    </td>
</tr>: ""}

</>
           
                        {registries.map((obj) => {
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
                                                    setLoadingText("Deleting Registry")
                                                    setIsLoading(true)
                                                    deleteRegistry(obj.name).finally(() => { setIsLoading(false) })
                                                }} />
                                            </div>: ""}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
  
                    </tbody>
                </table>
            </div>
        </LoadingWrapper >
    )
}

function Configuration() {

    const { fetch, namespace, handleError, permissions, checkPerm } = useContext(MainContext)
    const [configuration, setConfiguration] = useState("")
    const [configurationOld, setConfigurationOld] = useState("")
    const configurationInput = useRef(configuration)
    const [err, setErr] = useState("")

    // Loading 
    const [isLoading, setIsLoading] = useState(true)
    const [opacity, setOpacity] = useState(null)
    const [loadingText, ] = useState("Loading Configuration")


    const fetchR = useCallback(() => {
        async function fetchData() {
            try {
                let config = await NamespaceConfiguration(fetch, namespace, handleError)
                let configString = YAML2String.stringify(config)
                setConfiguration(configString)
                setConfigurationOld(configString)
            } catch (e) {
                setErr(e.message)
            }
        }
        return fetchData()
    }, [fetch, namespace, handleError])

    useEffect(() => {
        fetchR().finally(() => { setIsLoading(false); setOpacity(30) })
    }, [fetchR])

    const updateConfig = useCallback(() => {
        async function updateCfg() {
            setErr("")
            try {
                let jsonConfig = YAML.load(configuration)
                let config = await SetNamespaceConfiguration(fetch, namespace, handleError, JSON.stringify(jsonConfig))
                let configString = YAML2String.stringify(config)
                setConfiguration(configString)
                setConfigurationOld(configString)
            } catch (e) {
                setErr(e.message)
            }
        }
        updateCfg().finally(() => {})
    }, [fetch, namespace, handleError, configuration])

    let saveButton = (
        <div className={configurationOld !== configuration ? "editor-footer-button" : "editor-footer-button-disabled"} style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none" }} onClick={() => { updateConfig() }}>
            <span style={{}} >Save</span>
            <IoSave style={{ marginLeft: "5px" }} />
        </div>
    );

    return (
        <LoadingWrapper isLoading={isLoading} text={loadingText} opacity={opacity}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", height: "100%", maxHeight: "740px", overflow: "auto", minHeight: "600px" }}>
                <>
                {err !== "" ? <div style={{ fontSize: "12px", paddingTop: "3px", paddingBottom: "12px", color: "red" }}>
                        {err}
                    </div> : <></>}
                        <div style={{ width: "100%", height: "100%", position: "relative", top: "-28px" }}>
                            <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                <Editor refValSet={configurationInput} setValue={setConfiguration} value={configuration} showFooter={true} saveCallback={()=>{updateConfig()}} readOnly={!checkPerm(permissions, "setNamespaceConfiguration")} actions={checkPerm(permissions, "setNamespaceConfiguration") ? [saveButton] : []}/>
                            </div>
                        </div>
                </>
            </div>
        </LoadingWrapper >
    )
}



