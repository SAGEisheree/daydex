import express from 'express'
import {saveData, getData, deleteData } from '../controllers/storageCtrl.js';

const router = express.Router();



router.post('/', saveData);

router.get('/:key', getData);

router.delete('/:key', deleteData);

export default router;