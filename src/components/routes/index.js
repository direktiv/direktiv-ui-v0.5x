import {Route, Redirect, useLocation, useHistory} from "react-router-dom"
import  DashboardPage from '../dashboard-page'
import  EventsPage from '../events-page'
import  InstancePage from '../instance-page'
import  JQPlaygroundPage from '../jqplayground'
import  SettingsPage from '../settings-page'
import  WorkflowsPage from '../workflows-page'
import  WorkflowPage from '../workflow-page'
import EnvrionmentPage from "../environment-page"
import Functions from "../functions"
import Services from "../services"
import Revision from "../revision"
import Flowy from "../flowy"

export default function Routes(props) {
    const {namespace, namespaces, noNamespaces} = props
    const location = useLocation()
    const history = useHistory()

    if(namespaces === null) {
      return ""
    }

    if(namespace === "" && namespaces.length === 0 && location.pathname !== "/" && location.pathname !== "/jq/playground" && location.pathname !== "/global/functions") {
        // there is no namespaces handle if they get sent a link when they have access to no namespaces or can get a namespace but its in the path
        history.push("/")
    } 
    return(
        <>
            <Route exact path="/f/flowy" component={Flowy}/>
            <Route exact path="/functions/global" component={Functions}/>
            <Route exact path="/functions/global/:service" component={Services}/>
            <Route exact path="/functions/global/:service/:revision" component={Revision}/>
            <Route path="/jq/playground" component={JQPlaygroundPage} />
            <Route path="/i/:namespace/:workflow/:instance" component={InstancePage} />
            <Route exact path="/">
              {
                namespace !== "" ?
                  <Redirect to={`/${namespace}`} from="/" />
                  :
                  <Route exact path="/">
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                      {noNamespaces}
                    </div>
                  </Route>
              }
            </Route>
            <Route exact path="/:namespace" component={DashboardPage} />
            <Route exact path="/:namespace/functions" component={Functions}/>
            <Route exact path="/:namespace/functions/:service" component={Services}/>
            <Route exact path="/:namespace/functions/:service/:revision" component={Revision}/>
            <Route exact path="/:namespace/w" component={WorkflowsPage} />
            <Route exact path="/:namespace/w/:workflow/variables" component={EnvrionmentPage} />
            <Route exact path="/:namespace/w/:workflow/functions/:service" component={Services} />
            <Route exact path="/:namespace/w/:workflow/functions/:service/:revision" component={Revision}/>
            <Route exact path="/:namespace/w/:workflow" component={WorkflowPage} />
            <Route path="/:namespace/i" component={EventsPage} />
            <Route path="/:namespace/s" component={SettingsPage} />
        </>
    )
}