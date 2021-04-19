import React, { useContext, useState, useCallback, useEffect } from 'react'
import Breadcrumbs from '../breadcrumbs'
import Editor from "../workflow-page/editor"
import MainContext from '../../context'



import TileTitle from '../tile-title'
import { IoEaselOutline, IoList, IoPencil, IoPieChartSharp, IoSave, IoSaveOutline, IoPlaySharp, IoChevronForwardOutline } from 'react-icons/io5'

import { sendNotification } from '../notifications/index.js'
import { ArrowLeft } from 'react-bootstrap-icons'

const cheatSheetMap = [
    {
        example: ".",
        tip: "unchanged input",
        filter: ".",
        json: '{ "foo": { "bar": { "baz": 123 } } }',
    },
    {
        example: ".foo, .foo.bar, .foo?",
        tip: "value at key",
        filter: ".foo",
        json: '{"foo": 42, "bar": "less interesting data"}',
    },
    {
        example: ".[], .[]?, .[2], .[10:15]",
        tip: "array operation",
        filter: ".foo[1]",
        json:
            '{"foo": [{"name":"JSON", "good":true}, {"name":"XML", "good":false}]}',
    },
    {
        example: "[], {}",
        tip: "array/object construction",
        filter: "{user, title: .titles[]}",
        json: '{"user":"stedolan","titles":["JQ Primer", "More JQ"]}',
    },
    {
        example: "length",
        tip: "length of a value",
        filter: ".foo[] | length",
        json: '{"foo": [[1,2], "string", {"a":2}, null]}',
    },
    {
        example: "keys",
        tip: "keys in an array",
        filter: "keys",
        json: '{"abc": 1, "abcd": 2, "Foo": 3}',
    },
    {
        example: ",",
        tip: "feed input into multiple filters",
        filter: ".foo, .bar",
        json: '{ "foo": 42, "bar": "something else", "baz": true}',
    },
    {
        example: "|",
        tip: "pipe output of one filter to the next filter",
        filter: ".foo[] | .name",
        json:
            '{"foo": [{"name":"JSON", "good":true}, {"name":"XML", "good":false}]}',
    },
    {
        example: "select(foo)",
        tip: "input unchanged if foo returns true",
        filter: "map(select(. >= 2))",
        json: '{"a": 1, "b": 2, "c": 4, "d": 7}',
    },
    {
        example: "map(foo)",
        tip: "invoke filter foo for each input",
        filter: "map(.+1)",
        json: '{"a": 1, "b": 2, "c": 3}',
    },
    {
        example: "if-then-else-end",
        tip: "conditionals",
        filter:
            'if .foo == 0 then "zero" elif .foo == 1 then "one" else "many" end',
        json: '{"foo": 2}',
    },
    {
        example: "(foo)",
        tip: "string interpolation",
        filter: '"The input was \\(.input), which is one less than \\(.input+1)"',
        json: '{"input": 42}',
    },
];

