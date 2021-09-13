import { IoAdd, IoFolder, IoFolderOutline, IoSearch, IoSubwayOutline, IoTrash } from "react-icons/io5";
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { ConfirmButton } from '../confirm-button'
import { useCallback, useContext, useEffect, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component';
import MainContext from "../../context";
import LoadingWrapper from "../loading";
import { useHistory, useParams } from "react-router";

export default function Explorer() {

    const {fetch, handleError, namespace} = useContext(MainContext)
    const {path} = useParams()

    const [loading, setLoading] = useState(false)
    const [objects, setObjects] = useState([])
    const [pageInfo, setPageInfo] = useState(null)
    const [currPath, setCurrPath] = useState("")

    const [err, setErr] = useState("")

    const fetchData = useCallback(()=>{
        async function grabData() {
            try {
                let resp = await fetch(`/directories`, {
                    method: "GET"
                })
                if(resp.ok) {
                    let json = await resp.json()
                    if(json.children && json.children.edges.length > 0) {
                        setObjects(json.children.edges)
                        setPageInfo(json.children.pageInfo)
                    }
                } else {
                    // TODO what permission we giving this?
                    await handleError('fetch objects', resp, "TODO")
                }
            } catch(e) {
                setErr(`Error fetching filelist: ${e.message}`)
            }
        }
        grabData()
    },[fetch, handleError])

    useEffect(()=>{
        if(objects.length === 0 && !loading || currPath !== path){
            setLoading(true)
            fetchData()
            setLoading(false)
        }
    },[fetchData, loading, objects.length])

    return(
        <div className="container" style={{ flex: "auto" }}>
            <div className="container">
                <div style={{ flex: "auto", display:"flex", width:"100%" }}>
                    <Breadcrumbs />
                    <div style={{display:"flex", fontSize:"16pt", gap:"10px", justifyContent:"flex-end", alignItems:'center', padding:"10px", flex: 1}}>
                        <div title="Create Workflow" className="button circle" style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                            <IoAdd />
                        </div>
                        <div title="Create Directory" className="button circle" style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                            <IoFolder />
                        </div>
                    </div>
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="shadow-soft rounded tile" style={{ flex: "auto", flexGrow: "4", minWidth: "400px" }}>
                    <TileTitle name="Explorer">
                        <IoSearch />
                    </TileTitle >
                    <LoadingWrapper isLoading={loading}>
                        <ul>
                            {objects.map((obj)=>{
                                return(
                                    <FileObject namespace={namespace} name={obj.node.name}  key={obj.node.name} type={obj.node.type} id={obj.node.path} />
                                )
                            })}
                        </ul>
                    </LoadingWrapper>
                </div>
            </div>
        </div>
    )
}

function FileObject(props) {
    const {type, id, name, namespace} = props
    const history = useHistory()

    function toggleObject() {
        //TODO add toggle workflow
    }

    function deleteObject() {
        //TODO delete workflow or directory
    }

    return(
        <li onClick={()=>{
            history.push(`/${namespace}/explorer/${id.split("/")[1]}`)
        }} style={{display:"flex", gap:"10px", fontSize:"16pt", marginTop:"10px"}}>
            <div>
                {
                    type === "workflow" ?
                    // replace this?
                    <IoSubwayOutline />
                    :
                    <IoFolderOutline />
                }
            </div>
            <div style={{flex: 1}}>
                {name}
            </div>
            <div>
                {
                    type === "workflow" ? 
                    <>
                        <div title="Workflow Variables">
                            <div className="button circle" style={{display: "flex", justifyContent: "center", color: "inherit", textDecoration: "inherit"}}  onClick={(ev) => {
                                ev.preventDefault();
                                history.push(`/${namespace}/w/${name}/variables`)
                            }}>
                                <span style={{fontWeight: "bold"}}>
                                    VAR
                                </span>
                            </div>
                        </div>
                    </>
                    :
                    <>
                    </>
                }
                <div title={type === "workflow" ? "Delete Workflow":"Delete Directory"}>
                    <ConfirmButton Icon={IoTrash} IconColor={"var(--danger-color)"} OnConfirm={(ev) => {
                        ev.preventDefault();
                        deleteObject(id)
                    }} /> 
                </div>
            </div>
        </li>
    )
}