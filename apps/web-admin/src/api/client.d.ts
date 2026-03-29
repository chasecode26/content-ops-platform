export declare const api: import("axios").AxiosInstance;
export type ApiEnvelope<T> = {
    success: boolean;
    data: T;
};
