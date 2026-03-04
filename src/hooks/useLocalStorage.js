import { useState, useEffect } from 'react';
// hello iam writing this so that i can reuse this same thing in other projects and stuff
// creating a custom and reusable hooks. Now we dont have to write localstorage logic for all elements
function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        // Gets things that are saved in localstorage before 
        const saved = localStorage.getItem(key);
        // The key and  default value are defined in the component and gets sent here as props to use it here
        if (saved === null) return defaultValue;
         


    // try catch is similar to if else in C
        try {
            // allows only valid JSON 
            return JSON.parse(saved);
        } catch (e) {
            // instead of crashing with error which occured before, it will return the saved thing even if its not JSON
            return saved;
        }
    });


// usestate holds the data and useeffect syncs the data.
    useEffect(() => {
        // This ensures the NEXT save is proper JSON
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
// below above line  says the useeffect to run when any value or key changes  
    return [value, setValue];
}

export default useLocalStorage;