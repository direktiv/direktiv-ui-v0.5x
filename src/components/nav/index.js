import React from 'react'
import Logo from '../../img/direktiv.svg'
import md5 from 'md5'
import { Link, matchPath, useHistory, useLocation } from 'react-router-dom'

import ArrowRightFill from 'react-bootstrap-icons/dist/icons/arrow-right-circle-fill'
import { PlusCircle } from 'react-bootstrap-icons'
import { useContext } from 'react'
import MainContext from '../../context'
import { useState } from 'react'
import { useRef } from 'react'
import { IoExtensionPuzzle,  IoGrid, IoSettingsSharp, IoShapesSharp, IoTerminalSharp } from 'react-icons/io5'
import { sendNotification } from '../notifications'

export default function Navbar(props) {

    const textInput = useRef()
    const history = useHistory()
    const location = useLocation()

    function toggleNamespaceSelector() {
        let x = document.getElementById('namespaces-ul');
        x.classList.toggle('active');
    }

    // const [namespaces, setNamespaces] = useState([])
    const [acceptInput, setAcceptInput] = useState(false)

    const {fetch, namespace, setNamespace, namespaces, fetchNamespaces} = useContext(MainContext)

    const {auth, name, email, logout} = props

    let gravatarHash = ""
    let gravatarURL = ""

    if(auth) {
        gravatarHash = md5(email)
        gravatarURL = "https://www.gravatar.com/avatar/" + gravatarHash
    }
    

    async function createNamespace(val) {
        try {
            let resp = await fetch(`/namespaces/${val}`, {
                method: 'POST'
            })
            if (resp.ok) {
                await resp.json()
                fetchNamespaces()
                setNamespace(val)
                localStorage.setItem("namespace", val)
                setAcceptInput(!acceptInput)
                toggleNamespaceSelector()
                let matchWf = matchPath(location.pathname, {
                    path: `/${namespace}/w/:workflow`
                })

                let matchNWF = matchPath(location.pathname, {
                    path: `/${namespace}/w`
                })

                if(matchWf !== null || matchNWF !== null) {
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
                    history.push(`/${val}/i`)
                    return
                }


                history.push(`/${val}`)
            } else {
                throw new Error(await resp.text())
            }
        } catch(e) {
            sendNotification("Failed to create namespace", e.message, 0)
        }
    }
    



    return(
        <div id="nav">
            <div id="nav-img-holder">
                <img src={Logo} alt="main-logo"/>
                {/* <span style={{ display: "block", marginTop: "-20px", marginBottom: "40px", fontSize: "0.75em" }}>
                    direktiv
                </span> */}
            </div>
            <div className="divider" style={{ fontSize: "11pt", lineHeight: "24px" }}>
                <ul id="namespaces-ul" style={{ margin: "0px" }}>
                    <li className="namespace-selector" onClick={() => {
                        toggleNamespaceSelector()
                    }}>
                        <div>
                            <ArrowRightFill id="namespace-arrow" style={{ marginRight: "10px", height: "18px" }} />
                            <span className="truncate" style={{ maxWidth: "120px" }}><b>{namespace}</b></span>
                        </div>
                    </li>
                    <li id="namespace-list" style={{ paddingLeft: "0px", paddingTop: "0px", flexDirection: "column" }}>
                        <div style={{ width: "100%" }} >
                            <ul>
                                <li>
                                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", paddingTop:"5px" }}>
                                        <PlusCircle style={{ fontSize: "12pt", marginRight: "10px" }} />
                                        {acceptInput ? 
                                            <input  onKeyPress={(e)=>{
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
                                    </div>
                                </li>
                                {namespaces.map((obj)=>{
                                    if(obj !== namespace){
                                        return(
                                            <li onClick={()=>{
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
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
            <div id="nav-ul-holder" className="nav-section divider">
                <ul>
                    <li>
                        <Link to={`/${namespace}`} className="nav-link">
                            <div>
                                <IoGrid style={{ marginRight: "10px" }} />
                                <span>Dashboard</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to={`/${namespace}/w/`} className="nav-link">
                            <div>
                                <IoShapesSharp style={{ marginRight: "10px" }} />
                                <span>Workflows</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to={`/${namespace}/i/`} className="nav-link">
                            <div>
                                <IoTerminalSharp style={{ marginRight: "10px" }} />
                                <span>Instances</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/jq/" className="nav-link">
                            <div>
                                <IoExtensionPuzzle style={{ marginRight: "10px" }} />
                                <span>jq Playground</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to={`/${namespace}/s/`} className="nav-link">
                            <div>
                                <IoSettingsSharp style={{ marginRight: "10px" }} />
                                <span>Settings</span>
                            </div>
                        </Link>
                    </li>
                </ul>
            </div>
            {auth ?
        <div onClick={()=>logout()} id="nav-user-holder" style={{ paddingBottom: "40px" }}>
            <img alt="user" style={{border: "solid 3px #0083B0", borderRadius: "50%", maxWidth: "48px"}} src={gravatarURL} />
            <span style={{ fontSize: "10pt", display: "block" }}>
                {name}
            </span>
        </div>
            :   
                            ""
            }

        </div>
    )
}