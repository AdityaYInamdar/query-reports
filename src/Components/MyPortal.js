import ReactDOM from "react-dom";
import React, { useEffect, useState } from "react";


// Note should be in bold
/**
 * @param {string} id
 * @param {React.ReactNode} children
 * @Note <i>The id of the element should be unique and present in the DOM</i>
 * @info This is a portal that renders the children in the element with the given id
 * @example
 * <MyPortal id="portal">
 *   <div>Some content</div>
 * </MyPortal>
 * 
*/

export default function MyPortal({ children, id }) {
    const [domReady, setDomReady] = useState(false);

    useEffect(() => {
        // Check if the element with the provided id exists in the DOM
        const portal = document.getElementById(id);
        if (portal) {
            setDomReady(true);
        }
    }, [id]);

    // Render the portal only if the element with the provided id exists in the DOM
    return domReady ? ReactDOM.createPortal(children, document.getElementById(id)) : null;
}
// export const MyPortal = ({ children, id }) => {
//     const portalElement = document.createElement("div");
//     portalElement.id = id;

//     React.useEffect(() => {
//         document.body.appendChild(portalElement);
//         return () => {
//             document.body.removeChild(portalElement);
//         };
//     }, [portalElement]);

//     return ReactDOM.createPortal(children, portalElement);
// };
