import React, { useContext } from 'react'

import { useHistory, useParams } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'
import MainContext from '../../context'

export default function Breadcrumbs(props) {
    const {dashboard, instanceId } = props
    const {bcRoutes} = useContext(MainContext)
    const breadcrumbs = useBreadcrumbs(bcRoutes)
    const history = useHistory()
    const params = useParams()

    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{
                console.log(obj, "OBJECT")
                // if namespace exists dont show it
                if(obj.key === `/${params.namespace}` || obj.key === '/jq' || obj.key === '/iam' || obj.key === "/functions") {
                    return ""
                }
                // if no instance id use custom breadcrumbs
                if (!instanceId) {
                    if(obj.key !== "/") {
                        return(
                            <span onClick={()=>history.push(obj.key)} key={obj.key}>{obj.breadcrumb}</span>
                        )
                    }
                    // return home key if dashboard
                    if(dashboard){
                        return(
                            <span onClick={()=>history.push("/")} key={"/"}>Dashboard</span>
                        )
                    }
                }
                return ""
            })}
            {instanceId ?
                <>
                    <span key={"/i"} onClick={()=>history.push(`/${params.namespace}/i`)}>Instances</span>
                    <span key={`/i${instanceId}`} onClick={()=>history.push(`/i/${instanceId}`)}>{instanceId}</span>        
                </>
            :
            ""
            }
        </div>
    )
}