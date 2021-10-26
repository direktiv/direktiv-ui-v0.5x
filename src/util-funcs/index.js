import React from "react"
import  { sendNotification } from "../components/notifications"

export const ResourceRegex = new RegExp("^[a-z][a-z0-9._-]{1,34}[a-z0-9]$");

export async function HandleError(summary, resp, perm) {
    const contentType = resp.headers.get('content-type');
    
    if (resp.status === 405) {
        // this shouldnt happen in the UI
        throw new Error(`${summary}: method is not allowed`)
    } else if(resp.status === 409) {
        throw new Error(`${summary}: object already exists`)
    }

    if(resp.status !== 403) {
        if (!contentType || !contentType.includes('application/json')) {
            let text = await resp.text()
            throw new Error (`${summary}: ${text}`)
        } else {
          if(resp.headers.get('grpc-message')) {
            throw new Error(`${summary}: ${resp.headers.get('grpc-message')}`)
          } else {
            let text = (await resp.json()).Message
            throw new Error (`${summary}: ${text}`)
          }
      }
     } else {
        throw new Error(`You are unable to '${summary}', contact system admin to grant '${perm}'.`)
     }

}

export function NoResults() {

  return(
      <div style={{textAlign:"center", fontSize:"12pt"}}>
          No results are found.
      </div>
  )
}
export function validateName(name, label) {
    if (!name) {
      return `${label} can not be empty`;
    }
  
    if (name.length < 3) {
      return `${label} must be atleast three characters long`;
    }
  
    if (name.match(/^\d/)) {
      return `${label} must start with lowercase letter`;
    }
  
    if (!ResourceRegex.test(name)) {
      return `${label} must be less than 36 characters and may only use lowercase letters, numbers, and “-_”`;
    }
    return null;
}

export function CopyToClipboard(s) {
    if(!navigator.clipboard) {
      sendNotification("Copy-Error", "Browser does not support copy to clipboard", 0)
      return
    }

    navigator.clipboard.writeText(s).then(()=>{
      sendNotification("Copy", "Copied text to the clipboard", 0)
    }).catch(err =>{
      sendNotification("Copy-Error", "Copied text to the clipboard", 0)
    })
}

export async function fetchNs(fetch, load, setLoad, val, handleError) {
    setLoad(true)
    try {
      let newNamespace = ""
      let namespaces = []
      let resp = await fetch('/namespaces', {
        method: 'GET',
      })
  
      if(resp.ok) {
        let json = await resp.json()
        // if namespaces exist 
        if(json.edges){
          // if initial load
          if(load){
            // if pathname isnt jqplayground check if namespace is provided
            if(window.location.pathname !== "/jq/playground" && window.location.pathname.includes("/functions/global") ) {
              // 1st. check if namespace is in the pathname 
              if (window.location.pathname.split("/")[1] !== "") {
                // handle if pathname is /i as its a different route
                if (window.location.pathname.split("/")[1] === "i") {
                  newNamespace = window.location.pathname.split("/")[2]
                } else {
                  newNamespace = window.location.pathname.split("/")[1]
                }
  
                // check if namespace exists here if not redirect back to /
                let f = false
                  for (let i = 0; i < json.edges.length; i++) {
                    if (json.edges[i].node.name === newNamespace) {
                      f = true
                    }
                  }
  
                if (!f) {
                  // need a better solution as keycloak forces reload of the page again.
                  window.location.pathname = "/"
                  return
                }
              }
            }
  
                // if newNamespace isn't found yet try other options
                if (newNamespace === "") {
                  // if its in storage
                  if (localStorage.getItem("namespace") !== undefined) {
  
                    // if the value in storage is an empty string
                    if (localStorage.getItem("namespace") === "") {
  
                      // if the json namespaces array is greater than 0 set it to the first
                      if (json.edges.length > 0) {
                        newNamespace = json.edges[0].node.name
                      }
                    } else {
  
                      let found = false
                      // check if the namespace previously stored in localstorage exists in the list
                      for (let i = 0; i < json.edges.length; i++) {
                        if(json.edges[i] !== null) {
                          if (json.edges[i].node.name === localStorage.getItem("namespace")) {
                            found = true
                            newNamespace = localStorage.getItem("namespace")
                            break
                          }
                        }
                      }
                      if (!found) {
                        // check if json array is greater than 0 to set to the first
                        if (json.edges.length > 0) {
                          newNamespace = json.edges[0].node.name
                          localStorage.setItem("namespace", json.edges[0].node.name)
                          sendNotification("Namespace does not exist", `Changing to ${json.edges[0].node.name}`, 0)
                        }
                      }
                    }
                  } else {
                    // if the json namespace array is greater than 0 set it to the first as no other options is valid
                    if (json.edges.length > 0) {
                      newNamespace = json.edges[0].node.name
                    }
                  }
                }
              }
              if (newNamespace === "" && val) {
                newNamespace = val
              }
              for (let i = 0; i < json.edges.length; i++) {
                namespaces.push(json.edges[i].node.name)
              }
        }
        return {namespaces: namespaces, namespace: newNamespace}
      } else {
        await handleError('fetch namespaces', resp)
      }
    } catch(e) {
      sendNotification("Failed to fetch namespaces", e.message, 0)
      setLoad(false)
    }
  }
  

  
// New regex patterns to match values against
export const PrimaryRegex = new RegExp("^(([a-z][a-z0-9_-]*[a-z0-9])|([a-z]))$")
export const NameRegx = new RegExp("^(([a-z][a-z0-9_-]*[a-z0-9])|([a-z]))$")
export const VarRegex = new RegExp("^(([a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9])|([a-zA-Z]))$")

export function validateAgainstPrimaryRegex(str, label) {

  if (PrimaryRegex.test(str)) {
    // str matches regex pattern, return without error
    return 
  }

  return `${label} must container only lower-case alphanumeric characters, underscores, and dashes, must start with an alphabetic character, and must not end with '_' or '-'`

}

export function validateAgainstNameRegex(str, label) {

  if (NameRegx.test(str)) {
    // str matches regex pattern, return without error
    return 
  }

  return `${label} must container only lower-case alphanumeric characters, underscores, and dashes, must start with an alphabetic character, and must not end with '_' or '-'`

}

export function validateAgainstVariableRegex(str, label) {

  if (VarRegex.test(str)) {
    // str matches regex pattern, return without error
    return 
  }

  return `${label} must container only alphanumeric characters, underscores, and dashes, must start with an alphabetic character, and must not end with '_' or '-'`

}

// Returns bool = true if returned error has the follow properities
// 'type' : 'error'
// 'error.message' : 'message'
export function isBodyStreamError(err) {
  if (!err || !err.type || !err.error || !err.error.message) {
    return false
  }
  
  if ( err.type === "error" && err.error.message === "Error in body stream") {
    return true
  }

  return false
}