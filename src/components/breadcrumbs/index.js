import React from 'react'
import { useHistory, useParams } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'

const routes = [
    {
        path: '/:namespace',
        breadcrumb: "",
    },
    {
        path: '/:namespace/w',
        breadcrumb: 'Workflows'
    },
    {
        path: '/:namespace/i',
        breadcrumb: 'Instances'
    },
    {
        path: '/:namespace/s',
        breadcrumb: 'Settings'
    }
]

export default function Breadcrumbs(props) {
    const {dashboard, instanceId} = props
    
    const breadcrumbs = useBreadcrumbs(routes)
    const history = useHistory()
    const params = useParams()

    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{
                console.log(obj)
                // if namespace exists dont show it
                if(obj.key === `/${params.namespace}`) {
                    return
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