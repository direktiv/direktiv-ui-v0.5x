export async function Namespaces(fetch, handleError, load, val) {
    try {
        let newNamespace = ""
        let namespaces = []
        let resp = await fetch(`/flow/namespaces`, {})

        if(resp.ok) {
            let json = await resp.json() 

            // if edges exists means theres namespaces to look at
            if(json.edges){
                // if its the first load
                if(load) {
                    // check routes that dont have a namespace attached
                    if(window.location.pathname !== "/jq/playground" && window.location.pathname.includes("/global/functions")) {
                        if (window.location.pathname.split("/")[2] !== "") {
                            newNamespace = window.location.pathname.split("/")[2]
                        }

                        let f = false
                        for (let i=0; i < json.edges.length; i++) {
                            if(json.edges[i].node.name === newNamespace) {
                                f = true
                            }
                        }

                        if(!f) {
                            window.location.pathname = "/"
                            return
                        }
                    }

                    if(newNamespace === ""){
                        if (localStorage.getItem("namespace") !== undefined && localStorage.getItem("namespace") === "") {
                            if(json.edges.length > 0) {
                                newNamespace = json.edges[0].node.name
                            }
                        } else {
                            let found = false
                            for (let i=0; i < json.edges.length; i++) {
                                if(json.edges[i] !== null && json.edges[i].node.name === localStorage.getItem("namespace")) {
                                    found = true
                                    newNamespace = localStorage.getItem("namespace")
                                    break
                                }
                            }
                            if(!found && json.edges.length > 0) {
                                newNamespace = json.edges[0].node.name
                                localStorage.setItem("namespace", json.edges[0].node.name)
                            } 
                        }
                    }
                }

                if (newNamespace === "" && val) {
                    newNamespace = val
                }
                for (let i=0; i < json.edges.length; i++) {
                    namespaces.push(json.edges[i].node.name)
                }
            }
            return {
                namespaces: namespaces,
                namespace: newNamespace
            }
        } else {
            await handleError('fetching namespaces', resp, "listNamespaces")
        }
    } catch(e) {
        throw new Error(`Failed to fetch namespaces: ${e.message}`)
    }
}

export async function NamespaceCreate(fetch, handleError, val) {
    try {
        let resp = await fetch(`/flow/namespaces/${val}`, {
            method: "POST"
        })
        if(resp.ok) {
            return val
        } else {
            await handleError('create namespace', resp, 'addNamespace')
        }
    } catch(e) {
        throw new Error(`Failed to create namespace: ${e.message}`)
    }
}

export async function NamespaceInstances(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/instances`,{})
        if(resp.ok) {
            let json = await resp.json()
            return json.instances.edges
        } else {
            await handleError('list instances', resp, 'listInstances')
        }
    } catch(e) {
        throw new Error(`Failed to list instances: ${e.message}`)
    }
}

export async function NamespaceLogs(fetch, namespace, handleError, endCursor) {
    try {
        let uri = `/namespaces/${namespace}/logs`
        if(endCursor !== "") {
            uri += `?pagination.after=${endCursor}`
        }
        let resp = await fetch(uri, {})
        if(resp.ok) {
            let json = await resp.json()
            return json
        } else {
            await handleError('fetch namespace logs', resp, 'getNamespaceLogs')
        }
    } catch(e) {
        throw new Error(`Error: ${e.message}`)
    }
}