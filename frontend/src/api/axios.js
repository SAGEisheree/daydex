import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";

const api = axios.create({
  baseURL: "https://daydex.onrender.com/",
});

export default api;