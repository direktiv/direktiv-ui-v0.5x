import React, { useState, useEffect } from "react";
import "./style.css";
import ReactTooltip from "react-tooltip";
import { PieChart } from "react-minimal-pie-chart";

const colors = ["rgba(115,204,118,1)", "rgb(204,115,115)"];

export const MockData = [
  { title: "Completed", value: 50 },
  { title: "Cancelled", value: 5, color: "#7e7e7e" },
  { title: "Failed", value: 10, color: "#e03b24" },
  { title: "Pending", value: 3, color: "#ffcc00" },
];

const hoverColor = "#ADB3AE";

export default function NuePieChart(props) {
  const { radius, lineWidth, rounded, data } = props;
  const [pieData, setPieData] = useState([]);
  const [total, setTotal] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let dataList = [];
    let t = 0;
    data.forEach(function (item, i) {
      let title = "No title";
      let color = colors[i];
      let value = -1;
      if (item.value !== undefined) {
        value = item.value;
      }

      if (item.title) {
        title = item.title;
      }

      if (item.color) {
        color = item.color;
      }

      t += value;
      dataList.push({
        title: title,
        value: value,
        color: color,
        bColor: color,
        label: "",
      });
    });

    setTotal(t)
    setPieData(dataList);
  }, [data]);

  return (
    <div
      className="pie-outer-background"
      style={{ margin: "auto", marginTop: "22px", position: "relative" }}
    >
      <div className="pie-outer-highlight">
        <div className="pie-inner-circle" >
          {total}
        </div>
      </div>
        {pieData === [] ? (
          <></>
        ) : (
          <div data-tip="" data-for="chart">
            <PieChart
              className="Pie-Chart"
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
                setTooltip(`${pieData[index].title}: ${pieData[index].value}`);
              }}
              onMouseOut={(_, index) => {
                setPieData((old) => {
                  old[index].color = old[index].bColor;
                  return [...old];
                });
                setTooltip(null);
              }}
            />
            <ReactTooltip
            style={{zIndex: 100}}
              id="chart"
              getContent={() => {
                return tooltip;
              }}
            />
          </div>
        )}
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

    setPieData(dataList);
  }, [data]);

  return (
    <div className="Pie-Legend-Background" style={{ ...props.style }}>
      {title ? (
        <div className="Pie-Legend-Container-Title">{title}</div>
      ) : (
        <></>
      )}
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
