import React, { useState, useEffect } from "react";
import "../../style/custom.css";
import {IoCheckmarkSharp} from "react-icons/io5"

export function ConfirmButton(props) {
    const { Icon, OnConfirm, OnCancel, ConfirmationText } = props;
    const [showConfirmation, setShowConfirmation] = useState(false);
    console.log("showConfirmation =", showConfirmation)

    return (
        <div>
            {
                !showConfirmation ?
                    <div className="button circle danger" onClick={(ev) => {
                        setShowConfirmation(true)
                        ev.stopPropagation()
                    }}>
                        <span>
                            <Icon />
                        </span>
                    </div>
                    :
                    <div className="button circle" onClick={OnConfirm}>
                        <span>
                            <IoCheckmarkSharp />
                        </span>
                    </div>
            }
        </div>

    );
}
