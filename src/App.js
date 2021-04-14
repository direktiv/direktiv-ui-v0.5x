import './App.css';
import './style/scrollbar.css';
import './style/custom.css';
import Navbar from './components/nav'
import WorkflowPage from './components/workflow-page'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div id="master">
          <div id="content">
            <div id="nav-panel">
              <Navbar />
            </div>
            <div id="main-panel">
              <WorkflowPage />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
