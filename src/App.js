
import { BrowserRouter as Router, Switch} from "react-router-dom";
import Navbar from './components/nav'
import { EventSourcePolyfill } from 'event-source-polyfill';

import NotificationSystem, { sendNotification } from './components/notifications/index.js'
import { useState, useContext, useCallback, useEffect } from 'react';
import MainContext from './context'
import Modal from 'react-modal'
import {fetchNs, HandleError} from './util-funcs'
import Routes from './components/routes'

Modal.setAppElement("#root")

export function CheckPerm() {
  return true
}

const InstanceInteractions = (namespace, workflow, instance) => [
  {
    title: `Get details for '${namespace}/${workflow}/${instance}'`,
    url: `${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}`,
    description: `The request returns details about the instance. Input and Output are base64 encoded.

{
  "id": "test/test/ikENVF",
  "status": "complete",
  "invokedBy": "f84f27c5-488c-46ef-85eb-673da6a37c35",
  "revision": 10,
  "beginTime": {
    "seconds": 1620601680,
    "nanos": 590045000
  },
  "endTime": {
    "seconds": 1620601680,
    "nanos": 606927000
  },
  "flow": [
    "helloworld"
  ],
  "input": "ewogICJpbnB1dCI6ICIiCn0=",
  "output": "eyJyZXN1bHQiOiJIZWxsbyB3b3JsZCEifQ=="
}
`,
    method: "GET"
  },
  {
    title: `Get logs for '${namespace}/${workflow}/${instance}'`,
    url: `${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}/logs`,
    description: `The request returns a list of logs

{
  "workflowInstanceLogs": [
    {
      "timestamp": {
        "seconds": 1620601680,
        "nanos": 593677449
      },
      "message": "Beginning workflow triggered by API."
    },
    {
      "timestamp": {
        "seconds": 1620601680,
        "nanos": 601790929
      },
      "message": "Running state logic -- helloworld:1 (noop)"
    },
    {
      "timestamp": {
        "seconds": 1620601680,
        "nanos": 601799453
      },
      "message": "Transforming state data."
    },
    {
      "timestamp": {
        "seconds": 1620601680,
        "nanos": 611023873
      },
      "message": "Workflow completed."
    }
  ],
  "offset": 0,
  "limit": 10
}
`,
    method:" GET"
  },
  {
    title: `Cancel '${namespace}/${workflow}/${instance}'`,
    url: `${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}`,
    description: `No description required.`,
    method: "DELETE"
  }
]

const WorkflowInteractions = (namespace, workflow) => [
  {
    title: `Get '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}`,
    description: `The request returns a json struct which contains 'workflow' which is a base64 encoded version of the YAML workflow.

{
  "name": "helloworld",
  "revision": 1,
  "active": true,
  "createdAt": {
    "seconds": 1621203025,
    "nanos": 122176000
  },
  "description": "A simple no-op workflow",
  "workflow": "aWQ6IHRlc3QKZGVzY3JpcHRpb246ICIiCnN0YXRlczoKICAtIGlkOiBoZWxsb3dvcmxkCiAgICB0eXBlOiBub29wCiAgICB0cmFuc2Zvcm06ICd7IHJlc3VsdDogIkhlbGxvIHdvcmxkISIgfScK",
  "logToEvents": ""
}
    `,
    method: "GET"
  },
  {
    title: `Update '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}`,
    description: `The request requires a yaml definition of a new workflow to update the previous.

id: test
description: "sssss"
states:
  - id: helloworld
    type: noop
    transform: '{ result: "Hello world!" }'

The request returns the following JSON.

{
  "uid": "f84f27c5-488c-46ef-85eb-673da6a37c35",
  "id": "test",
  "revision": 11,
  "active": true,
  "createdAt": {
    "seconds": 1620598113,
    "nanos": 366473000
  }
}
`,
    method: "PUT"
  },
  {
    title: `Execute '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/execute`,
    description: `The request has an optional input where you can provide any json data.

{
  "key": "value"
}

The request returns an instanceId to allow you to get details about the instance that just ran.

{
  "instanceId": "test/test/ikENVF"
}
`,
    method: "POST"
  },
  {
    title: `Toggle '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/toggle`,
    description: `No description required.`,
    method: "PUT"
  },
  {
    title: `Get instances for '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/instances/`,
    description: `The request returns a list of instances 

{
  "workflowInstances": [
    {
      "id": "test/test3/ikENVF",
      "status": "complete",
      "beginTime": {
        "seconds": 1620601680,
        "nanos": 590045000
      }
    }
  ],
  "offset": 0,
  "limit": 0
}
`,
    method: "GET"

  }
]

