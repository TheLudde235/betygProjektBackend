export const atob = (str) => {return Buffer.from(str, 'base64').toString()};
export const btoa = (str) => {return str.toString('base64')};