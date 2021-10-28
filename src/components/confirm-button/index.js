
import React, { useState, useEffect, useCallback } from "react";
import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5"

export function ConfirmButton(props) {
    const { Icon, IconColor, OnConfirm, ConfirmationText } = props;
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [listen, setListen] = useState(false);

    const setConfirm = useCallback(() => {
        setShowConfirmation(!showConfirmation)
    }, [showConfirmation])

    useEffect(() => {
        if (showConfirmation && !listen) {
            setListen(true)
            document.addEventListener('click', setConfirm, false)
        }

        return function cleanup() {
            if (listen && showConfirmation) {
                setListen(false)
                document.removeEventListener('click', setConfirm, false);
            }
        }
    }, [showConfirmation, listen, setConfirm])


    return (
        <div className={`confirm-btn ${showConfirmation ? "expand" : ""}`} onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation()
        }}>
            {
                !showConfirmation ?
                    <div className="confirm-btn-content" style={{ width: "36px" }} onClick={(ev) => {
                        ev.preventDefault();
                        setShowConfirmation(true)
                        ev.stopPropagation()
                    }}>
                        <Icon style={IconColor ? { color: `${IconColor}` } : {}} />
                    </div>
                    :

                    <div className="confirm-btn-content" style={{ padding: "0 10px 0px 10px" }} >
                        <span style={{ paddingRight: "5px" }}>
                            {ConfirmationText ? ConfirmationText : "Are you sure?"}
                        </span>
                        <IoCloseSharp className="confirm-btn-icon cancel" style={{ paddingRight: "2px" }} onClick={(ev) => {
                            ev.preventDefault();
                            setShowConfirmation(false)
                            ev.stopPropagation()
                        }} />
                        <IoCheckmarkSharp className="confirm-btn-icon confirm" onClick={OnConfirm} />
                    </div>
            }
        </div>

    );
}

export function MiniConfirmButton(props) {
    const { Icon, IconColor, OnConfirm, IconConfirmColor, IconConfirm, style } = props;
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [listen, setListen] = useState(false);

    const setConfirm = useCallback(() => {
        setShowConfirmation(!showConfirmation)
    }, [showConfirmation])

    useEffect(() => {
        let hideTimeout;
        if (showConfirmation && !listen) {
            setListen(true)
            document.addEventListener('click', setConfirm, false);
            hideTimeout = setTimeout(function () { setShowConfirmation(false) }, 5000);
        }

        return function cleanup() {
            if (hideTimeout) {
                clearTimeout(hideTimeout)
            }
            if (listen && showConfirmation) {
                setListen(false)
                document.removeEventListener('click', setConfirm, false);
            }
        }
    }, [showConfirmation, listen, setConfirm])


    return (
        <div style={style} className={`confirm-btn`} onClick={(ev) => {
            ev.stopPropagation()
        }}>
            {
                !showConfirmation ?
                    <div className="confirm-btn-content" style={{ width: "36px" }} onClick={(ev) => {
                        setShowConfirmation(true)
                        ev.stopPropagation()
                    }}>
                        <Icon style={IconColor ? { color: `${IconColor}` } : {}} />
                    </div>
                    :

                    <div className="confirm-btn-content confirm-btn-icon confirm" onClick={()=>{
                        setShowConfirmation(false)
                        OnConfirm()
                    }} style={{ padding: "0 10px 0px 10px" }} >
                        {IconConfirm ? <IconConfirm style={IconConfirmColor ? { color: `${IconConfirmColor}` } : {}} />
                            :
                            <IoCheckmarkSharp style={IconConfirmColor ? { color: `${IconConfirmColor}` } : {}} />
                        }
                    </div>
            }
        </div>

    );
}
