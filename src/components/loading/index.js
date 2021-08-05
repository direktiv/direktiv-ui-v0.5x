import React, { useCallback, useContext, useEffect, useState } from 'react'
import "./loading.css";


export function LoadingPage(props) {
    const { waitGroup, waitCount, text, mode } = props

    console.log("waitGroup = ", waitGroup)
    console.log("waitCount = ", waitCount)


    return (
        <>
            {((!waitGroup || !waitCount) || (waitCount < waitGroup)) ?
                <div class={"loading-container"}>
                    <div class={"loading"}>
                        <div class={"loading-inner"}>
                            <div class="case__loading">
                                <div class="big__circle">
                                    <div class="inner__circle"></div>
                                    <div class="page-loader">
                                        <svg class="circular" viewBox="25 25 50 50">
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stop-color="#50caf2" />
                                                    <stop offset="50%" stop-color="#4dafeb" /> <stop offset="100%" stop-color="#50caf2" />
                                                </linearGradient>
                                            </defs>
                                            <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" stroke="url(#gradient)" />
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
    const { waitGroup, waitCount, text, opacity } = props

    return (
        <>
            {((!waitGroup || !waitCount) || (waitCount < waitGroup)) ?
                <div class={"loading-wrapper"}>
                    <div style={{ opacity: opacity ? `${opacity}%` : "0%" }}>
                        {props.children}
                    </div>
                    <div class={"loading-overlay"}>
                        <div class="case__loading">
                            <div class="big__circle">
                                <div class="inner__circle"></div>
                                <div class="page-loader">
                                    <svg class="circular" viewBox="25 25 50 50">
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stop-color="#50caf2" />
                                                <stop offset="50%" stop-color="#4dafeb" /> <stop offset="100%" stop-color="#50caf2" />
                                            </linearGradient>
                                        </defs>
                                        <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" stroke="url(#gradient)" />
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

