import {Route, Redirect, useLocation, useHistory} from "react-router-dom"
import  DashboardPage from '../dashboard-page'
import  EventsPage from '../events-page'
import  JQPlaygroundPage from '../jqplayground'
import  SettingsPage from '../settings-page'
import  WorkflowPage from '../workflow-page'
import EnvrionmentPage from "../environment-page"
import Functions from "../functions"
import Services from "../services"
import Revision from "../revision"
import Flowy from "../flowy"
import Explorer from "../workflows-page/index2"
import Instance from "../instance-page/index2"
import Login from "../login"

export default function Routes(props) {
    const {namespace, namespaces, noNamespaces} = props
    const location = useLocation()
    const history = useHistory()

    if(namespaces === null) {
      return ""
    }

    if(namespace === "" && namespaces.length === 0 && location.pathname !== "/" && location.pathname !== "/jq/playground" && location.pathname !== "/functions/global") {
        // there is no namespaces handle if they get sent a link when they have access to no namespaces or can get a namespace but its in the path
        history.push("/")
    } 

    return(
        <>
            <Route exact path="/f/flowy" component={Flowy}/>
            <Route exact path="/functions/global" component={Functions}/>
            <Route exact path="/functions/global/:service" component={Services}/>
            <Route exact path="/functions/global/:service/:revision" component={Revision}/>
            <Route exact path="/jq/playground" component={JQPlaygroundPage} />
            <Route exact path="/n/:namespace/i/:id" component={Instance} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/">
              {
                namespace !== "" ?
                  <Redirect to={`/n/${namespace}`} from="/" />
                  :
                  <Route exact path="/">
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12pt" }}>
                      {noNamespaces}
                    </div>
                  </Route>
              }
            </Route>
            <Route exact path="/n/:namespace" component={DashboardPage} />
            <Route exact path="/n/:namespace/functions" component={Functions}/>
            <Route exact path="/n/:namespace/functions/:service" component={Services}/>
            {/* <Route exact path="/n/:namespace/functions/:service/wf/*" component={Services}/> */}
            <Route exact path="/n/:namespace/flowy" component={Flowy}/>
            <Route exact path="/n/:namespace/flowy/*" component={Flowy}/>

            <Route exact path="/n/:namespace/functions/:service/:revision" component={Revision}/>
            <Route exact path="/n/:namespace/explorer" component={Explorer} />


            <Route exact path="/n/:namespace/explorer/*" component={Explorer} />
            <Route exact path="/n/:namespace/explorer/*" component={EnvrionmentPage} />
            <Route exact path="/n/:namespace/explorer/*" component={Services} />
            <Route exact path="/n/:namespace/explorer/*" component={Revision} />


            <Route exact path="/n/:namespace/w/:workflow/functions/:service" component={Services} />
            <Route exact path="/n/:namespace/w/:workflow/functions/:service/:revision" component={Revision}/>
            <Route exact path="/n/:namespace/w/:workflow" component={WorkflowPage} />
            <Route exact path="/n/:namespace/i" component={EventsPage} />
            <Route exact path="/n/:namespace/s" component={SettingsPage} />
        </>
    )
}