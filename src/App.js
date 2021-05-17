
import { BrowserRouter as Router, Switch} from "react-router-dom";
import Navbar from './components/nav'

import NotificationSystem, { sendNotification } from './components/notifications/index.js'
import { useState } from 'react';
import MainContext from './context'
import { useContext } from 'react';
import { useCallback, useEffect } from 'react';
import Modal from 'react-modal'
import {fetchNs, HandleError} from './util-funcs'
import Routes from './components/routes'

console.log(window.location)
Modal.setAppElement("#root")

export function CheckPerm() {
  return true
}

const InstanceInteractions = (namespace, workflow, instance) => [
  {
    title: `Get details for '${namespace}/${workflow}/${instance}'`,
    description: `The following endpoint allows you to get the details about a certain instance
    
${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}

The request returns details about the instance. Input and Output are base64 encoded.

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
    description: `The following endpoint gets the logs for a certain instance
    
${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}/logs

The request returns a list of logs

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
    description: `The following endpoint allows you to cancel the instance currently running.
    
${window.location.origin}/api/instances/${namespace}/${workflow}/${instance}`,
    method: "DELETE"
  }
]

const WorkflowInteractions = (namespace, workflow) => [
  {
    title: `Get '${workflow}'`,
    description: `The following endpoint allows you to get the yaml definition for a workflow.
    
${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}

The request returns a json struct which contains 'workflow' which is a base64 encoded version of the YAML workflow.

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
    description: `The following endpoint allows you to update the yaml definition of a workflow.
    
${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}

The request requires a yaml definition of a new workflow to update the previous.

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
    description: `The following endpoint allows you to execute a workflow with a optional input.

${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/execute

The request has an optional input where you can provide any json data.

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
    description: `The following endpoint allows you to toggle a workflow from enabled to disabled. 
        
${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/toggle
        `,
        method: "PUT"
  },
  {
    title: `Get instances for '${workflow}'`,
    description: `The following endpoint allows you to fetch the instances a workflow has created.
    
${window.location.origin}/api/namespaces/${namespace}/workflows/${workflow}/instances/

The request returns a list of instances 

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
    description: `The following endpoint allows you to fetch a list workflows created for this namespace.
    
${window.location.origin}/api/namespaces/${namespace}

The request returns a list of workflows.

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
    description: `The following endpoint allows you to send cloud events to the namespace.
    
${window.location.origin}/api/namespaces/${namespace}/event.
    
The request requires a cloud event json.

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
    description: `The following endpoint allows you to create a workflow.

${window.location.origin}/api/namespaces/${namespace}/workflows

The request requires a yaml definition of a workflow.

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
    description: `The following endpoint allows you to delete a workflow. 
Replace WORKFLOW_NAME with the workflow you wish to delete.

${window.location.origin}/api/namespaces/${namespace}/workflows/WORKFLOW_NAME
    `,
    method: "DELETE"
  },
  {
    title: `Toggle a workflow`,
    description: `The following endpoint allows you to toggle a workflow from enabled to disabled. 
Replace WORKFLOW_NAME with the workflow you wish to toggle.
    
${window.location.origin}/api/namespaces/${namespace}/workflows/WORKFLOW_NAME/toggle
    `,
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
      checkPerm: CheckPerm,
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
