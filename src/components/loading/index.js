import React, { useState, useEffect } from 'react'

import "./loading.css";

// Default wind up time is 250(ms). This means the loader component wont appear until 250ms after its been mounted.
//  Can be overwritten with the windUpTime prop
const DEFAULT_WINDUP_TIME = 250;


export function LoadingPage(props) {
    const { waitGroup, waitCount, text, isLoading, windUpTime } = props
    const [ready, setReady] = useState(false) // State to track if loader is ready to be displayed

    // Wind up timeout
    useEffect(
        () => {
            let loadingTimer = setTimeout(() => {
                setReady(true); // loader is ready
            }, windUpTime ? windUpTime : DEFAULT_WINDUP_TIME);
            return () => {
                clearTimeout(loadingTimer);
            };
        }, [windUpTime]);


    return (
        <>
            {(ready && ((isLoading === undefined && ((!waitGroup || !waitCount) || (waitCount < waitGroup))) || (isLoading !== null && isLoading === true))) ?
                <div className={"loading-container"}>
                    <div className={"loading"}>
                        <div className={"loading-inner"}>
                            <div className="case__loading">
                                <div className="big__circle">
                                    <div className="inner__circle"></div>
                                    <div className="page-loader">
                                        <svg className="circular" viewBox="25 25 50 50">
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#50caf2" />
                                                    <stop offset="50%" stopColor="#4dafeb" /> <stop offset="100%" stopColor="#50caf2" />
                                                </linearGradient>
                                            </defs>
                                            <circle className="path" cx="50" cy="50" r="20" fill="none" strokeWidth="2" strokeMiterlimit="10" stroke="url(#gradient)" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div style={{ paddingTop: "16px" }}>{text ? text : "Loading"}</div>
                        </div>
                    </div>
                </div>
                :
                <></>
            }
        </>
    )

}


export default function LoadingWrapper(props) {
    const { waitGroup, waitCount, isLoading, text, opacity, windUpTime } = props
    const [ready, setReady] = useState(false) // State to track if loader is ready to be displayed


    // Wind up timeout
    useEffect(
        () => {
            let loadingTimer = setTimeout(() => {
                setReady(true); // loader is ready
            }, windUpTime ? windUpTime : DEFAULT_WINDUP_TIME);
            return () => {
                clearTimeout(loadingTimer);
            };
        }, [windUpTime]);

    return (
        <>
            {(ready && ((isLoading === undefined && ((!waitGroup || !waitCount) || (waitCount < waitGroup))) || (isLoading !== null && isLoading === true))) ?
                <div className={"loading-wrapper"}>
                    <div style={{ opacity: opacity ? `${opacity}%` : "0%" }}>
                        {props.children}
                    </div>
                    <div className={"loading-overlay"}>
                        <div className="case__loading">
                            <div className="big__circle">
                                <div className="inner__circle"></div>
                                <div className="page-loader">
                                    <svg className="circular" viewBox="25 25 50 50">
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#50caf2" />
                                                <stop offset="50%" stopColor="#4dafeb" /> <stop offset="100%" stopColor="#50caf2" />
                                            </linearGradient>
                                        </defs>
                                        <circle className="path" cx="50" cy="50" r="20" fill="none" strokeWidth="2" strokeMiterlimit="10" stroke="url(#gradient)" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div style={{ paddingTop: "16px" }}>{text ? text : "Loading"}</div>
                    </div>
                </div>
                :
                <>{props.children}</>
            }
        </>
    )

}

