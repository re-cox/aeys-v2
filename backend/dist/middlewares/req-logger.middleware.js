"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
/**
 * İstek logları için middleware
 * Her isteği detaylı olarak konsola loglar
 */
const requestLogger = (req, res, next) => {
    const startTime = new Date().getTime();
    // İsteği logla
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log(`Headers: ${JSON.stringify(req.headers)}`);
    // Body'yi logla (dosya içerikleri hariç)
    if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = Object.assign({}, req.body);
        console.log(`Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }
    // Dosyaları logla
    if (req.files) {
        const fileInfo = Object.keys(req.files).map(key => {
            const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
            return {
                fieldName: key,
                count: files.length,
                files: files.map((file) => ({
                    name: file.name,
                    size: file.size,
                    mimetype: file.mimetype
                }))
            };
        });
        console.log(`Files: ${JSON.stringify(fileInfo, null, 2)}`);
    }
    // Yanıt loglaması için response fonksiyonlarını override et
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    res.send = function (body) {
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        console.log(`[${new Date().toISOString()}] Response ${req.method} ${req.originalUrl} - Status: ${res.statusCode}, Duration: ${duration}ms`);
        return originalSend.apply(res, [body]);
    };
    res.json = function (body) {
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        console.log(`[${new Date().toISOString()}] Response ${req.method} ${req.originalUrl} - Status: ${res.statusCode}, Duration: ${duration}ms`);
        return originalJson.apply(res, [body]);
    };
    res.end = function (chunk) {
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        console.log(`[${new Date().toISOString()}] Response ${req.method} ${req.originalUrl} - Status: ${res.statusCode}, Duration: ${duration}ms`);
        return originalEnd.apply(res, [chunk]);
    };
    next();
};
exports.requestLogger = requestLogger;
