import './App.css';
import './style/scrollbar.css';
import './style/custom.css';

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Navbar from './components/nav'
import DashboardPage from './components/dashboard-page'
import EventsPage from './components/events-page'
import InstancePage from './components/instance-page'
import SettingsPage from './components/settings-page'
import WorkflowsPage from './components/workflows-page'
import WorkflowPage from './components/workflow-page'
import NotificationSystem from './components/notifications/index.js'
import { useState } from 'react';
import {  ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web';
import keycloak from './keycloak'
import MainContext from './context'
import { useContext } from 'react';
import { useCallback } from 'react';


function AuthenticatedContent() {
  const context = useContext(MainContext)
  const [namespace, setNamespace] = useState("")

  const {initialized} = useKeycloak();

  const authFetch = useCallback((path, opts)=>{
    let jwt = keycloak.idToken;
      if (!opts.headers) {
        opts.headers = { Authorization: `Bearer ${jwt}` };
      } else {
        opts.headers = { ...opts.headers, Authorization: `Bearer ${jwt}` };
      }
      return fetch(`${context.SERVER_BIND}${path}`, opts);
  },[])

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
      setNamespace: setNamespace
    }}>
      <div id="content">
        <Router>
          <div id="nav-panel">
            <Navbar auth={true} email={getEmail()} name={getUsername()} logout={logout} namespace={namespace} setNamespace={namespace} />
          </div>
          {namespace !== "" ? 
            <div id="main-panel">
              <Switch>
                <Route exact path="/" component={DashboardPage} />
                <Route exact path="/w/" component={WorkflowsPage} />
                <Route exact path="/w/:workflow" component={WorkflowPage} />
                <Route exact path="/i/" component={EventsPage} />
                <Route exact path="/i/:namespace/:workflow/:instance" component={InstancePage} />
                <Route exact path="/s/" component={SettingsPage} />
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
  const [namespace, setNamespace] = useState("")

  return(

    <MainContext.Provider value={{
      fetch: fetch,
    }}>
      <div id="content">
        <Router>
          <div id="nav-panel">
            <Navbar namespace={namespace} setNamespace={namespace} />
          </div>
          <div id="main-panel">
            <Switch>
              <Route exact path="/" component={DashboardPage} />
              <Route exact path="/w/" component={WorkflowsPage} />
              <Route exact path="/w/:workflow" component={WorkflowPage} />
              <Route exact path="/i/" component={EventsPage} />
              <Route exact path="/i/:namespace/:workflow/:instance" component={InstancePage} />
              <Route exact path="/s/" component={SettingsPage} />
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
          {process.env.REACT_APP_KEYCLOAK_URL !== undefined ? 
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
