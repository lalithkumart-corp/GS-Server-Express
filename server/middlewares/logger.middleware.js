import logger from "../components/logger/logger";
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    
    logger.info({
        is_start_of_request: true,
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
    })

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            is_end_of_request: true,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: duration,
        });
    });
    
    next();
}

export default loggerMiddleware;
