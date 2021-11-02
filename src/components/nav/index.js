import React, { useEffect } from 'react'
import Logo from '../../img/direktiv.svg'


import { Link, matchPath, useHistory, useLocation } from 'react-router-dom'

import ArrowRightFill from 'react-bootstrap-icons/dist/icons/arrow-right-circle-fill'
import PlusCircle from 'react-bootstrap-icons/dist/icons/plus-circle'
import { useContext } from 'react'
import MainContext from '../../context'
import { useState } from 'react'
import { useRef } from 'react'
import { IoBuildSharp,   IoCubeOutline, IoExtensionPuzzle,  IoGrid, IoSearch, IoSettingsSharp,  IoTerminalSharp } from 'react-icons/io5'
import { GetVersions, NamespaceCreate } from '../../api'

export default function Navbar(props) {

    const textInput = useRef()
    const history = useHistory()
    const location = useLocation()

    const [acceptInput, setAcceptInput] = useState(false)
    const [err, setError] = useState("")

    const {fetch, namespace, setNamespace, namespaces, fetchNamespaces, handleError, checkPerm, permissions} = useContext(MainContext)
    const {footer, navItems} = props
    

    async function createNamespace(val) {
        try {
            let ns = await NamespaceCreate(fetch, handleError, val)

            localStorage.setItem("namespace", ns)
            setNamespace(ns)
            fetchNamespaces(false, ns)
            setAcceptInput(!acceptInput)
            setError("")
            history.push(`/n/${ns}`)
        } catch(e) {
            setError(`Error: ${e.message}`)
        }
    }
    

    let matchFunctions = matchPath(location.pathname, {
        path: "/n/:namespace/functions"
    })
    
    let matchInstanceL = matchPath(location.pathname,  {
        path: "/n/:namespace/i"
    })

    let matchInstanceFull = matchPath(location.pathname, {
        path: "/n/:namespace/i/:id"
    })

    let matchExplorer = matchPath(location.pathname, {
        path: "/n/:namespace/explorer"
    },{
        path: "/n/:namespace/explorer/*"
    },)


    let matchJQ = matchPath(location.pathname, {
        path: "/jq/playground"
    })

    let matchGlobal = matchPath(location.pathname, {
        path: "/functions/global"
    })

    let navItemMap = {}
    if(navItems){
        for(var i=0; i < navItems.length; i++) {
            navItemMap[navItems[i].path] = matchPath(location.pathname, {
                path: navItems[i].path
            })
        }
    }

    let matchSettings = matchPath(location.pathname, {
        path: "/n/:namespace/s"
    })

    let matchDashboard = matchPath(location.pathname, {
        path: "/n/:namespace",
        exact: true
    })

    let matchWorkflowBuilder = matchPath(location.pathname, {
        path: "/n/:namespace/flowy",
        exact: true
    })

    function toggleNamespaceSelector() {
        let x = document.getElementById('namespaces-ul');
        x.classList.toggle('active');
    }

    // purely for login screen purposes
    if (window.location.pathname === "/login") {
        return(
            <div id="nav">  
                <Link to="/">
                    <div id="nav-img-holder">
                        <img src={Logo} alt="main-logo"/>
                    </div>
                </Link>
            </div>
        )
    }

    return(
        <div id="nav">
            <Link to="/">
            <div id="nav-img-holder">
                <img src={Logo} alt="main-logo"/>
            </div>

            </Link>
            <div className="divider" style={{ fontSize: "11pt", lineHeight: "24px" }}>
                <ul id={"namespaces-ul"} style={{ margin: "0px" }}>
                    <li className="namespace-selector" onClick={() => {
                        toggleNamespaceSelector()
                    }}>
                        <div>
                            <ArrowRightFill id="namespace-arrow" style={{ marginRight: "10px", height: "18px" }} />
                            {namespace !== "" ? 
                                <span className="truncate" style={{ maxWidth: "120px" }}>
                                    <b>{namespace}</b>
                                </span>
                                :
                                <span className="truncate" style={{maxWidth:"120px"}}>
                                    <b>Namespaces</b>
                                </span>
                            }
                        </div>
                    </li>
                    <li id="namespace-list" style={{ paddingLeft: "0px", paddingTop: "0px", flexDirection: "column" }}>
                        <div style={{ width: "100%" }} >
                            <ul>
                                <>
                                {checkPerm(permissions, "admin") ? 
                                <li>
                                    <div style={{display:"flex", flexDirection:"column", flexFlow:"wrap"}}>
                                    
                                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", paddingTop:"5px" }}>
                                        <PlusCircle style={{ fontSize: "12pt", marginRight: "10px" }} />
                                        {acceptInput ? 
                                            <input className="namespace-create"  onKeyPress={(e)=>{
                                                if(e.code === "NumpadEnter" || e.code === "Enter") {
                                                    // create namespace
                                                    createNamespace(e.target.value)
                                                } 
                                            }} placeholder="Enter namespace" type="text" ref={textInput} style={{width:"110px", color:"white", height:"25px", background:"transparent", border:"none"}}/>
                                            :
                                            <span onClick={()=>{
                                                setAcceptInput(!acceptInput)
                                                setTimeout(()=>{
                                                    textInput.current.focus()
                                                },100)
                                            }}>
                                                New namespace
                                            </span>
                                        }
                                        <>
            
                                        </>
                                    </div>
                                    {err !== "" ? <div style={{ fontSize: "12px", paddingTop: "5px", paddingBottom: "5px", color: "red" }}>
                                        {err}
                                        </div>:""}
                                    </div>
                                </li>:""}
                                {namespaces === null || namespaces === undefined  ? "":
                                <>
                                    {namespaces.map((obj, j)=>{
                                        if(obj !== namespace){
                                            return(
                                                <li key={j} onClick={()=>{
                                                    localStorage.setItem("namespace", obj)
                                                    setNamespace(obj)
                                                    toggleNamespaceSelector()
                                                
                                                    let matchWf = matchPath(location.pathname, {
                                                        path: `/n/${namespace}/w/:workflow`
                                                    })

                                                    let matchNWF = matchPath(location.pathname, {
                                                        path: `/n/${namespace}/w`
                                                    })

                                                    if(matchWf !== null || matchNWF !== null) {
                                                        history.push(`/n/${obj}/w`)
                                                        return
                                                    }

                                                    let matchInstance = matchPath(location.pathname, {
                                                        path: "/n/:namespace/i/:id"
                                                    })
                                                    
                                                    let matchInstanceN = matchPath(location.pathname, {
                                                        path: `/n/${namespace}/i`
                                                    })

                                                    if(matchInstance !== null || matchInstanceN !== null) {
                                                        history.push(`/n/${obj}/i`)
                                                        return
                                                    }


                                                    history.push(`/n/${obj}`)
                                                }}>{obj}</li>
                                            )
                                        }
                                        return ""
                                    })}
                                </>
}
                                </>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
            <div id="nav-ul-holder" className="nav-section divider">
                <ul>
                    <li>
                        {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                                <IoGrid style={{ marginRight: "10px" }} />
                                <span>Dashboard</span>
                            </div>
                            :
                        <Link onClick={()=>{
                            if (document.getElementById("namespaces-ul").classList.contains("active")){
                                toggleNamespaceSelector()
                            }
                        }} to={`/n/${namespace}`} className="nav-link" style={{color: matchDashboard !== null ? "#4497f5": ""}}>
                            <div>
                                <IoGrid style={{ marginRight: "10px" }} />
                                <span>Dashboard</span>
                            </div>
                        </Link>
}
                    </li>
                    <li>  
                        {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                                <IoSearch style={{ marginRight: "10px" }} />
                                <span>Explorer</span>
                            </div>
                            :
                            <Link onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/n/${namespace}/explorer`} style={{color: matchExplorer !== null ? "#4497f5": ""}} className="nav-link">
                                <div>
                                    <IoSearch style={{ marginRight: "10px" }} />
                                    <span>Explorer</span>
                                </div>
                            </Link>
                        }
                    </li>
                    <li>
                        {namespace === "" ? 
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                            <IoBuildSharp style={{ marginRight: "10px" }} />
                            <span>Workflow Builder</span>
                            </div>
                            :
                            <Link onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/n/${namespace}/flowy`} style={{color: matchWorkflowBuilder !== null ? "#4497f5": ""}} className="nav-link">
                                <div>
                                    <IoBuildSharp style={{ marginRight: "10px" }} />
                                    <span>Workflow Builder</span>
                                </div>
                            </Link>
                        }
                    </li>
                    <li>
                    {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                                                               <IoTerminalSharp style={{ marginRight: "10px" }} />

                                <span>Instances</span>
                            </div>
                            :
                        <Link style={{color: matchInstanceL !== null || matchInstanceFull !== null ? "#4497f5": ""}} onClick={()=>{
                            if (document.getElementById("namespaces-ul").classList.contains("active")){
                                toggleNamespaceSelector()
                            }
                        }} to={`/n/${namespace}/i`} className="nav-link">
                            <div>
                                <IoTerminalSharp style={{ marginRight: "10px" }} />
                                <span>Instances</span>
                            </div>
                        </Link>}
                    </li>
                    <li>
                        <Link style={{color: matchJQ !== null ? "#4497f5": ""}} onClick={()=>{
                            if (document.getElementById("namespaces-ul").classList.contains("active")){
                                toggleNamespaceSelector()
                            }
                        }} to="/jq/playground" className="nav-link">
                            <div>
                                <IoExtensionPuzzle style={{ marginRight: "10px" }} />
                                <span>jq Playground</span>
                            </div>
                        </Link>
                    </li>
                    {
                        navItems ? 
                        <>
                        {navItems.map((obj)=> {
                
                if (obj.hreflink) {
                    return(   <> {obj.nsRequired ?    <>  {namespace !== "" ? <li key={obj.title}>
                    <a style={{color: navItemMap[obj.path] !== null ? "#4497f5": ""}} onClick={()=>{
                        if (document.getElementById("namespaces-ul").classList.contains("active")){
                            toggleNamespaceSelector()
                        }
                    }} href={obj.path} className="nav-link">
                        <div>
                            {obj.icon}
                            <span>{obj.title}</span>
                        </div>
                    </a>
                </li>: <li key={obj.title}><div style={{color:"#b5b5b5", cursor: "default"}}>
                            {obj.icon}
                            <span>{obj.title}</span>
                        </div></li>}</> : "" }</>
            )
                } else {
                    return(   <> {obj.nsRequired ?    <>  {namespace !== "" ? <li key={obj.title}>
                    <Link style={{color: navItemMap[obj.path] !== null ? "#4497f5": ""}} onClick={()=>{
                        if (document.getElementById("namespaces-ul").classList.contains("active")){
                            toggleNamespaceSelector()
                        }
                    }} to={obj.path} className="nav-link">
                        <div>
                            {obj.icon}
                            <span>{obj.title}</span>
                        </div>
                    </Link>
                </li>: <li key={obj.title}><div style={{color:"#b5b5b5", cursor: "default"}}>
                            {obj.icon}
                            <span>{obj.title}</span>
                        </div></li>}</> : "" }</>
            )
                }
 
                })}
                        
                        </> : ''
                    }
                    <li>
                        {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor:"default"}}>
                                <IoCubeOutline style={{marginRight:"10px"}}/>
                                <span>Services</span>
                            </div>
                            :
                            <Link style={{color: matchFunctions !== null ? "#4497f5": ""}} onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/n/${namespace}/functions`} className="nav-link">
                                <div>
                                <IoCubeOutline style={{marginRight:"10px"}}/>
                                <span>Services</span>
                                </div>
                            </Link>
                        }
                    </li>
                    <li>
                    {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                                <IoSettingsSharp style={{ marginRight: "10px" }} />
                                <span>Settings</span>
                            </div>
                            :
                        <Link style={{color: matchSettings !== null ? "#4497f5": ""}} onClick={()=>{
                            if (document.getElementById("namespaces-ul").classList.contains("active")){
                                toggleNamespaceSelector()
                            }
                        }} to={`/n/${namespace}/s`} className="nav-link">
                            <div>
                                <IoSettingsSharp style={{ marginRight: "10px" }} />
                                <span>Settings</span>
                            </div>
                        </Link>
}
                    </li>         
        
                </ul>
                {checkPerm(permissions, "admin") ?    <div className="nav-section divider"> 
                    <ul>
                        <li>
                        <Link style={{color: matchGlobal !== null ? "#4497f5": "", display:"flex", alignItems:"center"}} onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/functions/global`} className="nav-link">
                                <IoCubeOutline style={{marginRight:"10px"}}/>
                                <span>Global Services</span>
                            </Link>
                        </li>
                    </ul>
                </div>    :""}  
            </div>
            {footer ? footer : "" }
            {process.env.REACT_APP_VERSION ? <Version handleError={handleError} fetch={fetch} /> : ""}
        </div>
    )
}

export function Version(props) {
    const {fetch, handleError} = props
    const [versions, setVersions] = useState(null)

    useEffect(()=>{
        async function get() {
            try {
                let results = await GetVersions(fetch, handleError)
                setVersions(JSON.stringify(results, null, 2))
            } catch(e) {
                console.log(e)
            }
        }   
        if(versions === null) {
            get()
        }
    },[fetch, handleError, versions])

    return(
        <p title={versions} style={{fontSize:"10pt", cursor: "pointer"}}>{process.env.REACT_APP_VERSION}</p>
    )
}