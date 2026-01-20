import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://beproductive-backend-0b537f792c5e.herokuapp.com',
  withCredentials: true,
});
