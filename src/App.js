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


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div id="master">
          <div id="content">
            <Router>
              <div id="nav-panel">
                <Navbar />
              </div>
              <div id="main-panel">
                <Switch>
                  <Route exact path="/" component={DashboardPage} />
                  <Route exact path="/w/" component={WorkflowsPage} />
                  <Route exact path="/w/:workflow" component={WorkflowPage} />
                  <Route exact path="/i/" component={EventsPage} />
                  <Route exact path="/i/:instance" component={InstancePage} />
                  <Route exact path="/s/" component={SettingsPage} />
                </Switch>
              </div>
            </Router>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
