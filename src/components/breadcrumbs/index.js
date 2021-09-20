import React, { useContext } from 'react'

import { useHistory, useParams } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'
import MainContext from '../../context'

export default function Breadcrumbs(props) {
    const {dashboard, instanceId, resetData } = props
    const {bcRoutes} = useContext(MainContext)
    const breadcrumbs = useBreadcrumbs(bcRoutes)
    const history = useHistory()
    const params = useParams()

    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{

                // If matching certain paths
                if(obj.key === "/n" || obj.key === "/") {
                    return
                }     
                console.log(obj)
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