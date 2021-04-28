import { IoCopy } from 'react-icons/io5';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from '../../util';


function ReactSyntaxHighlighter(props) {
    const {code}=props

    const json = JSON.parse(code)
    const data = JSON.stringify(json, null, '\t')


    return(
        <SyntaxHighlighter language="json" style={tomorrow}>
            {data}
        </SyntaxHighlighter>
    )
}

export default function InputOutput(props) {
    const {data, status} = props


    if (data !== undefined && data !== "") {
        return(
            <div className="editor-wrapper" style={{display: "flex", boxShadow:"none", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
                <div style={{width: "100%", height: "100%", position: "relative"}}>
                    <div className="input-output" style={{borderRadius:"8px", textAlign:"left",  color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                        <ReactSyntaxHighlighter code={atob(data)}/>
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

