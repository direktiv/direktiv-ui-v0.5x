import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function createNotification(msg, level){
    // Do Whatever you want here
    return ({ closeToast, toastProps }) => (
        <div style={{fontSize: "16px", color: "black"}}>
          {msg} {toastProps.position}
          <button onClick={closeToast}>Close</button>
        </div>
    )    
}


export function sendNotification(msg, level) {
    const notification = createNotification(msg)
    toast(notification)
}

export default function NotificationSystem() {
    return(<><ToastContainer position="bottom-right"/></>)
}