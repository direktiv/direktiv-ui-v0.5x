import React from 'react'
import { useHistory } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'

const routes = [
    {
        path: '/w',
        breadcrumb: 'Workflows'
    },
    {
        path: '/i',
        breadcrumb: 'Instances'
    },
    {
        path: '/s',
        breadcrumb: 'Secrets'
    }
]

export default function Breadcrumbs(props) {
    const {dashboard, instanceId} = props
    
    const breadcrumbs = useBreadcrumbs(routes)
    const history = useHistory()

    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{
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
                    <span key={"/i"} onClick={()=>history.push("/i")}>Instances</span>
                    <span key={`/i${instanceId}`} onClick={()=>history.push(`/i/${instanceId}`)}>{instanceId}</span>        
                </>
            :
            ""
            }
        </div>
    )
}