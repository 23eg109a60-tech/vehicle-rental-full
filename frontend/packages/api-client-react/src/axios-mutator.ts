import axios, { type AxiosRequestHeaders, type Method } from "axios";

export const axiosMutator = <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "https://vehicle-rental-backend-jrim.onrender.com";
  const fullUrl = url.startsWith("/") && !url.startsWith("//") ? `${baseUrl.replace(/\/+$/, "")}${url}` : url;

  const request = axios({
    url: fullUrl,
    method: options?.method as Method | undefined,
    headers: options?.headers as AxiosRequestHeaders | undefined,
    data: options?.body,
    signal: options?.signal ?? undefined,
    withCredentials: true,
    cancelToken: source.token,
  }).then((response) => response.data as T) as Promise<T> & {
    cancel?: () => void;
  };
  request.cancel = () => source.cancel("Request cancelled");
  return request;
};
