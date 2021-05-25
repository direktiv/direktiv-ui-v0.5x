import React from "react";
import { IoEllipsisVertical } from "react-icons/io5";
import { Link } from "react-router-dom";

const DropDownCard = ({ data = [], setOpen }) => (
    <div className="shadow-soft rounded tile" style={{padding:"0px", margin:"0px", height: "auto", width:"140px", position:"absolute", right: "-2px", bottom: "-104px"}}>
      <ul style={{textAlign:"center"}}>
        {data.map((item, i) => 
            {
                if (item.link) {
                    return(
                        <li style={{padding:"0px"}} key={i} className="list-instance-page-item">
                            <Link style={{textDecoration:"none", color:"var(--font-dark)"}} to={item.path}>{item.name}</Link>
                        </li>
                    )
                }
                return(
                    <li style={{padding:"0px"}} key={i} className={"list-instance-page-item"} onClick={() => {
                        item.func()
                        setOpen(false)
                    }}>
                        {item.name}
                    </li>
                )
            }
        )}
      </ul>
    </div>
);
  
const ButtonWithDropDownCmp = (props) => {
  const {data} = props
  const [open, setOpen] = React.useState(false);
  const drop = React.useRef(null);
  function handleClick(e) {
      if(drop.current){
        if (!e.target.closest(`.${drop.current.className}`) && open) {
            setOpen(false);
          }
      }
  
  }
  React.useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  });
  return (
    <div
      onClick={()=>setOpen(!open)}
      className="shadow-soft rounded tile fit-content dropdown"
      ref={drop}
       style={{cursor:"pointer", zIndex: "20", maxHeight:"36px", display:"flex", alignItems:"center", height:"18px" }}
    >
        <IoEllipsisVertical className={"toggled-switch"} style={{ fontSize: "11pt",  marginLeft: "0px" }} />
      {open && <DropDownCard data={data} setOpen={setOpen} />}
    </div>
  );
};

export default ButtonWithDropDownCmp;
