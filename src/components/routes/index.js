import {Route, Redirect} from "react-router-dom"
import  DashboardPage from '../dashboard-page'
import  EventsPage from '../events-page'
import  InstancePage from '../instance-page'
import  JQPlaygroundPage from '../jqplayground'
import  SettingsPage from '../settings-page'
import  WorkflowsPage from '../workflows-page'
import  WorkflowPage from '../workflow-page'

export default function Routes(props) {
    const {namespace} = props
    console.log('hello test routes')
    return(
        <>
            <Route path="/jq/playground" component={JQPlaygroundPage.default} />
            <Route path="/i/:namespace/:workflow/:instance" component={InstancePage.default} />
            <Route exact path="/">
              {
                namespace !== "" ?
                  <Redirect to={`/${namespace}`} from="/" />
                  :
                  <Route exact path="/">
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                      You are not a part of any namespaces! Create a namespace to continue using Direktiv.
                    </div>
                  </Route>
              }
            </Route>
            <Route exact path="/:namespace" component={DashboardPage.default} />
            <Route exact path="/:namespace/w" component={WorkflowsPage.default} />
            <Route path="/:namespace/w/:workflow" component={WorkflowPage.default} />
            <Route path="/:namespace/i" component={EventsPage.default} />
            <Route path="/:namespace/s" component={SettingsPage.default} />
        </>
    )
}