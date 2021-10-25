import { useState } from "react"
import { IoPeople } from "react-icons/io5"
import { useLocation } from "react-router";
import TileTitle from "../tile-title"


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Login() {
    const [apiKey, setAPIKey] = useState("")
    const q = useQuery()


    return(
        <div style={{height:"100%", width:"100%", display:"flex", alignItems:"center"}}>
            <div className="shadow-soft rounded tile" style={{width:"400px", margin:"auto", fontSize:"12pt"}}>
                <TileTitle name="Login">
                    <IoPeople />
                </TileTitle >
                <div>
                    <div>
                        <input onChange={(e)=>setAPIKey(e.target.value)} type="text" placeholder="Please enter the API Key" style={{width:"90%"}} />
                    </div>
                    {q.get("err") ? 
                    <div style={{color:"red", fontSize:"12pt", marginTop:"5px"}}>
                        {q.get("err")}
                    </div>: ""}
                    <div style={{marginTop:"10px", textAlign:"right", marginRight:"10px"}}>
                        <input type="submit" value="Login" onClick={() => {
                            // set apikey via local-storage
                            localStorage.setItem('apikey', apiKey);
                            window.location.href = "/"
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}