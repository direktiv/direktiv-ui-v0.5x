import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';


function ReactSyntaxHighlighter(props) {
    const {code}=props
    const json = JSON.parse(code)
    const data = JSON.stringify(json, null, '\t')
    console.log(code)
    return(
        <SyntaxHighlighter language="json" style={dark}>
            {data}
        </SyntaxHighlighter>
    )
}

export default function InputOutput(props) {
    const {data} = props

    if (data !== undefined) {
        return(
            <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
                <div style={{width: "100%", height: "100%", position: "relative"}}>
                    <div className="input-output" style={{borderRadius:"8px", textAlign:"left", height: "af", color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                        <ReactSyntaxHighlighter code={atob(data)}/>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%",  top:"-28px", position: "relative"}}>
        <div style={{width: "100%", height: "100%", position: "relative"}}>
            <div style={{borderRadius:"8px", textAlign:"left", height: "auto", color:"white", fontSize:"12pt", background:"#2a2a2a", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0}}>
                Loading...
            </div>
        </div>
    </div>
    )
}
