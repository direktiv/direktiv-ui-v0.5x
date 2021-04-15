import { createContext } from "react";

let MainContext = createContext({
    SERVER_BIND: process.env.REACT_APP_API
})

export default MainContext