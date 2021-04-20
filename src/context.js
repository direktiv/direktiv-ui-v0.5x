import { createContext } from "react";

let url = window.__PUBLIC_API_URL__

if (process.env.REACT_APP_API) {
    url = process.env.REACT_APP_API
}


let MainContext = createContext({
    SERVER_BIND: url,
})

export default MainContext