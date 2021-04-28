import { sendNotification } from "./components/notifications";

export const ResourceRegex = new RegExp("^[a-z][a-z0-9._-]{1,34}[a-z0-9]$");

export function validateName(name, label) {
    if (!name || name === "") {
      return `${label} can not be empty`;
    }
  
    if (name.length < 3) {
      return `${label} must be atleast three characters long`;
    }
  
    if (name.match(/^\d/)) {
      return `${label} must start with lowercase letter`;
    }
  
    if (!ResourceRegex.test(name)) {
      return `${label} must be less than 36 characters and may only use lowercase letters, numbers, and “-_”`;
    }
    return null;
}

export function CopyToClipboard(s) {
    // s = document.getElementById(s).innerHTML;               
   
    if(!navigator.clipboard) {
      sendNotification("Copy-Error", "Browser does not support copy to clipboard", 0)
      return
    }

    navigator.clipboard.writeText(s).then(()=>{
      sendNotification("Copy", "Copied text to the clipboard", 0)
    }).catch(err =>{
      sendNotification("Copy-Error", "Copied text to the clipboard", 0)
    })
}