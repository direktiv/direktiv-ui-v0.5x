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
    }
]

export default function Breadcrumbs(props) {
    const {dashboard} = props
    
    const breadcrumbs = useBreadcrumbs(routes)
    const history = useHistory()

    return (
        <div id="breadcrumbs" className="neumorph fit-content">
            {breadcrumbs.map((obj)=>{
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
            })}
        </div>
    )
}