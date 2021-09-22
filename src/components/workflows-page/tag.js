import { useRef} from "react"

export default function Tag(props) {
    const {attributes, setAttributes, deleteAttribute, addAttribute} = props

    const tagInput = useRef()

    const removeTag = async (i) => {
        try {
            await deleteAttribute(attributes[i])
            const newTags = [...attributes]
            newTags.splice(i,1)
            setAttributes(newTags)
        } catch(e) {

        }
    }

    const inputKeyDown = async (e) => {
        const val = e.target.value
        if(e.key === " " || e.key === "Enter" && val) {
            if(attributes.find(tag => tag.toLowerCase() === val.toLowerCase())){
                return;
            }
            try {
                await addAttribute(val)
                setAttributes([...attributes, val])
                tagInput.current.value = null
            } catch(e) {
                
            }
        } else if (e.key === "Backspace" && !val) {
            removeTag(attributes.length - 1)
        }
    }

    return(
        <div className="input-tag" style={{maxHeight:"300px", overflow:"auto"}}>
            <ul className="input-tag__tags">
            {attributes.map((tag, i) => (
                <li key={tag}>
                    {tag}
                    <button type="button" onClick={() => { removeTag(i); }}>+</button>
                </li>
            ))}
            <li className="input-tag__tags__input"><input type="text" onKeyDown={inputKeyDown} ref={tagInput} /></li>
            </ul>
        </div>
    )
}