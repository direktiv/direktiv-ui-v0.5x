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

export async function WorkflowSetActive(fetch, namespace, workflow, handleError, active) {
    try {
        let resp = await fetch(`/flow/active/${workflow}`, {
            method: "PUT",
            body: JSON.stringify({
                active: active
            })
        })
        if(resp.ok) {
            let json = await resp.json()
            return json.live
        } else {
            await handleError('toggle workflow', resp, 'toggleWorkflow')
        }
    } catch(e) {
        throw new Error(`Failed to toggle workflow: ${e.message}`)
    }
}

export async function WorkflowExecute(fetch, namespace, workflow, handleError, jsonInput) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}?op=execute`, {
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
            // TODO
            // let active = await WorkflowActiveStatus(fetch, namespace, workflow, handleError)
            // TODO
            // let exec = await checkStartType(workflowValue)
            return {
                revision: json.revision.hash,
                active: true,
                exec: true
            }
        } else {
            await handleError('update workflow', resp, 'updateWorkflow')
        }
    } catch (e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowLogToEventStatus(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/workflows/${workflow}`,{
            method: "GET"
        })
        if(resp.ok) {
            let json = await resp.json()
            console.log(json)
        } else {
            await handleError('fetch workflow log to events', resp, 'getWorkflow')
        }
    } catch(e) {
        throw new Error(`Failed to fetch log to events: ${e.message}`)
    }
}

export async function WorkflowActiveStatus(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/active/${workflow}`, {
            method: "get",
        })
        if (resp.ok) {
            let json = await resp.json()
            return json.live
        } else {
            await handleError('fetch workflow active status', resp, 'getWorkflow')
        }
    } catch (e) {
        throw new Error(`Failed to workflow active status: ${e.message}`)
    }
}

export async function Workflow(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/tree/${workflow}`, {
            method: "get",
        })
        if (resp.ok) {
            let json = await resp.json()
            return atob(json.revision.source)
            // let wf = atob(json.workflow)



            // // setExecutable(exec)
            // setWorkflowValue(wf)
            // wfRefValue.current = wf
            // setWorkflowValueOld(wf)

            // setWorkflowInfo((wfI) => {
            //     wfI.active = json.active
            //     return { ...wfI }
            // })
            // setLogEvent(json.logToEvents)
        } else {
            await handleError('fetch workflow', resp, 'getWorkflow')
        }
    } catch (e) {
        throw new Error(`Failed to fetch workflow: ${e.message}`)
    }
}

export async function WorkflowInstances(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/instances?pagination.filter.field=AS&pagination.filter.type=CONTAINS&pagination.filter.val=${workflow}`,{})
        if (resp.ok) {
            let json = await resp.json()
            console.log(json)
            return json.instances.edges
        } else {
            await handleError('list instances', resp, 'listInstances')
        }
    } catch(e) {
        throw new Error(`Failed to list instances: ${e.message}`)
    }
}

export async function WorkflowStateMillisecondMetrics(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/workflows/${workflow}/state-milliseconds`, {})
        if (resp.ok) {
            let json = await resp.json()
            console.log(json, "TODO return proper metrics")   
        } else {
            await handleError("unable to get state metrics", resp, "getWorkflowMetrics")
        }
    } catch(e) {
        throw new Error(`${e.message}`)
    }
}

export async function WorkflowVariables(fetch, namespace, workflow, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/workflow-variables/workflow/${workflow}`, {})
        if(resp.ok) {
            let json = await resp.json()
            if(Array.isArray(json.variables.edges)){
                if(json.variables.edges.length > 0) {
                    return json.variables.edges
                }
            }
            return []
        } else {
            await handleError('fetch variables', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`Failed to fetch variables: ${e.message}`)
    }
}

export async function WorkflowSetVariable(fetch, namespace, workflow, name, val, handleError) {
    try {
        let resp = await fetch(`/vars/namespaces/${namespace}/workflows/${workflow}/vars/${name}`, {
            method: "PUT",
            body: val
        })
        if (resp.ok) {
            return true
        } else {
            await handleError('set variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`Failed to set variable: ${e.message}`)
    }
}


export async function WorkflowDeleteVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/workflows/${workflow}/vars/${name}`,{
            method: "DELETE"
        })
        if(resp.ok) {
            return
        } else {
            await handleError('delete variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`Failed to delete variable: ${e.message}`)
    }
}

export async function WorkflowGetVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/vars/namespaces/${namespace}/workflows/${workflow}/vars/${name}`, {})
        if(resp.ok) {
            return await resp.text()
        } else {
            await handleError('get variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`Failed to get variable: ${e.message}`)
    }
}

export async function WorkflowDownloadVariable(fetch, namespace, workflow, name, handleError) {
    try {
        let resp = await fetch(`/vars/namespaces/${namespace}/workflows/${workflow}/vars/${name}`, {})
        if(resp.ok) {
            return {
                contentType: resp.headers.get("content-type"),
                blob: await resp.blob()
             }
        } else {
            await handleError('get variable', resp, 'getVariables')
        }
    } catch(e) {
        throw new Error(`Failed to get variable: ${e.message}`)
    }
}