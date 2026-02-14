import { Plugin, ViteDevServer } from 'vite';
import fs from 'fs';
import path from 'path';
import ngrok from '@ngrok/ngrok';

export interface AgentationHttpOptions {
    /**
     * Path to the annotations storage file.
     * Defaults to 'annotations.json' in the project root.
     */
    dbPath?: string;
    /**
     * Ngrok authtoken. If provided, will attempt to start a tunnel.
     * Can also be set via NGROK_AUTHTOKEN env var.
     */
    ngrokToken?: string;
    /**
     * Whether to enable Ngrok tunneling.
     * Defaults to false unless NGROK_AUTHTOKEN is present.
     */
    enableNgrok?: boolean;
}

export default function agentationHttpPlugin(options: AgentationHttpOptions = {}): Plugin {
    const dbFile = path.resolve(process.cwd(), options.dbPath || 'annotations.json');
    let ngrokUrl: string | null = null;

    // Initialize DB file if not exists
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify([], null, 2));
    }

    return {
        name: 'vite-plugin-agentation-http',
        configureServer(server: ViteDevServer) {
            // 1. API Handlers
            console.log('启动 Registering agentation-zero HTTP middleware...');
            // Helper to safely read DB
            const readDb = (): any[] => {
                try {
                    if (!fs.existsSync(dbFile)) return [];
                    const content = fs.readFileSync(dbFile, 'utf-8').trim();
                    if (!content) return [];
                    return JSON.parse(content);
                } catch (e) {
                    console.error(`[agentation-http] Failed to read/parse DB file at ${dbFile}:`, e);
                    return [];
                }
            };

            server.middlewares.use('/api/annotations', (req, res, next) => {
                console.log(`[agentation-http] ${req.method} /api/annotations`);
                // Set CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, DELETE');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                if (req.method === 'OPTIONS') {
                    res.end();
                    return;
                }

                if (req.method === 'GET') {
                    // Read
                    try {
                        const data = readDb();
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    } catch (e) {
                        console.error('[agentation-http] GET error:', e);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'Failed to read database' }));
                    }
                } else if (req.method === 'POST') {
                    // Create
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => {
                        try {
                            if (!body.trim()) {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ error: 'Empty body' }));
                                return;
                            }
                            const incoming = JSON.parse(body);

                            // Only process annotation.add events
                            if (incoming.event !== 'annotation.add') {
                                console.log(`[agentation-http] Ignoring non-add event: ${incoming.event}`);
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ ignored: true }));
                                return;
                            }

                            // Extract data from the event payload
                            const rawAnnotation = incoming.annotation || {};

                            // Store only requested fields
                            const newAnnotation = {
                                id: rawAnnotation.id || incoming.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
                                annotation: {
                                    sourceLocation: rawAnnotation.sourceLocation,
                                    comment: rawAnnotation.comment,
                                    element: rawAnnotation.element
                                }
                            };

                            const data = readDb();
                            data.push(newAnnotation);
                            fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
                            console.log(`[agentation-http] Created annotation ${newAnnotation.id} from event`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(newAnnotation));
                        } catch (e) {
                            console.error('[agentation-http] POST error:', e);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Failed to save annotation' }));
                        }
                    });
                } else if (req.method === 'PATCH') {
                    // Update
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', () => {
                        try {
                            if (!body.trim()) {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ error: 'Empty body' }));
                                return;
                            }
                            const update = JSON.parse(body);
                            const data = readDb();
                            const index = data.findIndex((a: any) => a.id === update.id);

                            if (index !== -1) {
                                // Update only allowed fields
                                const current = data[index];
                                const updatedAnnotation = {
                                    ...current,
                                    annotation: {
                                        ...current.annotation,
                                        ...(update.sourceLocation ? { sourceLocation: update.sourceLocation } : {}),
                                        ...(update.comment ? { comment: update.comment } : {})
                                    }
                                };

                                data[index] = updatedAnnotation;
                                fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
                                console.log(`[agentation-http] Updated annotation ${update.id}`);
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify(data[index]));
                            } else {
                                res.statusCode = 404;
                                res.end(JSON.stringify({ error: 'Annotation not found' }));
                            }
                        } catch (e) {
                            console.error('[agentation-http] PATCH error:', e);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Failed to update annotation' }));
                        }
                    });
                } else if (req.method === 'DELETE') {
                    // Delete (expecting ID in query or body)
                    const url = new URL(req.url!, `http://${req.headers.host}`);
                    const id = url.searchParams.get('id');

                    if (id) {
                        try {
                            let data = readDb();
                            const initialLength = data.length;
                            data = data.filter((a: any) => a.id !== id);

                            if (data.length !== initialLength) {
                                fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
                                console.log(`[agentation-http] Deleted annotation ${id}`);
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true }));
                            } else {
                                res.statusCode = 404;
                                res.end(JSON.stringify({ error: 'Annotation not found' }));
                            }
                        } catch (e) {
                            console.error('[agentation-http] DELETE error:', e);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Failed to delete annotation' }));
                        }
                    } else {
                        // Fallback: try reading body
                        let body = '';
                        req.on('data', chunk => body += chunk);
                        req.on('end', () => {
                            try {
                                const { id } = JSON.parse(body || '{}');
                                if (id) {
                                    let data = readDb();
                                    const initialLength = data.length;
                                    data = data.filter((a: any) => a.id !== id);
                                    if (data.length !== initialLength) {
                                        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
                                        console.log(`[agentation-http] Deleted annotation ${id}`);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.end(JSON.stringify({ success: true }));
                                    } else {
                                        res.statusCode = 404;
                                        res.end(JSON.stringify({ error: 'Annotation not found' }));
                                    }
                                } else {
                                    res.statusCode = 400;
                                    res.end(JSON.stringify({ error: 'Missing ID' }));
                                }
                            } catch (e) {
                                console.error('[agentation-http] DELETE body error:', e);
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: 'Failed to delete' }));
                            }
                        });
                    }
                } else {
                    next();
                }
            });

            // 2. Start Ngrok (Async)
            const token = options.ngrokToken || process.env.NGROK_AUTHTOKEN;
            const shouldEnable = options.enableNgrok ?? !!token;

            if (shouldEnable && token) {
                server.httpServer?.on('listening', async () => {
                    const address = server.httpServer?.address();
                    const port = typeof address === 'object' && address ? address.port : 5173;

                    try {
                        // @ngrok/ngrok forward returns a Listener
                        const listener = await ngrok.forward({
                            addr: port,
                            authtoken: token
                        });
                        ngrokUrl = listener.url();
                        console.log(`\n\x1b[32m[agentation] 🚀 Public URL: ${ngrokUrl}\x1b[0m\n`);

                        // Note: We can't easily inject this into the *running* client 
                        // via 'define' because the build is already done/started.
                        // But we can expose it via a special endpoint for the client to poll/fetch.
                        // Or better: Use the 'transformIndexHtml' hook or similar if possible,
                        // but for dev server 'listening' happens late.
                        // 
                        // Strategy: We will expose an endpoint '/api/config' that returns the current best URL.

                    } catch (e) {
                        console.error('\x1b[31m[agentation] Ngrok failed to start:\x1b[0m', e);
                    }
                });
            }

            // Config endpoint for client to discover URL
            server.middlewares.use('/api/config', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                    apiUrl: ngrokUrl || `http://localhost:${server.config.server.port || 5173}`
                }));
            });
        }
    };
}
