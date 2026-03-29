import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE ?? "/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "x-user-id": "user_local_default",
  },
});

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};
