import React from 'react'
import Logo from '../../img/direktiv.svg'
import md5 from 'md5'
import { Link } from 'react-router-dom'

import Speedometer from 'react-bootstrap-icons/dist/icons/speedometer'
import LightningFill from 'react-bootstrap-icons/dist/icons/lightning-fill'
import TerminalFill from 'react-bootstrap-icons/dist/icons/terminal-fill'
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill'
import ArrowRightFill from 'react-bootstrap-icons/dist/icons/arrow-right-circle-fill'

export default function Navbar(props) {

    const {auth, name, email, logout} = props

    let gravatarHash = ""
    let gravatarURL = ""

    if(auth) {
        gravatarHash = md5(email)
        gravatarURL = "https://www.gravatar.com/avatar/" + gravatarHash
    }
    

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
                            <span><b>demo-fza6</b></span>
                        </div>
                    </li>
                    <li id="namespace-list" style={{ paddingLeft: "0px" }}>
                        <div style={{ width: "100%" }}>
                            <ul>
                                <li>
                                    namespace-01
                                </li>
                                <li>
                                    namespace-02
                                </li>
                                <li>
                                    namespace-03
                                </li>
                                <li>
                                    namespace-04
                                </li>
                                <li>
                                    namespace-05
                                </li>
                                <li>
                                    namespace-06
                                </li>
                                <li>
                                    namespace-07
                                </li>
                                <li>
                                    namespace-08
                                </li>
                                <li>
                                    namespace-09
                                </li>
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
                        <Link to="/e/" className="nav-link">
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