const NamespaceInteractions = (namespace) => [
  // {
  //   title: "Generate an Auth Token",
  //   description: `Generate an authentication token for '${namespace}' which can be created here.\n For any request simply apply the following header to authenticate.\n{\n\t"Authroization": "Bearer AUTH_TOKEN"\n}\n`
  // },
  {
    title: `List Workflows in '${namespace}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}`,
    description: `The request returns a list of workflows.

{
  "workflows": [
    {
      "id": "test1",
      "revision": 10,
      "active": true,
      "createdAt": {
        "seconds": 1620598113,
        "nanos": 366473000
      },
      "description": "A simple 'no-op' state that returns 'Hello world!'",
      "logToEvents": ""
    }
  ],
  "offset": 0,
  "limit": 0,
  "total": 1
}
`,
    method: "GET"
  },
  {
    title: `Send Event to '${namespace}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/event`,
    description: `The request requires a cloud event json.

{
  "specversion": "1.0",
  "type": "cloudevent",
  "source": "https://github.com/cloudevents/spec/pull",
  "subject": "123",
  "id": "A234-1234-1234",
  "time": "2018-04-05T17:31:00Z",
  "comexampleextension1": "value",
  "comexampleothervalue": 5,
  "datacontenttype": "application/json",
  "data": {
    "data": "foreventgoeshere"
  }
}
    `,
    method: "POST"
  },
  {
    title: `Create a new Workflow`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows`,
    description: `The request requires a yaml definition of a workflow.

id: helloworld
description: "A simple no-op workflow" 
states:
  - id: hello
    type: noop
    transform: '{ result: "Hello World!" }'
    `,
    method: "POST"
  },
  {
    title: `Delete a workflow`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/WORKFLOW_NAME`,
    description: `Replace WORKFLOW_NAME with the workflow you wish to delete.`,
    method: "DELETE"
  },
  {
    title: `Toggle a workflow`,
    url: `${window.location.origin}/api/namespaces/${namespace}/workflows/WORKFLOW_NAME/toggle`,
    description: `Replace WORKFLOW_NAME with the workflow you wish to toggle.`,
    method: "PUT"
  }
]

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
  },
  {
      path: "/:namespace/functions",
      breadcrumb: "Knative Services"
  },
  {
      path: "/functions/global",
      breadcrumb: "Knative Services"
  },
  {
      path: "/:namespace/w/:workflow/functions",
      breadcrumb: "WorkflowFuncs",
  }
]

function Content() {
  const context = useContext(MainContext)
  const [namespace, setNamespace] = useState("")
  const [load, setLoad] = useState(false)
  const [namespaces, setNamespaces] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const [apiKey, setAPIKey] = useState(localStorage.getItem('apikey'))


  const sseGen = useCallback((path, opts) => {
    if (!opts.headers) {
        opts.headers = { Authorization: `apikey ${apiKey}` }
    } else {
        opts.headers =  {...opts.headers, Authorization: `apikey ${apiKey}`}
    }
    return new EventSourcePolyfill(`${context.SERVER_BIND}${path}`, opts)
  },[context.SERVER_BIND, apiKey])

  const netch = useCallback((path, opts) => {
    if (!opts.headers) {
      opts.headers = { Authorization: `apikey ${apiKey}` }
    } else {
      opts.headers =  {...opts.headers, Authorization: `apikey ${apiKey}`}
    }
    return fetch(`${context.SERVER_BIND}${path}`, opts);
  }, [context.SERVER_BIND, apiKey])


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

  // Check if api requires apikey by doing a simple namespace request
  const checkAuth = useCallback(()=>{
    async function fd() {
      try {
        let resp = await netch(`/namespaces/`, {
          method: "GET"
        })
        if(resp.status === 401) {
          const newAPIKey = prompt("Please Enter APIKey", "");
          setAPIKey(newAPIKey)
          localStorage.setItem('apikey', newAPIKey);
        }
      } catch(e) {
        // ignore catch
      }
    }
    return fd()
  },[netch])

  // if namespaces is empty and keycloak has been initialized do things
  useEffect(() => {
    if (!initialized){
      return
    }

    if (namespaces === null) {
      fetchNamespaces(true)
    }
  }, [namespaces, fetchNamespaces, initialized])

  useEffect(()=> {
    if (!initialized){
      checkAuth().finally(()=>{
        setInitialized(true)
      })
    }
  }, [checkAuth, initialized])


  return (

    <MainContext.Provider value={{
      ...context,
      fetch: netch,
      sse: sseGen,
      namespace: namespace,
      setNamespace: setNamespace,
      namespaces: namespaces,
      setNamespaces: setNamespaces,
      fetchNamespaces: fetchNamespaces,
      handleError: HandleError,
      bcRoutes: bcRoutes,
      checkPerm: CheckPerm,
      workflowButtons: [],
      extraLinks: [],
      permissions: {},
      namespaceInteractions: NamespaceInteractions,
      workflowInteractions: WorkflowInteractions,
      instanceInteractions: InstanceInteractions,
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
                <Routes noNamespaces={"You are not a part of any namespaces! Create a namespace to continue using Direktiv."} namespaces={namespaces} namespace={namespace}/>
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
