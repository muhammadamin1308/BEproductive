import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://your-heroku-app.herokuapp.com',
  withCredentials: true,
});
