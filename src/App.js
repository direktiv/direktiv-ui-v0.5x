import './App.css';
import './style/scrollbar.css';
import './style/custom.css';

import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import Navbar from './components/nav'
import DashboardPage from './components/dashboard-page'
import EventsPage from './components/events-page'
import InstancePage from './components/instance-page'
import JQPlaygroundPage from './components/jqplayground'
import SettingsPage from './components/settings-page'
import WorkflowsPage from './components/workflows-page'
import WorkflowPage from './components/workflow-page'
import NotificationSystem, { sendNotification } from './components/notifications/index.js'
import { useState } from 'react';
import {  ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web';
import keycloak from './keycloak'
import MainContext from './context'
import { useContext } from 'react';
import { useCallback, useEffect } from 'react';


function AuthenticatedContent() {
  const context = useContext(MainContext)
  const [namespace, setNamespace] = useState("")
  const [namespaces, setNamespaces] = useState(null)
  const {initialized} = useKeycloak();

  const authFetch = useCallback((path, opts)=>{
    let jwt = keycloak.idToken;
      if (!opts.headers) {
        opts.headers = { Authorization: `Bearer ${jwt}` };
      } else {
        opts.headers = { ...opts.headers, Authorization: `Bearer ${jwt}` };
      }
      return fetch(`${context.SERVER_BIND}${path}`, opts);
  },[context.SERVER_BIND])

  const fetchNamespaces = useCallback((load) => {
    async function fd() {
      try {
        let resp = await authFetch('/namespaces/', {
            method: 'GET',
        })
        if (resp.ok) {
            let json = await resp.json()
            if (load){
              // if being linked to it from someone
              if (window.location.pathname.split("/")[1] !== "") {
                // handle instance page as namespace is listed elsewhere
                if(window.location.pathname.split("/")[1] === "i"){
                  setNamespace(window.location.pathname.split("/")[2])
                } else {
                  setNamespace(window.location.pathname.split("/")[1])
                }
              } else {
                if(localStorage.getItem("namespace") !== undefined) {
                    if(localStorage.getItem("namespace") === "" && json.namespaces.length !== 0) {
                        setNamespace(json.namespaces[0].name)
                    } else {
                      let found = false
                      for(let i =0; i < json.namespaces.length; i++) {
                        if(json.namespaces[i].name === localStorage.getItem("namespace")) {
                          found = true
                        }
                      }
                      if(!found){
                        if (json.namespaces.length === 0) {
                          sendNotification(`You are not a part of any namespaces! Create a namespace to continue using Direktiv.`)
                          setNamespace("")
                          localStorage.setItem("namespace", "")
                        } else {
                          sendNotification(`'${localStorage.getItem("namespace")}' does not exist in list changing to '${json.namespaces[0].name}'`,0)
                          setNamespace(json.namespaces[0].name)
                          localStorage.setItem("namespace", json.namespaces[0].name)
                        }
                      } else {
                        setNamespace(localStorage.getItem("namespace"))
                      }
                    }
                } else {
                    setNamespace(json.namespaces[0].name)
                }
              }
            }

            let namespaces = [];
            for (let i = 0; i < json.namespaces.length; i++) {
              namespaces.push(json.namespaces[i].name)
            }

            setNamespaces(namespaces)
        } else {
            throw new Error(await resp.text())
        }
    } catch(e) {
        sendNotification("Failed to fetch namespaces", e.message, 0)
    }
    }
    fd()
  },[authFetch])

  // if namespaces is empty and keycloak has been initialized do things
  useEffect(()=>{
      if(namespaces === null && initialized) {
          fetchNamespaces(true)
      }
  },[namespaces, fetchNamespaces, initialized])

  if (!initialized) {
    return ""
  }

  function getJWT() {
    return keycloak.idToken
  }

  function getUsername() {
    return keycloak.idTokenParsed["preferred_username"]
  }

  function getEmail() {
    return keycloak.idTokenParsed["email"]
  }

  function logout() {
    keycloak.logout()
  }

  return(
    <MainContext.Provider value={{
      ...context,
      getJWT: getJWT,
      getUsername: getUsername,
      fetch: authFetch,
      namespace: namespace,
      setNamespace: setNamespace,
      namespaces: namespaces,
      setNamespaces: setNamespaces,
      fetchNamespaces: fetchNamespaces,
    }}>
      <div id="content">
        <Router>
          <div id="nav-panel">
            {namespaces === null ? ""
            :
            <Navbar auth={true} email={getEmail()} fetchNamespaces={fetchNamespaces} name={getUsername()} namespaces={namespaces} setNamespaces={setNamespaces} logout={logout} namespace={namespace} setNamespace={namespace} />
            }
            </div>
          {namespace !== "" ? 
            <div id="main-panel">
              <Switch>
                <Route exact path="/jq/playground" component={JQPlaygroundPage} />
                <Route exact path="/i/:namespace/:workflow/:instance" component={InstancePage} />
                <Route exact path="/">
                  <Redirect to={`/${namespace}`} from="/" />
                </Route>
                <Route exact path="/:namespace" component={DashboardPage} />
                <Route exact path="/:namespace/w/" component={WorkflowsPage} />
                <Route exact path="/:namespace/w/:workflow" component={WorkflowPage} />
                <Route exact path="/:namespace/i/" component={EventsPage} />
                <Route exact path="/:namespace/s/" component={SettingsPage} />
              </Switch>
            </div>
            :
            ""
          }
        </Router>
      </div>
      <NotificationSystem/>
    </MainContext.Provider>
  )
}

function Content() {
  const context = useContext(MainContext)

  const [namespace, setNamespace] = useState("")
  const [namespaces, setNamespaces] = useState(null)

  const netch = useCallback((path, opts)=>{
      return fetch(`${context.SERVER_BIND}${path}`, opts);
  },[context.SERVER_BIND])
  

  const fetchNamespaces = useCallback((load, val) => {
    async function fd() {
      try {
        let resp = await netch('/namespaces/', {
            method: 'GET',
        })
        if (resp.ok) {
          let newNamespace = ""
          let json = await resp.json()
            if (load){
              // 1st. check if namespace is in the pathname 
              if(window.location.pathname.split("/")[1] !== "") {
                // handle if pathname is /i as its a different route
                if(window.location.pathname.split("/")[1] === "i") {
                  console.log('hello')
                  newNamespace = window.location.pathname.split("/")[2]
                } else {
                  console.log('hello2')
                  newNamespace = window.location.pathname.split("/")[1]
                }
              }
              // if newNamespace isn't found yet try other options
              if (newNamespace === "") {
                // if its in storage
                if (localStorage.getItem("namespace") !== undefined ) {
                  // if the value in storage is an empty string
                  if(localStorage.getItem("namespace") === "") {
                    // if the json namespaces array is greater than 0 set it to the first
                    if(json.namespaces.length > 0) {
                      newNamespace = json.namespaces[0].name
                    }
                  } else {
                    let found = false
                    // check if the namespace previously stored in localstorage exists in the list
                    for(let i=0; i < json.namespaces.length; i++) {
                      if(json.namespaces[i].name === localStorage.getItem("namespace")) {
                        found = true
                        newNamespace = localStorage.getItem("namespace")
                        break
                      }
                    }

                    if(!found) {
                      // check if json array is greater than 0 to set to the first
                      if(json.namespaces.length > 0) {
                        newNamespace = json.namespaces[0].name
                        localStorage.setItem("namespace", json.namespaces[0].name)
                        sendNotification("Namespace does not exist", `Changing to ${json.namespaces[0].name}`, 0)
                      } 
                    }
                  }
                } else {
                  // if the json namespace array is greater than 0 set it to the first as no other options is valid
                  if(json.namespaces.length > 0) {
                    newNamespace = json.namespaces[0].name
                  }
                }                
              }
            }
            let namespacesn = [];
            for (let i = 0; i < json.namespaces.length; i++) {
              namespacesn.push(json.namespaces[i].name)
            }
            console.log(newNamespace, "NEW NAMESPACE :)")
            if(newNamespace === "" && val) {
              newNamespace = val
            }
            setNamespace(newNamespace)
            setNamespaces(namespacesn)
        } else {
            throw new Error(await resp.text())
        }
    } catch(e) {
      console.log(e)
        sendNotification("Failed to fetch namespaces", e.message, 0)
    }
    }
    fd()
  },[netch])

    // if namespaces is empty and keycloak has been initialized do things
    useEffect(()=>{
      if(namespaces === null) {
          fetchNamespaces(true)
      }
  },[namespaces, fetchNamespaces])
  
  return(

    <MainContext.Provider value={{
      ...context,
      fetch: netch,
      namespace: namespace,
      setNamespace: setNamespace,
      namespaces: namespaces,
      setNamespaces: setNamespaces,
      fetchNamespaces: fetchNamespaces,
    }}>
      <div id="content">
        <Router>
          <div id="nav-panel">
            {namespaces !== null ?
              <Navbar fetchNamespaces={fetchNamespaces} namespaces={namespaces} setNamespaces={setNamespaces} namespace={namespace} setNamespace={setNamespace}/>
              :
              ""
            }
            </div>
          <div id="main-panel">
            <Switch>
                 <>
                  <Route exact path="/jq/playground" component={JQPlaygroundPage} />
                  <Route exact path="/i/:namespace/:workflow/:instance" component={InstancePage} />
                  <Route exact path="/">
                    {
                      namespace !== "" ? 
                      <Redirect to={`/${namespace}`} from="/" />
                      :
                      <Route exact path="/">
                        <div>hello</div>  
                      </Route>
                    }
                  </Route>
                  <Route exact path="/:namespace" component={DashboardPage} />
                  <Route exact path="/:namespace/w/" component={WorkflowsPage} />
                  <Route exact path="/:namespace/w/:workflow" component={WorkflowPage} />
                  <Route exact path="/:namespace/i/" component={EventsPage} />
                  <Route exact path="/:namespace/s/" component={SettingsPage} />
                </>
            </Switch>
          </div>
        </Router>
      </div>
    </MainContext.Provider>

  )
}


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div id="master">
          {process.env.REACT_APP_KEYCLOAK_URL !== undefined || window.__PUBLIC_KEYCLOAK_URL__ !== "KEYCLOAK-URL" ? 
            <ReactKeycloakProvider initOptions={{onLoad: "login-required", checkLoginIframe: false}}  authClient={keycloak}>
              <AuthenticatedContent/> 
            </ReactKeycloakProvider> 
            :
            <Content/>
          }
        </div>
      </header>
    </div>
  );
}

export default App;
