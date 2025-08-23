import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            statusCode: 404,
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    });
};
