import {  useContext } from "react"
import { useParams } from "react-router"
import Tag from './tag'
import TileTitle from '../tile-title'
import MainContext from '../../context'

import {IoList} from "react-icons/io5"
import { WorkflowAddAttributes, WorkflowDeleteAttributes } from "./api"

export default function Attribute(props) {
    const {attributes, setAttributes, setErr, ShowError} = props
    const {fetch, handleError} = useContext(MainContext)
    const params = useParams()
    // const [attributes, setAttributes] = useState([])
    // const [actErr, setActionErr] = useState("")
    
    // const fetchAttributes = useCallback(()=>{
    //     async function f() {
    //         try {
    //             let resp = await fetch(`/namespaces/${params.namespace}/workflows/${params.workflow}/attributes`,{
    //                 method:"GET"
    //             })
    //             if(resp.ok){
    //                 let json = await resp.json()
    //                 setAttributes(json)
    //             } else {
    //                 await handleError('list attributes', resp, 'getWorkflowAttributes')
    //             }
    //         } catch(e) {
    //             setErr(`Error fetching attributes: ${e.message}`)
    //         }
    //     }
    //     f()
    // },[fetch, handleError, params.namespace, params.workflow])

    const addAttribute = async (val) => {
        try{
            await WorkflowAddAttributes(fetch, params.namespace, params[0], [...attributes, val], handleError)
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    const deleteAttribute = async (val) => {
        try{
            await WorkflowDeleteAttributes(fetch, params.namespace, params[0], [val], handleError)
        } catch(e) {
            ShowError(`Error: ${e.message}`, setErr)
        }
    }

    // useEffect(()=>{
    //     fetchAttributes()
    // },[fetchAttributes])

    return(
        <div className="item-0 shadow-soft rounded tile">
            <TileTitle name="Add Attributes">
                <IoList />
            </TileTitle>
            <div style={{ maxHeight: "450px", overflow: "auto", paddingRight:"5px", paddingBottom:"5px"}}>
                    <Tag setAttributes={setAttributes} addAttribute={addAttribute} deleteAttribute={deleteAttribute} attributes={attributes}/>
                    <div className="divider-dark" />
                    {/* <div style={{ textAlign: "right" }}>
                        <input type="submit" value="Update" onClick={() => {  }} />
                    </div> */}
            </div>
        </div> 
    )
}