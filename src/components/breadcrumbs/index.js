import React, { useContext } from 'react'

import { useHistory } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'
import MainContext from '../../context'

export default function Breadcrumbs(props) {
    const {resetData } = props
    const {bcRoutes} = useContext(MainContext)
    const breadcrumbs = useBreadcrumbs(bcRoutes)
    const history = useHistory()

    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{

                // If matching certain paths
                if(obj.key === "/n" || obj.key === "/") {
                    return ""
                }     

                return(
                    <span onClick={()=>{
                        // reset state back to empty string (used in explorer to update useEffect states)
                        if(resetData){
                            for(let i=0; i < resetData.length; i++) {
                                let x = resetData[i]
                                x("")
                            }
                        }
                        history.push(obj.key)
                    }} key={obj.key}>
                        {obj.breadcrumb}
                    </span>
                )
                

            })}
        </div>
    )
}