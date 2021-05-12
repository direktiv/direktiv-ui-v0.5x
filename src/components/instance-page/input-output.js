import { useEffect, useState } from 'react';
import { IoCopy } from 'react-icons/io5';
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"

import { CopyToClipboard } from '../../util-funcs';


export function Code({ id, code, language }) {
    const [load, setLoad] = useState(true)
    useEffect(() => {
        
      Prism.highlightElement(document.getElementById(id))
      setLoad(false)
    }, [id]);

    return (
      <div  className="Code">
        <pre>
          <code style={{visibility: load ? "hidden": "visible"}} id={id} className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    );
}

export function TemplateHighlighter(props) {
    const {data, lang} = props


    return(
            <div className="input-output" style={{ maxHeight:"91%", minHeight:"300px", overflow:"auto", borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a",left: 0, right: 0, top: "25px", bottom: 0}}>
                <Code id="yaml" language={lang} code={data} />
            </div>

    )
}

function ReactSyntaxHighlighter(props) {
    const {code, id} = props

    const [data, setData] = useState(code)
    const [load, setLoad] = useState(true)

    useEffect(()=>{
        const json = JSON.parse(atob(code))
        setData(JSON.stringify(json, null, '\t'))
        setLoad(false)
    },[code])

    if(load) {
        return ""
    }

    return(
     <div className="input-output" style={{ maxHeight:"91%", minHeight:"300px", overflow:"auto", borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a",left: 0, right: 0, top: "25px", bottom: 0}}>
                    {!load ? 
                    <Code id={id} language={"json"} code={data} />
                        :""}
            </div>
    )
}

export default function InputOutput(props) {
    const {data, status, id} = props


    if (data !== undefined && data !== "") {
        return(
            <div className="editor-wrapper" style={{display: "flex", boxShadow:"none", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
                <div style={{width: "100%", height: "100%", position: "relative"}}>
                    <div className="input-output" style={{borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                        <ReactSyntaxHighlighter id={id} code={data}/>
                    </div>
                </div>
                <div id="test" className="editor-footer">
                    <div className="editor-footer-buffer" />
                    <div className="editor-footer-actions">
                        <div>
                        <div  className="editor-footer-button" style={{ padding: "0 10px 0 10px", display: "flex", alignItems: "center", userSelect: "none"}} onClick={() => { 
                            CopyToClipboard(atob(data), "", null)
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
            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
            <div style={{width: "100%", height: "100%", position: "relative"}}>
                <div style={{borderRadius:"8px", padding:"5px", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                    Unable to retrieve output. Workflow was cancelled or has crashed.
                </div>
            </div>
        </div>
        )
 
    }

    return(
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
        <div style={{width: "100%", height: "100%", position: "relative"}}>
            <div style={{borderRadius:"8px", padding:"5px", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                Loading...
            </div>
        </div>
    </div>
    )
}

