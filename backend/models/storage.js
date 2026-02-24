// this file defines the structure of how the data witll be saved in mongoose

import mongoose from "mongoose";

const storageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // mixed can store all types of datatypes
    value: {
      type: mongoose.Schema.Types.Mixed,  
    },
  },
  {
    timestamps: true,
  },
);

const Storage = mongoose.model('Storage', storageSchema);

export default Storage;