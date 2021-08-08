import React from 'react'
import Logo from '../../img/direktiv.svg'


import { Link, matchPath, useHistory, useLocation } from 'react-router-dom'

import ArrowRightFill from 'react-bootstrap-icons/dist/icons/arrow-right-circle-fill'
import PlusCircle from 'react-bootstrap-icons/dist/icons/plus-circle'
import { useContext } from 'react'
import MainContext from '../../context'
import { useState } from 'react'
import { useRef } from 'react'
import { IoCodeWorkingSharp, IoExtensionPuzzle,  IoGrid, IoSettingsSharp, IoShapesSharp, IoTerminalSharp } from 'react-icons/io5'

export default function Navbar(props) {

    const textInput = useRef()
    const history = useHistory()
    const location = useLocation()

    function toggleNamespaceSelector() {
        let x = document.getElementById('namespaces-ul');
        x.classList.toggle('active');
    }

    const [acceptInput, setAcceptInput] = useState(false)
    const [err, setError] = useState("")

    const {fetch, namespace, setNamespace, namespaces, fetchNamespaces, handleError, checkPerm, permissions} = useContext(MainContext)
    const {footer, navItems} = props
    

    async function createNamespace(val) {
        try {
            let resp = await fetch(`/namespaces/${val}`, {
                method: 'POST'
            })
            if (resp.ok) {
                await resp.json()
                

                let matchWf = matchPath(location.pathname, {
                    path: `/${namespace}/w/:workflow`
                })

                let matchNWF = matchPath(location.pathname, {
                    path: `/${namespace}/w`
                })

                if(matchWf !== null || matchNWF !== null) {
                           // setNamespace(val)
                    localStorage.setItem("namespace", val)
                    setAcceptInput(!acceptInput)
                    toggleNamespaceSelector()
                    setNamespace(val)
                    // sendNotification("Success!", `Namespace '${val}' has been created.`, 0)
                    fetchNamespaces(false, val)
                    setError("")
                    history.push(`/${val}/w`)
                    return
                }

                let matchInstance = matchPath(location.pathname, {
                    path: "/i/:namespace/:workflow/:instance"
                })

                let matchInstanceN = matchPath(location.pathname, {
                    path: `/${namespace}/i`
                })

                if(matchInstance !== null || matchInstanceN !== null) {
                    // setNamespace(val)
                    localStorage.setItem("namespace", val)
                    setAcceptInput(!acceptInput)
                    toggleNamespaceSelector()
                    setNamespace(val)
                    // sendNotification("Success!", `Namespace '${val}' has been created.`, 0)
                    fetchNamespaces(false, val)
                    setError("")

                    history.push(`/${val}/i`)
                    return
                }

                // setNamespace(val)
                localStorage.setItem("namespace", val)
                setAcceptInput(!acceptInput)
                toggleNamespaceSelector()
                setNamespace(val)
                // sendNotification("Success!", `Namespace '${val}' has been created.`, 0)
                fetchNamespaces(false, val)
                setError("")

                history.push(`/${val}`)

            } else {
                await handleError('create namespace', resp, 'addNamespace')
            }
        } catch(e) {
            setError(`Failed to create namespace: ${e.message}`)
        }
    }
    

    let matchFunctions = matchPath(location.pathname, {
        path: "/:namespace/functions"
    })
    
    let matchInstanceL = matchPath(location.pathname,  {
        path: "/:namespace/i"
    })

    let matchInstanceFull = matchPath(location.pathname, {
        path: "/i/:namespace/:workflow/:instance"
    })

    let matchWorkflow = matchPath(location.pathname, {
        path: "/:namespace/w"
    }, {
        path: "/:namespace/w/:workflow"
    })

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
        path: "/:namespace/s"
    })

    let matchDashboard = matchPath(location.pathname, {
        path: "/:namespace",
        exact: true
    })


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
                                {checkPerm(permissions, "addNamespace") ? 
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
                                                        path: `/${namespace}/w/:workflow`
                                                    })

                                                    let matchNWF = matchPath(location.pathname, {
                                                        path: `/${namespace}/w`
                                                    })

                                                    if(matchWf !== null || matchNWF !== null) {
                                                        history.push(`/${obj}/w`)
                                                        return
                                                    }

                                                    let matchInstance = matchPath(location.pathname, {
                                                        path: "/i/:namespace/:workflow/:instance"
                                                    })
                                                    
                                                    let matchInstanceN = matchPath(location.pathname, {
                                                        path: `/${namespace}/i`
                                                    })

                                                    if(matchInstance !== null || matchInstanceN !== null) {
                                                        history.push(`/${obj}/i`)
                                                        return
                                                    }


                                                    history.push(`/${obj}`)
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
                        }} to={`/${namespace}`} className="nav-link" style={{color: matchDashboard !== null ? "#4497f5": ""}}>
                            <div>
                                <IoGrid style={{ marginRight: "10px" }} />
                                <span>Dashboard</span>
                            </div>
                        </Link>
}
                    </li>
                    <li>  {namespace === "" ?
                            <div style={{color:"#b5b5b5", cursor: "default"}}>
                                                              <IoShapesSharp style={{ marginRight: "10px" }} />

                                <span>Workflows</span>
                            </div>
                            :
                        <Link onClick={()=>{
                            if (document.getElementById("namespaces-ul").classList.contains("active")){
                                toggleNamespaceSelector()
                            }
                        }} to={`/${namespace}/w`} style={{color: matchWorkflow !== null ? "#4497f5": ""}} className="nav-link">
                            <div>
                                <IoShapesSharp style={{ marginRight: "10px" }} />
                                <span>Workflows</span>
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
                        }} to={`/${namespace}/i`} className="nav-link">
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
                                <IoCodeWorkingSharp style={{marginRight:"10px"}}/>
                                <span>Functions</span>
                            </div>
                            :
                            <Link style={{color: matchFunctions !== null ? "#4497f5": ""}} onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/${namespace}/functions`} className="nav-link">
                                <div>
                                <IoCodeWorkingSharp style={{marginRight:"10px"}}/>
                                <span>Functions</span>
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
                        }} to={`/${namespace}/s`} className="nav-link">
                            <div>
                                <IoSettingsSharp style={{ marginRight: "10px" }} />
                                <span>Settings</span>
                            </div>
                        </Link>
}
                    </li>         
        
                </ul>
                <div className="nav-section divider"> 
                    <ul>
                        <li>
                        <Link style={{color: matchGlobal !== null ? "#4497f5": "", display:"flex", alignItems:"center"}} onClick={()=>{
                                if (document.getElementById("namespaces-ul").classList.contains("active")){
                                    toggleNamespaceSelector()
                                }
                            }} to={`/functions/global`} className="nav-link">
                                <IoSettingsSharp style={{marginRight:"10px"}}/>
                                <span>Global Settings</span>
                            </Link>
                        </li>
                    </ul>
                </div>      
            </div>
            {footer ? footer : "" }
        </div>
    )
}