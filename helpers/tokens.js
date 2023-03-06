import { cockDB } from "../index.js";
import jwt from 'jsonwebtoken';

export const getWorkerToken = async (user) => {
    const { useruuid, email, firstname, lastname } = user;
    return jwt.sign({firstname, lastname, uuid: useruuid, admin: false}, process.env.JWT_SECRET);
}

export const getAdminToken = async (user) => {
    const {uuid, email, username} = user;
    return jwt.sign({uuid, email, username, admin: true}, process.env.JWT_SECRET, {expiresIn: '8h'});
}