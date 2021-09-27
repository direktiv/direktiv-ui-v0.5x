import React, { useContext } from 'react'

import { useHistory, useLocation, useParams } from 'react-router'
import useBreadcrumbs from 'use-react-router-breadcrumbs'
import MainContext from '../../context'

function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

  
export default function Breadcrumbs(props) {

    const {resetData, appendQueryParams} = props
    const {namespace, bcRoutes} = useContext(MainContext)
    const params = useParams()
    const breadcrumbs = useBreadcrumbs(bcRoutes)
    const history = useHistory()
    const q = useQuery()


    let queryParams = `?`
    q.forEach((v, k)=>{
        queryParams += `${k}=${v}&`
    })
    return (
        <div id="breadcrumbs" className="shadow-soft rounded tile fit-content">
            {breadcrumbs.map((obj)=>{
              
                // If matching certain paths
                if(obj.key === "/n" || obj.key === "/" || obj.key === "/functions") {
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

                        // Handle workflow services with query parameters
                        // if(appendQueryParams && obj.match.path !== `/n/${namespace}` && obj.match.path !== `/n/${namespace}/explorer` && obj.match.path !== `/n/${namespace}/explorer/${params[0]}`) {
                            // history.push(`${obj.key}${queryParams}`)
                        // } else {
                            history.push(obj.key)
                        // }
                        
                    }} key={obj.key}>
                        {obj.breadcrumb}
                    </span>
                )
                

            })}
            {q.get("variables") ?
            <span onClick={()=>{
                history.push(`${breadcrumbs[breadcrumbs.length-1].key}?variables=true`)
            }}>Variables</span>
            :""}
            {q.get('function') ?
            <span onClick={()=>{
                history.push(`${breadcrumbs[breadcrumbs.length-1].key}?function=${q.get("function")}`)
            }}>{q.get("function")}</span>
            :""}
            {q.get('rev') ?
            <span onClick={()=>{
                history.push(`${breadcrumbs[breadcrumbs.length-1].key}?function=${q.get("function")}&rev=${q.get("rev")}`)
            }}>
                {q.get("rev")}
            </span>
            :""}
        </div>
    )
}