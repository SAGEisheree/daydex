import Storage from '../models/storage.js';


// 3 things saving data, getting data , deleting data

export const saveData = async (req, res) => {
    try {
        
        const {key, value} = req.body;
        const item = await Storage.findOneAndUpdate(
            {key},
            {value},
            {upsert: true, returnDocument: 'after'}
        );
        res.status(200).json(item);

    } catch (err) {
        console.error("Error in saveData: ", err);
        res.status(500).json({message: "failed to save data"});
    }

};

export const getData = async (req, res) => {
    try {
        const {key} = req.params;
        const item = await Storage.findOne({key});
        
        res.status(200).json(item ? item.value: null);

    } catch (error) {
        console.error("Error in getting data:", err);
        res.status(500).json({message: "failed to fetch data from clooud"});

    }
};

export const deleteData = async (req,res) => {
    try {
        const {key} =req.params;
        await Storage.findOneAndDelete({key});
        res.status(200).json({message: "key deleted success"});

    } catch (error) {
        res.status(500).json({message: "failed to delete"});

    };
}