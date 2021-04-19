import React, { useCallback, useContext, useEffect, useState } from 'react'
import Breadcrumbs from '../breadcrumbs'
import TileTitle from '../tile-title'
import MainContext from '../../context'
import ShieldLockFill from 'react-bootstrap-icons/dist/icons/shield-lock-fill'
import CloudDownloadFill from 'react-bootstrap-icons/dist/icons/cloud-download-fill'
import { PlusCircle, PlusCircleFill, XCircle, XCircleFill } from 'react-bootstrap-icons'
import { useHistory } from 'react-router'
import { IoLockOpen, IoLogoDocker } from 'react-icons/io5'
import { sendNotification } from '../notifications'


function SettingsAction(props) {
    const {namespace, fetch, namespaces, fetchNamespaces, setNamespace} = useContext(MainContext)
    const history = useHistory()
    const [show, setShow] = useState(false)
    console.log(namespaces)

    async function deleteNamespace() {
        try {
            let resp = await fetch(`/namespaces/${namespace}`, {
                method: "DELETE"
            })
            if (resp.ok) {
                for(let i=0; i < namespaces.length; i++) {
                    if(namespaces[i] !== namespace) {
                        console.log(namespaces[i], "ns-reload")
                        localStorage.setItem("namespace", namespaces[i])
                        setNamespace(namespaces[i])
                        history.push("/s/reload")

                        await fetchNamespaces()
                        break                      
                    }
                }
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            console.log(e, 'err deleting namespace')
        }
    }


    return(
        <div id="workflow-actions" className="shadow-soft rounded tile fit-content" style={{ fontSize: "11pt", padding: "0" }}>
            <div class="dropdown">
                <button onClick={(e)=>{
                    // e.stopPropagation()
                    setShow(!show)
                    }} class="dropbtn">Actions</button>

                {
                    show ? <>
                        <div class="dropdown-content-connector"></div>
                        <div class="dropdown-content">
                            <a onClick={()=>{deleteNamespace()}}>Delete Namespace</a>
                        </div>
                    </>
                :
                (<></>)
                }
            </div> 
        </div>
    )
}

export default function SettingsPage() {
    return (
        <>
        <div className="container" style={{ flex: "auto", padding: "10px" }}>
            <div className="flex-row">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Namespace Settings"]} />
                </div>
                <SettingsAction />
            </div>
            <div className="container" style={{ flex: "auto", flexDirection: "row", flexWrap: "wrap" }}>
                <div className="item-0 shadow-soft rounded tile" style={{ flex: "auto", minWidth: "400px" }}>
                    <TileTitle name="Secrets">
                        <IoLockOpen />
                    </TileTitle>
                    <Secrets />
                </div>
                <div className="item-0 shadow-soft rounded tile" style={{ flex: "auto", minWidth: "400px" }}>
                    <TileTitle name="Container Registries">
                        <IoLogoDocker />
                    </TileTitle>
                    <Registries />
                </div>
            </div>
        </div>
        </>
    )
}

function Secrets() {

    const {fetch, namespace} = useContext(MainContext)
    const [secrets, setSecrets] = useState([])
    const [key, setKey] = useState("")
    const [value, setValue] = useState("")

    const fetchS = useCallback(()=>{
        async function fetchData(){
            try {
                let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    setSecrets(json.secrets)
                } else {
                    throw new Error(await resp.text())
                }
            } catch(e) {
                sendNotification(`Failed to fetch secrets: ${e.message}`, 0)
            }
        }
        fetchData()
    },[])

    useEffect(()=>{
     fetchS()
    },[])

    async function createSecret() {
        try{
            let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                method:"POST",
                body: JSON.stringify({name:key, data: value})
            })
            if (resp.ok) {
                setKey("")
                setValue("")
                fetchS()
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification(`Failed to create secret: ${e.message}`, 0)
        }
    }

    async function deleteSecret(val) {
        try {
            let resp = await fetch(`/namespaces/${namespace}/secrets/`, {
                method: "DELETE",
                body: JSON.stringify({name: val})
            })
            if (resp.ok) {
                // refetch secrets
                fetchS()
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification(`Failed to delete secret: ${e.message}`, 0)
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
                        <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                            <thead>
                                <tr className="no-neumorph">
                                    <th style={{ }}>
                                        Key
                                    </th>
                                    <th style={{  }}>
                                        Value
                                    </th>
                                    <th style={{ width: "50px" }}>
                                        
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {secrets.map((obj)=>{
                                    return(
                                        <tr>
                            <td style={{ paddingLeft: "10px" }}>
                                <input style={{ maxWidth: "150px" }} type="text" disabled value={obj.name} />
                            </td>
                            <td   style={{ paddingRight: "10px" }} colspan="2">
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <input style={{ maxWidth: "150px" }} type="password" disabled value=".........." />
                                    <div className="circle button danger" style={{ marginLeft: "10px" }} onClick={()=>deleteSecret(obj.name)}>
                                        <span style={{ flex: "auto" }}>
                                            <XCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                        </span>
                                    </div>    
                                </div>
                            </td>
                        </tr>
                        )
                    })}
                    <tr>
                        <td style={{ paddingLeft: "10px" }}>
                            <input style={{ maxWidth: "150px" }} type="text" placeholder="Enter Key.." value={key} onChange={(e)=>setKey(e.target.value)}/>
                        </td>
                        <td style={{ paddingRight: "10px" }} colspan="2">
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <input style={{ maxWidth: "150px" }} type="password" placeholder="Enter Value.." value={value} onChange={(e)=>setValue(e.target.value)}/>
                                <div className="circle button success" style={{ marginLeft: "10px" }} onClick={()=>createSecret()}>
                                    <span style={{ flex: "auto" }}>
                                        <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                    </span>
                                </div>    
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

function Registries() {

    const {fetch, namespace} = useContext(MainContext)
    const [name, setName] = useState("")
    const [user, setUser] = useState("")
    const [token, setToken] = useState("")
    const [registries, setRegistries] = useState([])

    const fetchR = useCallback(()=>{
        async function fetchData(){
            try {
                let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                    method: "GET",
                })
                if (resp.ok) {
                    let json = await resp.json()
                    setRegistries(json.registries)
                } else {
                    throw new Error(await resp. text())
                }
            } catch(e) {
                sendNotification(`Failed to fetch registries: ${e.message}`, 0)
            }
        }
        fetchData()
    },[])

    useEffect(()=>{
        fetchR()
    },[])

    async function createRegistry() {
        try {
            let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                method: "POST",
                body: JSON.stringify({"name": name, "data": `${user}!${token}`})
            })
            if (resp.ok) {
                setName("")
                setToken("")
                setUser("")
                fetchR()
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification(`Failed to create registry: ${e.message}`,0)
        }
    }

    async function deleteRegistry(val) {
        try {
            let resp = await fetch(`/namespaces/${namespace}/registries/`, {
                method: "DELETE",
                body: JSON.stringify({name:val})
            })
            if (resp.ok) {
                // fetch registries
                fetchR()
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            console.log('delete registry', e)
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
            <table style={{ fontSize: "11pt", lineHeight: "48px" }}>
                <thead>
                    <tr className="no-neumorph">
                        <th style={{ }}>
                            URL
                        </th>
                        <th style={{  }}>
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
                            {registries.map((obj)=>{
                                return(
                                    <tr>
                                    <td style={{ paddingLeft: "10px" }}>
                                        <input style={{ maxWidth: "150px" }} type="text" disabled value={obj.name} />
                                    </td>
                                    <td>
                                        <input style={{ maxWidth: "150px" }} type="text" disabled value={"*******"} />
                                    </td>
                                    <td  style={{ paddingRight: "10px" }} colspan="2">
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <input style={{ maxWidth: "150px" }} type="password" disabled value="*******" />
                                            <div id={"reg-"+obj.name} onClick={()=>deleteRegistry(obj.name)} title="Remove Registry" className="circle button danger" style={{ marginLeft: "10px" }}>
                                                <span style={{ flex: "auto" }}>
                                                    <XCircle style={{ fontSize: "12pt", marginBottom: "6px" }} />
                                                </span>
                                            </div>    
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                             <tr>
                                <td style={{ paddingLeft: "10px" }}>
                                    <input style={{ maxWidth: "150px" }} type="text" onChange={(e)=>setName(e.target.value)} value={name} placeholder="Enter URL" />
                                </td>
                                <td>
                                    <input style={{ maxWidth: "150px" }} type="text" value={user} onChange={(e)=>setUser(e.target.value)} placeholder="Enter User" />
                                </td>
                                <td  style={{ paddingRight: "10px" }} colspan="2">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <input style={{ maxWidth: "150px" }} type="password" value={token} placeholder="Enter Token" onChange={(e)=>setToken(e.target.value)}/>
                                        <div title="Create Registry" className="circle button success" style={{ marginLeft: "10px" }} onClick={()=>createRegistry()}>
                                            <span style={{ flex: "auto" }}>
                                                <PlusCircle style={{ fontSize: "12pt", marginBottom: "6px" }}/>
                                            </span>
                                        </div>    
                                    </div>
                                </td>
                            </tr>
                </tbody>
            </table>
        </div>
    )
}


