import {useState, useEffect} from 'react';
import axios from 'axios'

const useCloudStorage = (key, initialValue) => {


    const [state, setState] = useState(initialValue);
    const API_URL = `http://localhost:5000/api/storage`;

    // pulling the data from DB after components load

    useEffect(() =>{
        const fetchData = async () => {
            try {
                const res=await axios.get(`${API_URL}/${key}`);
                if(res.data !== null) {
                    setState(res.data)
                }
            } catch (err) {
                console.error("Error lodaing from clous:", err);
            }
        }   
        fetchData();
    }, [key]);
    
  // syncing localstorage to cloud
  const setValue = async (value)=>{
    try {
        setState(value);
        await axios.post(API_URL, { key, value });
    } catch (err) {
        console.error("error saving to cloud", err);
    }
  };
  return [state, setValue];

}

export default useCloudStorage;