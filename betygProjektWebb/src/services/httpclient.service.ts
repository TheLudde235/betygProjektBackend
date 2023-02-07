import { environment } from "../environment/environment";

export class HTTPClient {
    private readonly credentials: RequestCredentials;

    constructor(credentialsInclude?: RequestCredentials) {
        this.credentials = credentialsInclude || 'omit' ;
    }

    async get<T = any>(route: string): Promise<T> {
        return (await fetch(environment.baseUrl + route, {
            credentials: this.credentials
        })).json();
    }

    async post<T = any>(route: string, reqBody: string): Promise<T> {
        return (await fetch(environment.baseUrl + route, {
            method: 'post',
            body: reqBody,
            credentials: this.credentials
        })).json();
    }
}