export default function JQPlaygroundPage() {
    const {fetch} = useContext(MainContext)
    const [jqInput, setJQInput] = useState("{\n  \n}")
    const [jqFilter, setJQFilter] = useState(".")
    const [jqOutput, setJQOutput] = useState("")
    const [fetching, setFetching] = useState(false)



    const executeJQ = useCallback((input, filter) => {
        if (fetching) {
            return
        }
        setFetching(true)
        async function execJQ() {
            let rBody = JSON.stringify({
                query: `${filter}`,
                input: JSON.parse(input),
            });

            try {
                let resp = await fetch(`/jq-playground`, {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json",
                        "Content-Length": rBody.length,
                    },
                    body: rBody
                })

                if (!resp.ok) {
                    throw await resp.text()
                } else {
                    let jqOut = await resp.text();
                    setJQOutput(jqOut)
                }
            } catch (e) {
                sendNotification(`Invalid JQ Command ${e}`, 0)
            }
        }
        execJQ().finally(() => { setFetching(false) })
    }, [fetching])



    const CheatSheetTable = () => {
        let arr = [];
        for (let i = 0; i < cheatSheetMap.length; i++) {
            arr.push(
                <div className="cheatsheet-entry">
                    <div className="cheatsheet-example">
                        {cheatSheetMap[i].example}
                    </div>
                    <div className="cheatsheet-tip">
                        {cheatSheetMap[i].tip}
                    </div>
                    <div className="cheatsheet-btn">
                        <div style={{ flexGrow: 1 }} className="button jq-button" onClick={() => { 
                            setJQInput(cheatSheetMap[i].json)
                            setJQFilter(cheatSheetMap[i].filter)
                            executeJQ(cheatSheetMap[i].json, cheatSheetMap[i].filter)
                         }}>
                            Load Example
                            </div>
                    </div>
                </div>
            );
        }
        return arr;
    };


    return (
        <>
            <div className="container" style={{ flex: "auto", padding: "10px" }}>
                <div className="flex-row" style={{ maxHeight: "64px" }}>
                    <div style={{ flex: "auto" }}>
                        <Breadcrumbs />
                    </div>
                </div>
                <div id="jq-page">
                    <div className="container" style={{}}>
                        <div className="item-0 shadow-soft rounded tile">
                            <TileTitle name="JQ Filter">
                                <IoEaselOutline />
                            </TileTitle>
                            <div style={{ display: "flex" }}>
                                <input style={{ flexGrow: 7 }} type="text" placeholder="Enter JQ Filter Command" value={jqFilter} onChange={(e) => setJQFilter(e.target.value)} />
                                <div style={{ flexGrow: 1 }} className="button jq-button" onClick={() => { executeJQ(jqInput, jqFilter) }}>
                                    Execute
                            </div>
                            </div>
                        </div>
                        <div className="container" style={{ flexDirection: "row", width: "100%" }}>
                            <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1", flexBasis: 0 }}>
                                <TileTitle name={`Input`} >
                                    <IoPencil />
                                </TileTitle>
                                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative" }}>
                                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                        <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                            <Editor value={jqInput} setValue={setJQInput} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1", flexBasis: 0 }}>
                                <TileTitle name="Output">
                                    <IoChevronForwardOutline />
                                </TileTitle>
                                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", height: "100%", minHeight: "300px", top: "-28px", position: "relative" }}>
                                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                        <div style={{ height: "auto", position: "absolute", left: 0, right: 0, top: "25px", bottom: 0 }}>
                                            <Editor value={jqOutput} readOnly={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container" style={{ flexDirection: "row"}}>
                            <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "1", flexBasis: 0, maxHeight: "380px", minWidth: "200px" }}>
                                <TileTitle name={`How it Works`} >
                                    <IoPencil />
                                </TileTitle>
                                <div className="jq-help">
                                    <p>JQ Playground is an envrioment where you can quickly test your jq commands against JSON.</p>
                                    <p>There are two inputs in the playground:</p>
                                    <p>- Filter: This is the jq command that will be used to transform your JSON input</p>
                                    <p>- JSON: This is the JSON input that will be transformed</p>
                                    <p>The transformed JSON is shown in the Result output field.</p>
                                    <p>For information on the JQ syntax, please refer to the offical JQ manual online.</p>
                                </div>
                                <div style={{ display: "flex", width: "100%", justifyContent: "center"}}>
                                    <div className="button jq-button" onClick={() => { console.log("load Example") }}>
                                        View JQ Manual
                                    </div>
                                </div>
                            </div>
                            <div className="item-0 shadow-soft rounded tile" style={{ flexGrow: "3", flexBasis: 0 }}>
                                <TileTitle name="Cheatsheet">
                                    <IoChevronForwardOutline />
                                </TileTitle>
                                <div className="cheatsheet">
                                    <CheatSheetTable />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
    // return(
    //     <>
    //         <div className="container" style={{ flex: "auto", padding: "10px" }}>
    //             <div className="container">
    //                 <Breadcrumbs />
    //             </div>
    //             <div className="container" style={{ flexDirection: "row", flexWrap: "wrap", flex: "auto" }}>
    //                 <div className="shadow-soft rounded tile" style={{ flex: "auto" }}>
    //                     <p>
    //                         World
    //                     </p>
    //                 </div>
    //             </div>
    //         </div>
    //     </>
    // )
}