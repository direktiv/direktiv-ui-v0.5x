import React from 'react'
import TileTitle from '../tile-title'
import Breadcrumbs from '../breadcrumbs'
import { useDropzone } from 'react-dropzone'

import PlusCircleFill from 'react-bootstrap-icons/dist/icons/plus-circle-fill'
import CardList from 'react-bootstrap-icons/dist/icons/card-list'
import { FileCode } from 'react-bootstrap-icons'

export default function WorkflowsPage() {
    return (
        <>
            <div className="container">
                <div style={{ flex: "auto" }}>
                    <Breadcrumbs elements={["Workflows"]} />
                </div>
            </div>
            <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }} >
                <div className="container" style={{ flexWrap: "wrap", flex: "auto" }}>
                    <div className="neumorph" style={{ flex: "auto", flexGrow: "4", minWidth: "400px" }}>
                        <TileTitle name="All workflows">
                            <CardList />
                        </TileTitle>
                    </div>
                </div>
                <div className="container" style={{ flexWrap: "wrap", flex: "auto" }}>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Upload workflow file">
                            <FileCode />
                        </TileTitle>
                        <UploadWorkflowForm />
                    </div>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Create new workflow">
                            <PlusCircleFill />
                        </TileTitle>
                        <NewWorkflowForm />
                    </div>
                    <div className="neumorph" style={{ minWidth: "350px" }}>
                        <TileTitle name="Send namespace event">
                            <PlusCircleFill />
                        </TileTitle>
                        <APIInteractionTile />
                    </div>
                </div>
            </div>
        </>
    )
}

function APIInteractionTile() {
    return (
        <div>
            
        </div>
    )
}

function UploadWorkflowForm() {

    return(
        <div>
            <div className="file-form">
                <Basic />
            </div>
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Submit" />
            </div>
        </div>
    )
}

function NewWorkflowForm() {

    return(
        <div style={{ fontSize: "12pt" }}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Name:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <input type="text" placeholder="Workflow name" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: "left" }}>
                            <b>Template:</b>
                        </td>
                        <td style={{ paddingLeft: "10px", textAlign: "left" }}>
                            <select>
                                <option value="0">Basic (noop)</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className="divider-dark" />
            <div>
                <div style={{ textAlign: "left", fontSize: "10pt" }}>
                    <span>
                        Template Preview
                    </span>
                </div>
                <div style={{ marginTop: "10px", backgroundColor: "#252525", borderRadius: "4px", padding: "10px" }}>
                    <code style={{ textAlign: "left" }}>
                        <pre>{"{"}</pre>
                        <pre>    "example": "blah"</pre>
                        <pre>{"}"}</pre>
                    </code>
                </div>
            </div>
            <div className="divider-dark" />
            <div style={{ textAlign: "right" }}>
                <input type="submit" value="Submit" />
            </div>
        </div>
    )
}

function Basic(props) {
    const {acceptedFiles, getRootProps, getInputProps} = useDropzone();
    
    const files = acceptedFiles.map(file => (
      <li key={file.path}>
        {file.path} - {file.size} bytes
      </li>
    ));
  
    return (
      <section className="container">
        <div {...getRootProps({className: 'dropzone'})}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        <aside>
          <h4>Files</h4>
          <ul>{files}</ul>
        </aside>
      </section>
    );
  }