const express = require('express');

export const remoteMethod = (router, model, methodName, config) => {
    const httpConfig = config.http || {};
    const path = httpConfig.path || `/${methodName}`;
    let verb = (httpConfig.verb || 'get').toLowerCase();

    if(verb == 'del') verb = 'delete';

    router[verb](path, async (req, res) => {
        // Build arguments from config.accepts
        let args = [];
        for (const argConfig of config.accepts) {
            let value;
            if (typeof argConfig.http === 'function') {
                value = argConfig.http({ req, res });
            } else if (argConfig.http && argConfig.http.source === 'body') {
                value = req.body[argConfig.arg];
            } else if (argConfig.http && argConfig.http.source === 'query') {
                value = req.query[argConfig.arg];
            } else if (argConfig.http && argConfig.http.source === 'header') {
                value = req.headers[argConfig.arg.toLowerCase()];
            } else {
                value = req.query[argConfig.arg] || req.body[argConfig.arg] || req.headers[argConfig.arg.toLowerCase()];
            }
            args.push(value);
        }
        try {
            const callback = (err, resp) => {
                if(err) {
                    if (!res.headersSent)
                        return res.status(500).json({ error: err?.message || err });
                } else {
                    if (!res.headersSent)
                        return res.json(resp);
                }
            };
            args.push(callback);
            const result = await model[methodName](...args);
            if (!res.headersSent && result !== undefined) res.json(result);
        } catch (e) {
            if (!res.headersSent) res.status(500).json({ error: e?.message || e });
        }
    });
}
