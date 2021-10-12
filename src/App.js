
import { BrowserRouter as Router, Switch} from "react-router-dom";
import Navbar from './components/nav'
import { EventSourcePolyfill } from 'event-source-polyfill';

import NotificationSystem, { sendNotification } from './components/notifications/index.js'
import { useState, useContext, useCallback, useEffect } from 'react';
import MainContext from './context'
import Modal from 'react-modal'
import { HandleError} from './util-funcs'
import Routes from './components/routes'
import {Namespaces} from './api'

Modal.setAppElement("#root")

export function CheckPerm() {
  return true
}

const InstanceInteractions = (namespace, workflow, instance) => [
  {
    title: `Get details for '${instance}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/instances/${instance}`,
    description: `The request returns details about the instance. Input and Output are base64 encoded.

    {
        "namespace": "test",
        "instance": {
          "createdAt": "2021-10-12T02:12:23.311563Z",
          "updatedAt": "2021-10-12T02:12:23.352306Z",
          "id": "6b482c1f-03c2-49cd-93e7-3917c434d0d6",
          "as": "test",
          "status": "complete",
          "errorCode": "",
          "errorMessage": ""
        },
        "invokedBy": "",
        "flow": [
          "helloworld"
        ],
        "workflow": {
          "path": "test",
          "name": "test",
          "parent": "",
          "revision": "1d7ef2c5-ba16-4c41-9084-4697052c0ec7"
        }
      }
`,
    method: "GET"
  },
  {
    title: `Get logs for '${instance}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/instances/${instance}/logs`,
    description: `The request returns a list of logs

    {
        "totalCount": 4,
        "pageInfo": {
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": "eyJpZCI6ImNkYzI3NzhmLWMzYWMtNDU1OC04YWRlLWJjY2U2YWQ0ZWQzNCIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjMxNzc0NloifQ==",
          "endCursor": "eyJpZCI6ImNlYmM2ZDU4LTVjZGYtNDA1Zi05NTcwLWQ1MjM2Y2E3OGI1MyIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjM1MDA4MVoifQ=="
        },
        "edges": [
          {
            "node": {
              "t": "2021-10-12T02:12:23.317746Z",
              "msg": "Preparing workflow triggered by API."
            },
            "cursor": "eyJpZCI6ImNkYzI3NzhmLWMzYWMtNDU1OC04YWRlLWJjY2U2YWQ0ZWQzNCIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjMxNzc0NloifQ=="
          },
          {
            "node": {
              "t": "2021-10-12T02:12:23.335730Z",
              "msg": "Running state logic (step:1) -- helloworld"
            },
            "cursor": "eyJpZCI6IjgwZDAwYzY4LWNiMjktNDBhZC1hNjljLTFjOWU5MTZkN2U5YiIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjMzNTczWiJ9"
          },
          {
            "node": {
              "t": "2021-10-12T02:12:23.341512Z",
              "msg": "Transforming state data."
            },
            "cursor": "eyJpZCI6IjI3Y2ZmYjM2LWQ2YTItNGJiNS1hYjhmLThjMDNiZGMyNjE5NiIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjM0MTUxMloifQ=="
          },
          {
            "node": {
              "t": "2021-10-12T02:12:23.350081Z",
              "msg": "Workflow completed."
            },
            "cursor": "eyJpZCI6ImNlYmM2ZDU4LTVjZGYtNDA1Zi05NTcwLWQ1MjM2Y2E3OGI1MyIsInYiOiIyMDIxLTEwLTEyVDAyOjEyOjIzLjM1MDA4MVoifQ=="
          }
        ],
        "namespace": "test",
        "instance": "6b482c1f-03c2-49cd-93e7-3917c434d0d6"
      }
`,
    method:" GET"
  },
  {
    title: `Cancel '${instance}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/instances/${instance}/cancel`,
    description: `No description required.`,
    method: "DELETE"
  }
]

const WorkflowInteractions = (namespace, workflow) => [
  {
    title: `Get '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/${workflow}`,
    description: `The request returns a json struct which contains 'revision' which has a 'source' field that is a base64 encoded workflow yaml.

    {
        "namespace": "trent",
        "node": {
          "createdAt": "2021-10-10T23:57:17.705020Z",
          "updatedAt": "2021-10-10T23:57:17.705020Z",
          "name": "test2",
          "path": "/test2",
          "parent": "/",
          "type": "workflow",
          "attributes": [],
          "oid": ""
        },
        "revision": {
          "createdAt": "2021-10-11T04:36:10.865057Z",
          "hash": "92049a9c4db789f20300467dadc3e139b680c7e1fa112ab6b5f2c90d96e183ef",
          "source": "c3RhcnQ6CiAgdHlwZTogZXZlbnQKICBldmVudDoKICAgIHR5cGU6IE1pY3Jvc29mdC5TdG9yYWdlLkJsb2JDcmVhdGVkCnN0YXRlczoKICAtIHR5cGU6IG5vb3AKICAgIGlkOiBub29wLWNoZWNrCg=="
        },
        "eventLogging": "",
        "oid": "3db23098-61cf-44a1-a795-8097b181387b"
      }
    `,
    method: "GET"
  },
  {
    title: `Update '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/${workflow}?op=update-workflow`,
    description: `The request requires a yaml definition of a new workflow to update the previous.

id: test
description: "sssss"
states:
  - id: helloworld
    type: noop
    transform: '{ result: "Hello world!" }'
`,
    method: "PUT"
  },
  {
    title: `Execute '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/${workflow}?op=execute`,
    description: `The request has an optional input where you can provide any json data.

{
  "key": "value"
}

The request returns an instance id to allow you to get details about the instance that just ran.

{
    "namespace": "test",
    "instance": "6b482c1f-03c2-49cd-93e7-3917c434d0d6"
  }
`,
    method: "POST"
  },
  {
    title: `Toggle '${workflow}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/${workflow}?op=toggle`,
    description: `No description required.`,
    method: "POST"
  }
]

