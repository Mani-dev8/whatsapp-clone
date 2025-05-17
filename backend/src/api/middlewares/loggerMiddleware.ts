import { winstonLogger } from '@/util/logger';
import express, { NextFunction, Request, Response } from 'express';
const router = express.Router();

export const logger = router.use(
  (req: Request, _res: Response, next: NextFunction) => {
    winstonLogger.info(`${req.method} ${req.url}`);
    next();
  },
);
