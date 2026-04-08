import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { JWT_SECRET } from '../../../packages/backend-common/config/index.ts';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];

    const decoded = jwt.verify(token || "", JWT_SECRET) as { userId: string };

    if(!token){
        return res.status(401).json({ message: "Unauthorized" });
    }
    if(!decoded.userId){
        return res.status(401).json({ message: "Unauthorized" });
    }

    if(decoded.userId){
        // @ts-ignore
        req.userId = decoded.userId;
        next();
    }
    else{
        res.status(401).json({ message: "Unauthorized" });
    }
}