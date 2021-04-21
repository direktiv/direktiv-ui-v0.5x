import React, { useState } from "react";
import "../../style/custom.css";
import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5"

export  function ConfirmButton(props) {
    const { Icon, IconColor, OnConfirm, ConfirmationText } = props;
    const [showConfirmation, setShowConfirmation] = useState(false);

    return (
        <div className={`confirm-btn ${showConfirmation ? "expand" : ""}`} onClick={(ev) => {
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

                    <div className="confirm-btn-content" style={{ padding: "0 10px 0px 10px" }} >
                        <span style={{ paddingRight: "5px" }}>
                            {ConfirmationText ? ConfirmationText : "Are you sure?"}
                        </span>
                        <IoCloseSharp className="confirm-btn-icon cancel" style={{ paddingRight: "2px" }} onClick={(ev) => {
                            setShowConfirmation(false)
                            ev.stopPropagation()
                        }} />
                        <IoCheckmarkSharp className="confirm-btn-icon confirm" onClick={OnConfirm} />
                    </div>
            }
        </div>

    );
}
