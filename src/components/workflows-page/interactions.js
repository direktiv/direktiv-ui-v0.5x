
export default function Interactions(props) {
    const {type, interactions} = props

    return(
        <div>
            <h1 style={{textAlign:"center"}}>{type} API Interactions</h1>
            {interactions.map((obj)=>
                <div className="api-item">
                    <div style={{display:"flex", alignItems:"center"}} className={"api-title " + obj.method} onClick={()=>document.getElementById(obj.title).classList.toggle('hide')}>
                        <span style={{width:"55px", textAlign:"center", marginRight:"10px"}} className={"api-btn "+ obj.method}>{obj.method}</span>
                        <span style={{marginRight:"10px", fontSize:"10pt"}}>{obj.url}</span>
                        <span style={{fontStyle:"italic", fontSize:"10pt"}}>{obj.title}</span>
                    </div>
                    <pre className="api-desc" id={obj.title} >
                        <code>
                            {obj.description}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    )

}