import React from 'react'
import Logo from '../../img/direktiv.svg'

import Speedometer from 'react-bootstrap-icons/dist/icons/speedometer'
import LightningFill from 'react-bootstrap-icons/dist/icons/lightning-fill'
import TerminalFill from 'react-bootstrap-icons/dist/icons/terminal-fill'
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill'

export default function Navbar() {
    return(
        <div id="nav">
            <div id="nav-img-holder">
                <img src={Logo} />
                {/* <span style={{ display: "block", marginTop: "-20px", marginBottom: "40px", fontSize: "0.75em" }}>
                    direktiv
                </span> */}
            </div>
            <div>
                
            </div>
            <div id="nav-ul-holder" className="nav-section divider">
                <ul>
                    <li>
                        <div>
                            <Speedometer style={{ marginRight: "10px" }} />
                            <span>Dashboard</span>
                        </div>
                    </li>
                    <li>
                        <div>
                            <LightningFill style={{ marginRight: "10px" }} />
                            <span>Workflows</span>
                        </div>
                    </li>
                    <li>
                        <div>
                            <TerminalFill style={{ marginRight: "10px" }} />
                            <span>Events / Logs</span>
                        </div>
                    </li>
                    <li>
                        <div>
                            <GearFill style={{ marginRight: "10px" }} />
                            <span>Settings</span>
                        </div>
                    </li>
                </ul>
            </div>
            <div id="nav-user-holder" style={{ paddingBottom: "40px" }}>
                <img alt="user" style={{border: "solid 3px #0083B0", borderRadius: "50%", maxWidth: "48px"}} src="https://www.gravatar.com/avatar/47c1678268b1822f83dd6a11cb24765c" />
                <span style={{ fontSize: "10pt", display: "block" }}>
                    GhoulJim
                </span>
            </div>
        </div>
    )
}