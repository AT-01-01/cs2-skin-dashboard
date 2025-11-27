// frontend/src/services/api.js
import axios from 'axios';
const BACKEND = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8080';

export const postInventory = async ({ steamid, key }) => {
  const res = await axios.post(`${BACKEND}/api/inventory`, { steamid, key }, { withCredentials: true });
  return res.data;
};
