import React, { useState, useEffect } from "react";
import "./style.css";
import ReactTooltip from "react-tooltip";
import { PieChart } from "react-minimal-pie-chart";

const colors = [
  "#2fa64d",
  "#db3447",
  "#ffbf32",
  "#014f86"
];

export const MockData =[
    { title: "Completed", value: 50 },
    { title: "Cancelled", value: 5 },
    { title: "Failed", value: 10}
    // { title: "Pending", value: 3 },
];

const hoverColor = "#a4aba6";

export default function NuePieChart(props) {
  const { radius, lineWidth, rounded, data } = props;
  const [pieData, setPieData] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let dataList = [];
    let total = 0;
    data.forEach(function (item, i) {
      let title = "No title";
      let color = colors[i];
      let value = -1;
      if (item.value) {
        value = item.value;
      }

      if (item.title) {
        title = item.title;
      }

      if (item.color) {
        color = item.color;
      }

      total += value;
      dataList.push({
        title: title,
        value: value,
        color: color,
        bColor: color,
        label: "",
      });
    });

    console.log("dataList =", dataList);

    if (dataList.length > 0) {
      dataList[0].label = `${total}`;
    }

    setPieData(dataList);
  }, [data]);

  return (
    <div className="Pie-Background-OuterCircle" style={{ margin: "auto", marginTop: "22px" }}>
      <div className="Pie-Background-InnerCircle">
        {pieData === [] ? (
          <></>
        ) : (
          <div data-tip="" data-for="chart">
            <PieChart
              label={({ dataEntry }) => `${dataEntry.label}`}
              labelStyle={(index) => ({
                fontSize: "12pt",
                fontFamily: "sans-serif",
              })}
              labelPosition={0}
              radius={radius}
              lineWidth={lineWidth}
              rounded={rounded}
              animate
              data={pieData}
              onMouseOver={(_, index) => {
                setPieData((old) => {
                  old[index].color = hoverColor;
                  return [...old];
                });
                setTooltip(`${pieData[index].title}: ${pieData[index].value}`)
              }}
              onMouseOut={(_, index) => {
                setPieData((old) => {
                  old[index].color = old[index].bColor;
                  return [...old];
                });
                setTooltip(null)
              }}
            />
            <ReactTooltip
              id="chart"
              getContent={() => {return tooltip}}
            />
          </div>
        )}
        </div>
    </div>
  );
}

  export function NuePieLegend(props) {
    const { title, data } = props;
    const [pieData, setPieData] = useState([]);
  
    useEffect(() => {
      let dataList = [];
      data.forEach(function (item, i) {
        let localTitle = "No title";
        let value = -1;
        if (item.value) {
          value = item.value;
        }
  
        if (item.title) {
          localTitle = item.title;
        }
  
        dataList.push({ title: localTitle, value: value, color: colors[i] });
      });
  
      console.log("dataList =", dataList);
  
      setPieData(dataList);
    }, [data]);
  
    return (
      <div className="Pie-Legend-Background" style={{...props.style}}>
      {title ? (<div className="Pie-Legend-Container-Title">
          {title}
      </div>) : (<></>)}
        {pieData.map((item) => {
          return (
            <div className="Pie-Legend-Container">
              <div
                className="Pie-Legend-Key"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="Pie-Legend-Title">{item.title}</div>
            </div>
          );
        })}
        {pieData.map}
      </div>
    );
  }
  