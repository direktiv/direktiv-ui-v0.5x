import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function createNotification(title, msg, level){
    // Do Whatever you want here
    return ({ closeToast, toastProps }) => (
        <div className="toast" style={{fontSize: "16px", color: "black", textAlign: "left"}}>
            <b>{title}</b>
            <br/>
            <span>
                {msg}
            </span>
        </div>
    )    
}


export function sendNotification(title, msg, level) {
    const notification = createNotification(title, msg, level)
    toast(notification)
}

export default function NotificationSystem() {
    return(
    <>
        <ToastContainer autoClose={30000} position="bottom-right"/>
    </>)
}