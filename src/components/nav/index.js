import React from 'react'
import Logo from '../../img/direktiv.svg'
import md5 from 'md5'
import { Link } from 'react-router-dom'

import Speedometer from 'react-bootstrap-icons/dist/icons/speedometer'
import LightningFill from 'react-bootstrap-icons/dist/icons/lightning-fill'
import TerminalFill from 'react-bootstrap-icons/dist/icons/terminal-fill'
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill'
import ArrowRightFill from 'react-bootstrap-icons/dist/icons/arrow-right-circle-fill'
import { PlusCircle } from 'react-bootstrap-icons'
import { useContext } from 'react'
import MainContext from '../../context'
import { useEffect, useState } from 'react'
import { useRef } from 'react'

export default function Navbar(props) {

    const textInput = useRef()
    const [namespaces, setNamespaces] = useState([])
    const [acceptInput, setAcceptInput] = useState(false)

    const {fetch, namespace, setNamespace} = useContext(MainContext)

    const {auth, name, email, logout} = props

    let gravatarHash = ""
    let gravatarURL = ""

    if(auth) {
        gravatarHash = md5(email)
        gravatarURL = "https://www.gravatar.com/avatar/" + gravatarHash
    }
    
    async function fetchNamespaces(load) {
        try {
            let resp = await fetch('/namespaces/', {
                method: 'GET',
            })
            if (resp.ok) {
                let json = await resp.json()
                if (load){
                    setNamespace(json.data[0])
                }
                setNamespaces(json.data)
            } else {
                throw(new Error({message: await resp.text()}))
            }
        } catch(e) {
            console.log('TODO handle err potentially running no auth i guess?')
        }
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
                setAcceptInput(!acceptInput)
                toggleNamespaceSelector()
            } else {
                throw(new Error({message: await resp.text()}))
            }
        } catch(e) {
            console.log('TODO handle err potentially running no auth i guess?')
        }
    }
    
    useEffect(()=>{
        fetchNamespaces(true)
    },[])

    function toggleNamespaceSelector() {
        let x = document.getElementById('namespaces-ul');
        x.classList.toggle('active');
    }

    return(
        <div id="nav">
            <div id="nav-img-holder">
                <img src={Logo} />
                {/* <span style={{ display: "block", marginTop: "-20px", marginBottom: "40px", fontSize: "0.75em" }}>
                    direktiv
                </span> */}
            </div>
            <div className="divider" style={{ fontSize: "11pt", lineHeight: "24px" }}>
                <ul id="namespaces-ul" style={{ margin: "0px" }}>
                    <li className="namespace-selector" onClick={() => toggleNamespaceSelector()}>
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
                                                setNamespace(obj)
                                                toggleNamespaceSelector()
                                            }}>{obj}</li>
                                        )
                                    }
                                })}
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
            <div id="nav-ul-holder" className="nav-section divider">
                <ul>
                    <li>
                        <Link to="/" className="nav-link">
                            <div>
                                <Speedometer style={{ marginRight: "10px" }} />
                                <span>Dashboard</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/w/" className="nav-link">
                            <div>
                                <LightningFill style={{ marginRight: "10px" }} />
                                <span>Workflows</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/i/" className="nav-link">
                            <div>
                                <TerminalFill style={{ marginRight: "10px" }} />
                                <span>Events / Logs</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/s/" className="nav-link">
                            <div>
                                <GearFill style={{ marginRight: "10px" }} />
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