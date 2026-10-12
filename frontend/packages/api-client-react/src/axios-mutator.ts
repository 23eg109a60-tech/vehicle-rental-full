import axios, { type AxiosRequestHeaders, type Method } from "axios";

export const axiosMutator = <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const request = axios({
    url,
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
