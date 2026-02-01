/** @type {import('tailwindcss').Config} */
import { useState } from 'react'


const colors = ["#ece3ca"]

export default {

  

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui") // Change to require
  ],
  daisyui: {
      themes: ["retro","cyberpunk","aqua"
        
      ]
 
  },
}