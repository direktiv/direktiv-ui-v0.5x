export async function InstanceDetails(fetch, namespace, instance, handleError) {
    try {
        let resp = await fetch(`/flow/namespaces/${namespace}/instances/${instance}`, {
            method: "GET",
        })
        if(resp.ok){
            let json = await resp.json()
            return json
        } else {
            await handleError('get instance details', resp, 'getInstance')
        }
    } catch(e) {
        throw new Error(`Unable to fetch instance: ${e.message}`)
    }
}

export async function InstanceInput(fetch, namespace, instance, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/instances/${instance}/input`, {
            method:"GET"
        })
        if(resp.ok) {
            let json = await resp.json()
            console.log(json, "CHECK")
            return atob(json.data)
        } else {
            await handleError('get instance input', resp, 'getInstance')
        }
    } catch(e) {
        throw new Error(`Unable to get instance input: ${e.message}`)
    }
}

export async function InstanceOutput(fetch, namespace, instance, handleError) {
    try {
        let resp = await fetch(`/namespaces/${namespace}/instances/${instance}/output`, {
            method:"GET"
        })
        if(resp.ok) {
            let json = await resp.json()
            return atob(json.data)
        } else {
            await handleError('get instance output', resp, 'getInstance')
        }
    } catch(e) {
        throw new Error(`Unable to get instance output: ${e.message}`)
    }
}