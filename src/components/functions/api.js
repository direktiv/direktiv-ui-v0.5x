export async function GlobalFunctions(fetch, handleError) {
    try {
        let resp = await fetch(`/functions`, {})

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
            await handleError('fetching global functions', resp, "listGlobalFunctions")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function GlobalFunction(fetch, handleError, svn) {
    try {
        let resp = await fetch(`/functions/${svn}`, {})

        if(resp.ok) {
            let json = await resp.json() 

            return json
        } else {
            await handleError('fetching global function', resp, "listGlobalFunction")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

// Can also be used to create function
export async function GlobalUpdateFunction(fetch, handleError, svn, image, minScale, size, cmd, traffic) {
    try {
        let resp = await fetch(`/functions/${svn}`, {
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

export async function GlobalUpdateTrafficFunction(fetch, handleError, svn, traffic) {
    try {
        let resp = await fetch(`/functions/${svn}`, {
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

export async function GlobalCreateFunction(fetch, handleError, svn, image, minScale, size, cmd) {
    try {
        let resp = await fetch(`/functions`, {
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
            await handleError('creating global function', resp, "createGlobalFunctions")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function GlobalDeleteFunction(fetch, handleError, svn) {
    console.log("svn =", svn)
    try {
        let resp = await fetch(`/functions/${svn}`, {
            method: "DELETE"
        })

        if(resp.ok) {
            return
        } else {
            await handleError('deleting global functions', resp, "deleteGlobalFunction")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function GlobalDeleteFunctionRevision(fetch, handleError, svn, revision) {
    try {
        let resp = await fetch(`/functions/${svn}/revisions/${revision}`, {
            method: "DELETE"
        })

        if(resp.ok) {
            return
        } else {
            await handleError('deleting global function revision', resp, "deleteNamespaceRevision")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}