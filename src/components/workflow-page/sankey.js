import {useState, useEffect} from 'react'
import AutoSizer from "react-virtualized-auto-sizer"
import * as d3 from 'd3' 
import { sankeyCircular, sankeyJustify } from 'd3-sankey-circular'
import {useParams} from 'react-router-dom'
import {useContext} from 'react'
import {sendNotification} from '../notifications'
import MainContext from "../../context"


// TODO dont set states
export default function Sankey(props) {

    const {fetch, namespace, handleError} = useContext(MainContext)

    const [links, setLinks] = useState([])
    const [nodes, setNodes] = useState([])
    const [load, setLoad] = useState(false)

    const params = useParams()



    useEffect(()=>{

    async function fetchMet() {
        try {
            let resp = await fetch(`/namespaces/${namespace}/tree/${params["0"]}?op=metrics-sankey`, {
                method: "GET"
            })
            if (resp.ok) {
                let json = await resp.json()
                return json.states
            } else {
                await handleError('fetch workflow metrics', resp)
            }
        } catch(e) {
            sendNotification(`Failed to fetch metrics for workflow:`, e.message, 0)
        }
    }
        async function gatherMetrics(){
            setLoad(true)

            let n = []
            let l = []
    
            let states = await fetchMet()
     // Fill the nodes before doing the links so we can search up the states
        for(var i=0; i < states.length; i++) {
            n.push({name: states[i].name})
        }
        // loop success and failures to end state
        n.push({name: "end"})

        var failure = 0
        var success = 0
        // Write the links
        for(i=0; i < states.length; i++) {
            let outcomes = states[i].outcomes
            let source = states[i].name
            let invokers = states[i].invokers

            if(invokers.start){
                let tpos = n.map((obj)=>{return obj.name}).indexOf("start")
                if(tpos === -1) {
                   n.push({name:"start"}) 
                }
                l.push({source:"start", target: source, value: invokers.start})
            }

            if(outcomes.success !== 0){
                let tpos = n.map((obj)=>{return obj.name}).indexOf("success")
                if (tpos === -1) {
                    n.push({name: "success"})
                }
                l.push({source: source, target: "success", value: outcomes.success})
                success += outcomes.success
            }
            if(outcomes.failure !== 0) {
                let tpos = n.map((obj)=>{return obj.name}).indexOf("failure")
                if (tpos === -1) {
                    n.push({name: "failure"})
                }
                l.push({source: source, target: "failure", value: outcomes.failure})
                failure += outcomes.failure
            }

            if(outcomes.transitions) {
                for(const state in outcomes.transitions){
                    l.push({source: source, target: state, value: outcomes.transitions[state]})
                }
            }
        }

        if(success !== 0){
            l.push({source:"success", target: "end", value: success})
        }
        if(failure !== 0) {
            l.push({source:"failure", target: "end", value: failure})
        }
        if(states.length > 0) {
            setLinks(l)
            setNodes(n)
        }
     
        setLoad(false)
        }
        gatherMetrics()

    },[fetch, namespace, params.workflow, handleError])
    // useEffect(()=>{
    //     setLoad(true)
    //     let n = []
    //     let l = []

   
        
    // },[states])
    return(
        <div style={{height:"80%", width:"80%", minHeight:"300px", margin:"auto", marginTop:"20px"}}>
            {
                load ? "":
                <AutoSizer>
                    {(dim)=> {
                        if(nodes.length > 0 && links.length > 0) {
                            return(
                                <SankeyDiagram nodes={nodes} links={links} height={dim.height-20} width={dim.width} />
                            )
                        }

                        return(
                            <div style={{textAlign:"center", paddingTop:"10px", fontSize:"11pt",  height:dim.height-20, width: dim.width}}>
                                No Metrics are found to draw the sankey have you tried executing the workflow?
                            </div>
                        )
                    }}
                </AutoSizer>
            }
        </div>
    )
}


function SankeyDiagram(props) {

    const {height, width, nodes, links} = props
    const margin = { top: 30, right: 30, bottom: 30, left: 30}

    useEffect(()=>{
        document.getElementById("sankey-graph").innerHTML = ""
        var sankey = sankeyCircular()
                        .nodeWidth(10)
                        .nodePaddingRatio(0.7)
                        .size([width, height])
                        .nodeId(function (d) {
                            return d.name;
                        })
                        .nodeAlign(sankeyJustify)
                        .iterations(32)
                        .circularLinkGap(2);
        var svg = d3.select("#sankey-graph").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);
        var g = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        var linkG = g.append("g")
                    .attr("class", "links")
                    .attr("fill", "none")
                    .attr("stroke-opacity", 0.1)
                    .selectAll("path");
        var nodeG = g.append("g")
                    .attr("class", "nodes")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .selectAll("g");

        let sankeyData = sankey({nodes: nodes, links: links});
        let sankeyNodes = sankeyData.nodes;
        let sankeyLinks = sankeyData.links;

        // let depthExtent = d3.extent(sankeyNodes, function (d) { return d.depth; });

        var nodeColour = d3.scaleSequential(d3.interpolateCool)
        .domain([0,width]);
    
        var node = nodeG.data(sankeyNodes)
          .enter()
          .append("g");
    
        node.append("rect")
          .attr("x", function (d) { return d.x0; })
          .attr("y", function (d) { return d.y0; })
          .attr("height", function (d) { return d.y1 - d.y0; })
          .attr("width", function (d) { return d.x1 - d.x0; })
          .style("fill", function (d) { return nodeColour(d.x0); })
          .style("opacity", 0.5)
    
        node.append("text")
          .attr("x", function (d) { return (d.x0 + d.x1) / 2; })
          .attr("y", function (d) { return d.y0 - 12; })
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function (d) { return d.name; });
    
        node.append("title")
          .text(function (d) { return d.name + "\n" + (d.value); });
    
        var link = linkG.data(sankeyLinks)
          .enter()
          .append("g")
        
        link.append("path") 
          .attr("class", "sankey-link")
          .attr("d", function(linkz){
            return linkz.path;
          })
          .style("stroke-width", function (d) { return Math.max(1, d.width); })
          .style("opacity", 0.7)
          .style("stroke", function (linkz, i) {
            return  "black"
          })
          
          link.append("title")
          .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + d.value; });
    

    },[height, width, nodes, links, margin.bottom, margin.left, margin.right, margin.top])

    return <div id="sankey-graph" style={{height: height, width:width}}/>
}
