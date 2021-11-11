import { useEffect, useState } from 'react';
import { IoCopy } from 'react-icons/io5';
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"

import { CopyToClipboard } from '../../util-funcs';


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
        <pre  style={{overflow: "visible"}}>
          <code  style={{visibility: load ? "hidden": "visible"}} id={id} className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    );
}

export function EditCode({id, code, language, setData}) {
    const [load, setLoad] = useState(true)

    useEffect(()=>{
        async function highlightCodeBlock() {
            setLoad(true)
            Prism.highlightElement(document.getElementById(id))
            setLoad(false)
        }
        highlightCodeBlock()
    },[id, code])

    return (
        <div style={{height:"100%"}} className="Code">
          <pre   style={{overflow: "visible"}}>
              <textarea  style={{visibility: load ? "hidden": "visible"}} id={id} className={`language-${language}`}>{code}</textarea>
          </pre>
        </div>
      );
}

export function EventEditor(props) {
    const {data, setData, id} = props
    return(
        <div className="input-output"  style={{maxHeight: "300px", overflowY: "auto", overflowX: "auto", height: "100%", borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a",left: 0, right: 0,  bottom: 0, padding:"10px"}}>
            <EditCode setData={setData}  id={id} language={"json"} code={data} />
        </div>
    )
}

export function TemplateHighlighter(props) {
    const {data, lang, id} = props

    return(
        <div className="input-output" style={{maxHeight: "300px", overflowY: "auto", overflowX: "auto", height: "100%", borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a",left: 0, right: 0,  bottom: 0, padding:"10px"}}>
            <Code  id={id} language={lang} code={data} />
        </div>
    )
}

// function ReactSyntaxHighlighter(props) {
//     const {code, id} = props

//     const [data, setData] = useState(code)
//     const [load, setLoad] = useState(true)

//     useEffect(()=>{
//         const json = JSON.parse(atob(code))
//         setData(JSON.stringify(json, null, '\t'))
//         setLoad(false)
//     },[code])

//     if(load) {
//         return ""
//     }

//     return(
// <>
//         {!load ? 
//                 <Code id={id} language={"json"} code={data} />
//                 :
//                 ""
//             }
//   </>
//     )
// }

export default function InputOutput(props) {
    const {data, status, id} = props


    if (data !== undefined && data !== "") {
        return(
            <div id={"toggle"+id} className="editor-wrapper" style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight:"300px",  top:"-28px", position: "relative", boxShadow:"none"}}>
            <div style={{width: "100%", height: "100%"}}>
                <div style={{background:"#2a2a2a", height:"100%", top: "28px", marginTop:"28px"}}>
                    <div id="logs" style={{ width:"100%", borderRadius:"8px", overflow: "auto", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", padding:"5px", background:"#2a2a2a", position: "absolute", top:"28px", bottom:"30px", paddingBottom:"10px" }}>
                        <TemplateHighlighter id={id} code={data}/>
            
             </div>
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

