import { useEffect, useState } from "react"
import { InstanceInput, InstanceOutput } from "./api"
import { IoCopy } from 'react-icons/io5';
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"

import { CopyToClipboard } from '../../util-funcs';

export default function InstanceInputOutput(props) {
    const {status, fetch, id, namespace, instance, handleError} = props

    const [data, setData] = useState("")
    const [err, setErr] = useState("")

    useEffect(()=>{
        async function getData() {
            try {
                let resp = null
                switch(id) {
                    case "output":
                        resp = await InstanceOutput(fetch, namespace, instance, handleError)
                        break
                    case "input":
                        resp = await InstanceInput(fetch, namespace, instance, handleError)
                        break
                    default:
                        console.log('hit default')
                }
                if(resp === "") {
                    setData(JSON.stringify({}))
                } else {
                    setData(resp)
                }
            } catch(e) {
                setErr(e.message)
            }
        }
        getData()
    },[fetch, handleError,id, instance, namespace])

    if (err !== ""){
        return(
            <div id={"toggle"+id} className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
                <div style={{width: "100%", height: "100%"}}>
                    <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                        <div id="logs" style={{ width:"100%", borderRadius:"8px", overflow: "auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt",  background:"#2a2a2a", position: "absolute", top:"28px", bottom:"30px", padding:"1em" }}>
                            {err}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (data !== undefined && data !== "") {
        return(
            <div id={"toggle"+id} className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
                <div style={{width: "100%", height: "100%"}}>
                    <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                        <div id="logs" style={{ width:"100%", borderRadius:"8px", overflow: "auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a", position: "absolute", top:"28px", bottom:"30px", paddingBottom:"10px" }}>
                            <ReactSyntaxHighlighter id={id} code={data}/>
                        </div>
                    </div>
                </div>
                <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                        <div>
                            <div className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { 
                                CopyToClipboard(data, "", null)
                            }}>
                                <span style={{}} >Copy</span>
                                <IoCopy style={{ marginLeft: "5px" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>                       
        )
    }

    if (status !== "pending" && status !== undefined) {
        return(
            <div id={"toggle"+id} className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
                <div style={{width: "100%", height: "100%"}}>
                    <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                        <div id="logs" style={{ width:"100%", borderRadius:"8px", overflow: "auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt",  background:"#2a2a2a", position: "absolute", top:"28px", bottom:"30px",  padding:"1em" }}>
                            Unable to retrieve output. Workflow was cancelled or has crashed.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div id={"toggle"+id} className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
            <div style={{width: "100%", height: "100%"}}>
                <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                    <div id="logs" style={{ width:"100%", borderRadius:"8px", overflow: "auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt",  background:"#2a2a2a", position: "absolute", top:"28px", bottom:"30px", padding:"1em" }}>
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Code({ id, code, language, padding }) {

    const [load, setLoad] = useState(true)
    
    useEffect(() => {
      async function highlightCodeBlock() {
        setLoad(true)
        Prism.highlightElement(document.getElementById(id))
        setLoad(false)
      }
      highlightCodeBlock()
    }, [id, code]);

    return (
      <div style={{height:"100%"}} className="Code">
        <pre>
          <code  style={{visibility: load ? "hidden": "visible"}} id={id} className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    );
}

function ReactSyntaxHighlighter(props) {
    const {code, id} = props

    const [data, setData] = useState(code)
    const [load, setLoad] = useState(true)

    useEffect(()=>{
        const json = JSON.parse(code)
        setData(JSON.stringify(json, null, '\t'))
        setLoad(false)
    },[code])

    if(load) {
        return ""
    }

    return(
<>
        {!load ? 
                <Code id={id} language={"json"} code={data} />
                :
                ""
            }
  </>
    )
}