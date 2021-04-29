import React from "react"
import  { sendNotification } from '@vorteil/direktiv-ui.notifications'

export const ResourceRegex = new RegExp("^[a-z][a-z0-9._-]{1,34}[a-z0-9]$");



export function NoResults() {

  return(
      <div style={{textAlign:"center"}}>
          No results are found.
      </div>
  )
}
export function validateName(name, label) {
    if (!name || name === "") {
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
    // s = document.getElementById(s).innerHTML;               
   
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

export async function fetchNs(fetch, load, setLoad, val) {
    setLoad(true)
    try {
      let newNamespace = ""
      let namespaces = []
      let resp = await fetch('/namespaces/', {
        method: 'GET',
      })
  
      if(resp.ok) {
        let json = await resp.json()
        // if namespaces exist 
        if(json.namespaces){
          // if initial load
          if(load){
            // if pathname isnt jqplayground check if namespace is provided
            if(window.location.pathname !== "/jq/playground") {
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
                  for (let i = 0; i < json.namespaces.length; i++) {
                    if (json.namespaces[i].name === newNamespace) {
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
                      if (json.namespaces.length > 0) {
                        newNamespace = json.namespaces[0].name
                      }
                    } else {
  
                      let found = false
                      // check if the namespace previously stored in localstorage exists in the list
                      for (let i = 0; i < json.namespaces.length; i++) {
                        if (json.namespaces[i].name === localStorage.getItem("namespace")) {
                          found = true
                          newNamespace = localStorage.getItem("namespace")
                          break
                        }
                      }
  
                      if (!found) {
  
                        // check if json array is greater than 0 to set to the first
                        if (json.namespaces.length > 0) {
  
                          newNamespace = json.namespaces[0].name
                          localStorage.setItem("namespace", json.namespaces[0].name)
                          sendNotification("Namespace does not exist", `Changing to ${json.namespaces[0].name}`, 0)
                        }
                      }
                    }
                  } else {
                    // if the json namespace array is greater than 0 set it to the first as no other options is valid
                    if (json.namespaces.length > 0) {
  
                      newNamespace = json.namespaces[0].name
                    }
                  }
                }
              }
  
              if (newNamespace === "" && val) {
  
                newNamespace = val
              }
              for (let i = 0; i < json.namespaces.length; i++) {
    
                namespaces.push(json.namespaces[i].name)
              }
        }
  
        return {namespaces: namespaces, namespace: newNamespace}
      
      } else {
        if (resp.status === 400) {
          let json = await resp.json()
          throw new Error(json.Message)
        } else {
          throw new Error(`response code was ${resp.status}`)
        }
      }
    } catch(e) {
      sendNotification("Failed to fetch namespaces", e.message, 0)
      setLoad(false)
    }
  }
  