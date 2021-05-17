
export default function Interactions(props) {
    const {type, interactions} = props

    return(
        <div>
            <h1>{type} API Interactions</h1>
            {interactions.map((obj)=>
                <div className="api-item">
                    <div className={"api-title " + obj.method} onClick={()=>document.getElementById(obj.title).classList.toggle('hide')}>
                        {obj.title} ( {obj.method} )
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