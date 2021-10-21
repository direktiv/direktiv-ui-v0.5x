import { json } from 'd3-fetch'
import YAML from 'js-yaml'

export async function checkStartType(wf) {
    // check for event start type
    try {
        let y = YAML.load(wf)
        if (y.start) {
            if (y.start.type !== "default") {
                // this file should not be able to be executed.
                return false
            }
        }
        return true
    } catch (e) {
        // return true if an error happens as the yaml is not runnable in the first place
        return true
    }
}



export async function WorkflowFunction(fetch, handleError, namespace, path, service) {
    try {
        let resp = await fetch(`/functions/namespaces/${namespace}/tree/${path}?op=function`, {})
        if(resp.ok) {
            return await resp.json()
        } else {
            await handleError('fetching workflow function', resp, "getService")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}


export async function WorkflowSetLogToEvent(fetch, namespace, workflow, val, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=set-workflow-event-logging&ref=${rev}`,{
            method: "POST",
            body: JSON.stringify({
                logger: val
            })
        })
        if(resp.ok) {
            return val
        } else {
            await handleError('fetch workflow log to events', resp, 'getWorkflow')
        }
    } catch(e) {
        throw new Error(`Failed to fetch log to events: ${e.message}`)
    }
}
export async function WorkflowSetActive(fetch, namespace, workflow, handleError, active, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=toggle&ref=${rev}`, {
            method: "POST",
            body: JSON.stringify({
                live: active
            })
        })
        if(resp.ok) {
            return active
        } else {
            await handleError('toggle workflow', resp, 'toggleWorkflow')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowExecute(fetch, namespace, workflow, handleError, jsonInput, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    let uri = `/namespaces/${namespace}/tree/${workflow}?op=execute&ref=${rev}`
    // if(rev === "latest") {
    //     uri = `/namespaces/${namespace}/tree/${workflow}?op=execute`
    // }

    try {
        let resp = await fetch(uri, {
            method: "POST",
            body: jsonInput
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.instance
        } else {
            await handleError('execute workflow', resp, 'executeWorkflow')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowSave(fetch, namespace, workflow, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=save-workflow&ref=${rev}`, {
            method: "POST"
        })
        if (resp.ok) {
            return true
        } else {
            await handleError('save workflow', resp, 'saveWorkflow')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowUpdate(fetch, namespace, workflow, handleError, workflowValue) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=update-workflow`, {
            method: "post",
            headers: {
                "Content-type": "text/yaml",
                "Content-Length": workflowValue.length,
            },
            body: workflowValue
        })
        if (resp.ok) {
            let json = await resp.json()
            let active = await WorkflowActiveStatus(fetch, namespace, workflow, handleError)
            let exec = await checkStartType(workflowValue)
            return {
                revision: json.revision.hash,
                active: active,
                exec: exec
            }
        } else {
            await handleError('update workflow', resp, 'updateWorkflow')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowDeleteRevision(fetch, namespace, workflow, handleError, ref) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=delete-revision&ref=${ref}`, {
            method:"POST"
        })
        if(resp.ok) {
            return
        } else {
            await handleError(`discard workflow`, resp, 'discard')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}
export async function WorkflowDiscard(fetch, namespace, workflow, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=discard-workflow&ref=${rev}`, {
            method: "POST"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('discard workflow', resp, 'discardWorkflow')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowTag(fetch, namespace, workflow, handleError, ref, tag) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=tag&ref=${ref}&tag=${tag}`,{
            method: "POST"
        })
        if(resp.ok) {
            return
        } else {
            await handleError(`tag workflow`, resp, 'tag')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowLogToEventStatus(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=set-workflow-event-logging`,{
            method: "GET"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('fetch workflow log to events', resp, 'getWorkflow')
        }
    } catch(e) {
        throw new Error(`Failed to fetch log to events: ${e.message}`)
    }
}

export async function WorkflowActiveStatus(fetch, namespace, workflow, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=router&ref=${rev}`, {
            method: "get",
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.live
        } else {
            await handleError('fetch workflow active status', resp, 'getWorkflow')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowAddAttributes(fetch, namespace, workflow, attributes, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=create-node-attributes`, {
            method: "PUT",
            body: JSON.stringify({
                attributes: attributes
            })
        })
        if(resp.ok){
            return
        } else {
            await handleError('add workflow attributes', resp, 'createAttribute')
        }
    } catch(e) {
        throw new Error(e.message)
    }
}

export async function WorkflowDeleteAttributes(fetch, namespace, workflow, attributes, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=delete-node-attributes`, {
            method: "DELETE",
            body: JSON.stringify({
                attributes: attributes
            })
        })
        if(resp.ok){
            return
        } else {
            await handleError('delete workflow attributes', resp, 'deleteAttribute')
        }
    } catch(e) {
        throw new Error(e.message)
    }
}

export async function WorkflowRoute(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=router`, {
            method: "GET"
        })
        if (resp.ok) {
            let json = await resp.json()
            return json
        } else {
            await handleError('get workflow router', resp, 'getRouter')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowEditRoute(fetch, namespace, workflow, handleError, routes, live) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=edit-router`, {
            method: "POST",
            body: JSON.stringify({
                route: routes,
                live: live,
            })
        })
        if (resp.ok) {
            let json = await resp.json()
            return json
        } else {
            await handleError('edit workflow router', resp, 'editRouter')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowRefs(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=refs`,{})
        if(resp.ok) {
            let js = await resp.json()
            return js.edges
        } else {
            await handleError('fetch workflow refs', resp, 'getWorkflow')
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function Workflow(fetch, namespace, workflow, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?ref=${rev}`, {
            method: "get",
        })
        if (resp.ok) {
            let json = await resp.json()
            return {
                eventLogging: json.eventLogging,
                attributes: json.node.attributes,
                source: atob(json.revision.source),

            }
        } else {
            await handleError('fetch workflow', resp, 'getWorkflow')
        }
    } catch (e) {
        throw new Error(`Failed to fetch workflow: ${e.message}`)
    }
}

export async function WorkflowInstances(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/instances?pagination.filter.field=AS&pagination.filter.type=CONTAINS&pagination.filter.val=${workflow}`,{})
        if (resp.ok) {
            let json = await resp.json()
            return json.instances.edges
        } else {
            await handleError('list instances', resp, 'listInstances')
        }
    } catch(e) {
        throw new Error(`Failed to list instances: ${e.message}`)
    }
}

export async function WorkflowStateMillisecondMetrics(fetch, namespace, workflow, handleError, ref) {
    let rev = ref
    if(rev === undefined){
        rev = "latest"
    }
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=metrics-state-milliseconds&ref=${rev}`, {})
        if (resp.ok) {
            let json = await resp.json()
            return json.results
        } else {
            await handleError("unable to get state metrics", resp, "getMetrics")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowVariables(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=vars`, {})
        if(resp.ok) {
            let json = await resp.json()
            if(Array.isArray(json.variables.edges)){
                if(json.variables.edges.length > 0) {
                    return json.variables.edges
                }
            }
            return []
        } else {
            await handleError('fetch variables', resp, 'listWorkflowVariables')
        }
    } catch(e) {
        throw new Error(`Failed to fetch variables: ${e.message}`)
    }
}

export async function WorkflowSetVariable(fetch, namespace, workflow, name, val, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=set-var&var=${name}`, {
            method: "PUT",
            body: val
        })
        if (resp.ok) {
            return true
        } else {
            await handleError('set variable', resp, 'setWorkflowVariable')
        }
    } catch(e) {
        throw new Error(`Failed to set variable: ${e.message}`)
    }
}


export async function WorkflowDeleteVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=delete-var&var=${name}`,{
            method: "DELETE"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('delete variable', resp, 'setWorkflowVariable')
        }
    } catch(e) {
        throw new Error(`Failed to delete variable: ${e.message}`)
    }
}

export async function WorkflowGetVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=var&var=${name}`, {})
        if(resp.ok) {
            return await resp.text()
        } else {
            await handleError('get variable', resp, 'getWorkflowVariable')
        }
    } catch(e) {
        throw new Error(`Failed to get variable: ${e.message}`)
    }
}

export async function WorkflowDownloadVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=var&var=${name}`, {})
        if(resp.ok) {
            return {
                contentType: resp.headers.get("content-type"),
                blob: await resp.blob()
             }
        } else {
            await handleError('get variable', resp, 'getWorkflowVariable')
        }
    } catch(e) {
        throw new Error(`Failed to get variable: ${e.message}`)
    }
}