const NamespaceInteractions = (namespace, path) => [
  // {
  //   title: "Generate an Auth Token",
  //   description: `Generate an authentication token for '${namespace}' which can be created here.\n For any request simply apply the following header to authenticate.\n{\n\t"Authroization": "Bearer AUTH_TOKEN"\n}\n`
  // },
  {
    title: `List Nodes at '${namespace}/${path ? path:""}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/${path ? path: ""}`,
    description: `The request returns a list of nodes which could be a directory or workflow depending on the request.

    {
        "namespace": "test",
        "node": {
          "createdAt": "2021-10-11T22:42:18.737218Z",
          "updatedAt": "2021-10-11T22:42:18.737219Z",
          "name": "",
          "path": "/",
          "parent": "/",
          "type": "directory",
          "attributes": [],
          "oid": ""
        },
        "children": {
          "totalCount": 2,
          "pageInfo": {
            "hasNextPage": false,
            "hasPreviousPage": false,
            "startCursor": "eyJpZCI6IjliNjU3NGJlLWFkZDAtNDgyOS1iMDY4LTFiZDRhNDczMTM3MiIsInYiOiJ0ZXN0In0=",
            "endCursor": "eyJpZCI6IjM1YmUxOTE2LTNhMDQtNDkwMi05MmM3LWY5YmUyNDkwN2Q5YSIsInYiOiJ0ZXN0MiJ9"
          },
          "edges": [
            {
              "node": {
                "createdAt": "2021-10-11T23:53:32.343755Z",
                "updatedAt": "2021-10-11T23:53:32.343756Z",
                "name": "test",
                "path": "/test",
                "parent": "/",
                "type": "workflow",
                "attributes": [],
                "oid": ""
              },
              "cursor": "eyJpZCI6IjliNjU3NGJlLWFkZDAtNDgyOS1iMDY4LTFiZDRhNDczMTM3MiIsInYiOiJ0ZXN0In0="
            },
            {
              "node": {
                "createdAt": "2021-10-11T23:53:44.869690Z",
                "updatedAt": "2021-10-11T23:53:44.869691Z",
                "name": "test2",
                "path": "/test2",
                "parent": "/",
                "type": "workflow",
                "attributes": [],
                "oid": ""
              },
              "cursor": "eyJpZCI6IjM1YmUxOTE2LTNhMDQtNDkwMi05MmM3LWY5YmUyNDkwN2Q5YSIsInYiOiJ0ZXN0MiJ9"
            }
          ]
        }
    }
`,
    method: "GET"
  },
  {
    title: `Send Event to '${namespace}'`,
    url: `${window.location.origin}/api/namespaces/${namespace}/broadcast`,
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
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/PATH_TO_CREATE_WORKFLOW?op=create-workflow`,
    description: `The request requires a yaml definition of a workflow.

id: helloworld
description: "A simple no-op workflow" 
states:
  - id: hello
    type: noop
    transform: '{ result: "Hello World!" }'
    `,
    method: "PUT"
  },
  {
    title: `Delete a workflow`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/PATH_TO_WORKFLOW?op=delete-node`,
    description: `Replace PATH_TO_WORKFLOW with the workflow you wish to delete.`,
    method: "DELETE"
  },
  {
    title: `Toggle a workflow`,
    url: `${window.location.origin}/api/namespaces/${namespace}/tree/PATH_TO_WORKFLOW?op=toggle`,
    description: `Replace PATH_TO_WORKFLOW with the workflow you wish to toggle.`,
    method: "POST"
  }
]

export const  bcRoutes = [
    {
        path: '/n/:namespace/variables',
        breadcrumb: "",
    },
  {
      path: '/n/:namespace',
      breadcrumb: "",
  },
  {
      path: '/n/:namespace/w',
      breadcrumb: 'Workflows'
  },
  {
      path: '/n/:namespace/i',
      breadcrumb: 'Instances'
  },
  {
      path: '/n/:namespace/s',
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
      path: "/n/:namespace/functions",
      breadcrumb: "Knative Services"
  },
  {
      path: "/functions/global",
      breadcrumb: "Knative Services"
  },
  {
      path: "/n/:namespace/w/:workflow/functions",
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
        let namespacesObj = await Namespaces(netch, HandleError, loaded, val)
        setLoad(false)
        setNamespace(namespacesObj.namespace)
        setNamespaces(namespacesObj.namespaces)
      } catch (e) {
        sendNotification("Error:", e.message, 0)
        setLoad(false)
      }
    }
    fd()
  }, [netch])

  // Check if api requires apikey by doing a simple namespace request
  const checkAuth = useCallback(()=>{
    async function fd() {
      try {
        let resp = await netch(`/namespaces`, {
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
        <div id="content" className="nav-panel">
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
