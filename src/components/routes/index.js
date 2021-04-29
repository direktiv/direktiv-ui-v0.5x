import {Route, Redirect} from "react-router-dom"
import DashboardPage from '@vorteil/direktiv-ui.dashboard-page'
import EventsPage from '@vorteil/direktiv-ui.events-page'
import InstancePage from '../instance-page'
import JQPlaygroundPage from '@vorteil/direktiv-ui.jqplayground'
import SettingsPage from '@vorteil/direktiv-ui.settings-page'
import WorkflowsPage from '@vorteil/direktiv-ui.workflows-page'
import WorkflowPage from '@vorteil/direktiv-ui.workflow-page'

export default function Routes(props) {
    const {namespace} = props
    return(
        <>
            <Route path="/jq/playground" component={JQPlaygroundPage} />
            <Route path="/i/:namespace/:workflow/:instance" component={InstancePage} />
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
            <Route exact path="/:namespace" component={DashboardPage} />
            <Route exact path="/:namespace/w" component={WorkflowsPage} />
            <Route path="/:namespace/w/:workflow" component={WorkflowPage} />
            <Route path="/:namespace/i" component={EventsPage} />
            <Route path="/:namespace/s" component={SettingsPage} />
        </>
    )
}