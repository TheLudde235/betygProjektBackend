import { atob } from "./base64.js"
export const getTokenData = (req) => {
    return JSON.parse(atob(req.headers.authorization.split(' ')[1].split('.')[1]));
}