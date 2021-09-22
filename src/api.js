export async function Namespaces(fetch, handleError, load, val) {
    try {
        let newNamespace = ""
        let namespaces = []
        let resp = await fetch(`/namespaces`, {})
        let storageNamespace = localStorage.getItem("namespace")

        if(resp.ok) {
            let json = await resp.json() 

            // if edges exists means theres namespaces to look at
            if(json.edges){
                // if its the first load
                if(load) {

                    let exist = false
                    let storageNSFound = false
                    let pathNamespace = window.location.pathname.split("/")[2]

                    // loop through ns and push ns to list. also check if path ns exists
                    for(let i=0; i < json.edges.length; i++) {
                        console.log("i =", i)
                        namespaces.push(json.edges[i].node.name)
                        if(json.edges[i].node.name === pathNamespace){
                            exist = true
                            newNamespace = json.edges[i].node.name
                        }

                        if(storageNamespace !== undefined && storageNamespace !== "" && json.edges[i].node.name === storageNamespace){
                            storageNSFound = true
                            newNamespace = storageNamespace
                        }
                    }

                    // if ns does not exist, and there is atleast 1 ns in list then set it to first ns
                    if(!exist && namespaces.length > 0 && !storageNSFound) {
                        newNamespace = namespaces[0]
                    } else if (pathNamespace === "" && !storageNSFound) {
                        // otherwise set it to root
                        window.location.pathname = "/"
                        return
                    }


                    // Check routes that dont require namespace
                    if (window.location.pathname === "/jq/playground" || window.location.pathname.startsWith("/functions/global")) {
                        return {
                            namespaces: namespaces,
                            namespace: newNamespace
                        }
                    } else if (!exist) {
                        window.location.pathname = `/n/${newNamespace}`
                        return
                    }

                    // Namespace exists 
                    return {
                        namespaces: namespaces,
                        namespace: newNamespace
                    }
                }
            }
        } else {
            await handleError('fetching namespaces', resp, "listNamespaces")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceCreate(fetch, handleError, val) {
    try {
        let resp = await fetch(`/namespaces`, {
            method: "POST",
            body: JSON.stringify({
                name: val
            })
        })
        if(resp.ok) {
            return val
        } else {
            await handleError('create namespace', resp, 'addNamespace')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDelete(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}`,{
            method:"DELETE"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('delete namespace', resp, "deleteNamespace")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceInstances(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/instances`,{})
        if(resp.ok) {
            let json = await resp.json()
            return json.instances.edges
        } else {
            await handleError('list instances', resp, 'listInstances')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
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
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceSecrets(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/secrets`,{})
        if(resp.ok) {
            let json = await resp.json()
            console.log(json)
            return json.secrets.edges
        } else {
            await handleError('fetch secrets', resp, 'listSecrets')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceRegistries(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/registries`,{})
        if(resp.ok) {
            let json = await resp.json()
            return json.registries
        } else {
            await handleError('fetch registries', resp, 'listRegistries')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceCreateSecret(fetch, namespace, key, value, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/secrets/${key}`,{
            method: "PUT",
            body: JSON.stringify({ data: value})
        })
        if(resp.ok){
            return
        } else {
            await handleError('create secret', resp, 'createSecret')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceCreateRegistry(fetch, namespace, key,val, handleError) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/registries`, {
            method: "POST",
            body: JSON.stringify({data:val, reg: key})
        })
        if(resp.ok){
            return
        } else {
            await handleError('create registry', resp, 'createRegistry')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDeleteSecret(fetch, namespace, val, handleError){
    try {
        let resp = await fetch(`/namespaces/${namespace}/secrets/${val}`, {
            method: "DELETE"
        })
        if (resp.ok) {
            return 
        } else {
            await handleError('delete secret', resp, 'deleteSecret')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDeleteRegistry(fetch, namespace, key, handleError) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/registries`, {
            method: "DELETE",
            body: JSON.stringify({
                reg: key
            })
        })
        if (resp.ok) {
            return 
        } else {
            await handleError('delete registry', resp, 'deleteRegistry')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceVariables(fetch, namespace, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/vars`,{
            method: "GET"
        })
        if(resp.ok) {
            let json = await resp.json()
            return json.variables.edges
        } else {
            await handleError('fetch variables', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceSetVariable(fetch, namespace, name, val, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/vars/${name}`, {
            method: "PUT",
            body: val
        })
        if (resp.ok) {
            return true
        } else {
            await handleError('set variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDeleteVariable(fetch, namespace, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/vars/${name}`,{
            method: "DELETE"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('delete variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceGetVariable(fetch, namespace, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/vars/${name}`, {})
        if(resp.ok) {
            return await resp.text()
        } else {
            await handleError('get variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDownloadVariable(fetch, namespace, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/vars/${name}`, {})
        if(resp.ok) {
            return {
               contentType: resp.headers.get("content-type"),
               blob: await resp.blob()
            }
        } else {
            await handleError('get variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceTree(fetch, namespace, path, children, handleError) {
    try {
        let uri = `/namespaces/${namespace}/tree`
        if(path[0]) {
            uri += `/${path[0]}`
        }
        let resp = await fetch(`${uri}/`, {})
        if(resp.ok) {
            let json = await resp.json()
            if(children) {
                if(json.children && json.children.edges.length > 0) {
                    return {
                        list: json.children.edges,
                        pageInfo: json.children.pageInfo
                    }
                } else {
                    return {
                        list: [],
                        pageInfo: null
                    }
                }
            } else {
                return json.node.type
            }
        } else {
            await handleError(`fetch details on ${path[0]}`, resp, "TODO PERM")
        }
    } catch(e) {
        throw new Error(e.message)
    }
}

export async function NamespaceCreateNode(fetch, namespace, path, dir, type, data, handleError) {
    try {
        let uriPath = `/namespaces/${namespace}/tree`
        if(path) {
            uriPath += `/${path}`
        }
        let body = {
            type: type
        }
        if(type === "workflow") {
            body = data
            dir += "?op=create-workflow"
        } else {
            dir += "?op=create-directory"
            body = JSON.stringify(body)
        }
        let resp = await fetch(`${uriPath}/${dir}`, {
            method: "PUT",
            body: body
        })
        if(resp.ok) {
            return true
        } else {
            // TODO what permission we giving this?
            await handleError('create node', resp, "TODO")
        }
    } catch(e) {
        throw new Error(e.message)
    }
}

export async function NamespaceDeleteNode(fetch, namespace, path, name, handleError) {
    try {
        let uriPath = `/namespaces/${namespace}/tree`
        if(path) {
            uriPath += `/${path}`
        }
        let resp = await fetch(`${uriPath}/${name}?op=delete-node`, {
            method: "DELETE"
        })
        if(resp.ok){
            return true
        } else {
            await handleError('delete node', resp, "TODO")
        }
    } catch(e) {
        throw new Error(e.message)
    }
}

export async function NamespaceBroadcastEvent(fetch, namespace, data, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/broadcast`,{
            method: "POST",
            body: data
        })
        if(resp.ok) {
            return true
        } else {
            await handleError('send namespace event', resp, "namespaceEvent")
        }
    } catch(e) {
        throw new Error(e.message)
    }
}
// Functions
export async function NamespaceFunctions(fetch, handleError, ns) {
    try {
        let resp = await fetch(`/functions/namespaces/${ns}`, {})

        if(resp.ok) {
            let json = await resp.json() 

            if (!json.functions) {
                throw new Error("response missing functions");
            }

            if (!Array.isArray(json.functions)) {
                throw new Error("functions response is incorrect type");
            }

            if (!json.config) {
                throw new Error("response missing config");
            }

            return {
                functions: json.functions,
                config: json.config
            }
        } else {
            await handleError('fetching namespace functions', resp, "listNamespaceFunctions")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceFunction(fetch, handleError, ns, svn) {
    try {
        let resp = await fetch(`/functions/namespaces/${ns}/function/${svn}`, {})

        if(resp.ok) {
            return await resp.json()
        } else {
            await handleError('fetching namespace function', resp, "listNamespaceFunction")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceCreateFunction(fetch, handleError, ns, svn, image, minScale, size, cmd) {
    try {
        let resp = await fetch(`/functions/namespaces/${ns}`, {
            method: "POST",
            body: JSON.stringify({
                name: svn,
                image: image,
                minScale: minScale,
                size: size,
                cmd: cmd
            })
        })

        if(resp.ok) {
            return
        } else {
            await handleError('creating namespace function', resp, "createNamespaceFunctions")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

// This is also used to create a revision
export async function NamespaceUpdateFunction(fetch, handleError, ns, svn, image, minScale, size, cmd, traffic) {
    try {
        let resp = await fetch(`/functions/namespaces/${ns}/function/${svn}`, {
            method: "POST",
            body: JSON.stringify({
                image: image,
                minScale: minScale,
                size: size,
                cmd: cmd,
                trafficPercent: traffic
            })
        })

        if(resp.ok) {
            return
        } else {
            await handleError('updating namespace service', resp, "updateNamespaceService")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceUpdateTrafficFunction(fetch, handleError, namespace, svn, traffic) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/function/${svn}`, {
            method: "PATCH",
            body: JSON.stringify({
                values: traffic,
            })
        })

        if(resp.ok) {
            return await resp.json()
        } else {
            await handleError('set traffic', resp, "updateNamespaceServiceTraffic")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDeleteFunction(fetch, handleError, ns, svn) {
    console.log("svn =", svn)
    try {
        let resp = await fetch(`/functions/namespaces/${ns}/function/${svn}`, {
            method: "DELETE"
        })

        if(resp.ok) {
            return
        } else {
            await handleError('deleting namespace functions', resp, "deleteNamespaceFunction")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function NamespaceDeleteFunctionRevision(fetch, handleError, namespace, svn, revision) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/function/${svn}/revisions/${revision}`, {
            method: "DELETE"
        })

        if(resp.ok) {
            return
        } else {
            await handleError('deleting namespace function revision', resp, "deleteNamespaceRevision")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}
