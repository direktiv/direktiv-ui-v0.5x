
import { BrowserRouter as Router, Switch} from "react-router-dom";
import Navbar from './components/nav'

import NotificationSystem, { sendNotification } from './components/notifications/index.js'
import { useState } from 'react';
import MainContext from './context'
import { useContext } from 'react';
import { useCallback, useEffect } from 'react';
import {fetchNs, HandleError} from './util-funcs'
import Routes from './components/routes'

export const  bcRoutes = [
  {
      path: '/:namespace',
      breadcrumb: "",
  },
  {
      path: '/:namespace/w',
      breadcrumb: 'Workflows'
  },
  {
      path: '/:namespace/i',
      breadcrumb: 'Instances'
  },
  {
      path: '/:namespace/s',
      breadcrumb: 'Settings'
  },
  {
      path: "/jq",
      breadcrumb: "",
  },
  {
      path: "/jq/playground",
      breadcrumb: "JQ Playground"
  }
]

function Content() {
  const context = useContext(MainContext)

  const [namespace, setNamespace] = useState("")
  const [load, setLoad] = useState(false)
  const [namespaces, setNamespaces] = useState(null)

  const netch = useCallback((path, opts) => {
    return fetch(`${context.SERVER_BIND}${path}`, opts);
  }, [context.SERVER_BIND])


  const fetchNamespaces = useCallback((loaded, val) => {
    async function fd() {
      setLoad(true)
      try {
          let namespacesObj = await fetchNs(netch, loaded, setLoad, val, HandleError)
          setLoad(false)
          setNamespace(namespacesObj.namespace)
          setNamespaces(namespacesObj.namespaces)
      } catch (e) {
        sendNotification("Failed to fetch namespaces", e.message, 0)
        setLoad(false)
      }
    }
    fd()
  }, [netch])

  // if namespaces is empty and keycloak has been initialized do things
  useEffect(() => {
    if (namespaces === null) {
      fetchNamespaces(true)
    }
  }, [namespaces, fetchNamespaces])

  return (

    <MainContext.Provider value={{
      ...context,
      fetch: netch,
      namespace: namespace,
      setNamespace: setNamespace,
      namespaces: namespaces,
      setNamespaces: setNamespaces,
      fetchNamespaces: fetchNamespaces,
      handleError: HandleError,
      bcRoutes: bcRoutes,
    }}>
      {!load ?

        <div id="content">
          <Router>
            <div id="nav-panel">
              {namespaces !== null ?
              <Navbar fetchNamespaces={fetchNamespaces} namespaces={namespaces} setNamespaces={setNamespaces} namespace={namespace} setNamespace={setNamespace} />
            :""}
              </div>
            <div id="main-panel">
              <Switch>
                <Routes namespace={namespace}/>
              </Switch>
            </div>
          </Router>
        </div>
        :
        <></>}
      <NotificationSystem />

    </MainContext.Provider>

  )
}


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div id="master">
            <Content />
        </div>
      </header>
    </div>
  );
}

export default App;
