/**
 * Simple Swarm Service Manager - ES Modules Version
 */

export class SimpleSwarmServiceManager {
    constructor() {
        this.name = 'swarm-service-manager';
        this.version = '1.0.0';
    }

    async execute(input) {
        const { action = 'status' } = input;
        
        try {
            switch (action) {
                case 'status':
                    return await this.getStatus();
                case 'start':
                    return await this.startServices();
                case 'stop':
                    return await this.stopServices();
                default:
                    throw new Error(`Action not supported: ${action}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getStatus() {
        const { exec } = await import('child_process');
        
        return new Promise((resolve) => {
            exec('./scripts/swarm-service-manager.sh status', {
                cwd: process.cwd()
            }, (error, stdout) => {
                if (error) {
                    resolve({
                        success: false,
                        error: error.message
                    });
                    return;
                }
                
                const webmapRunning = stdout.includes('WebMap: RODANDO');
                const swarmclientRunning = stdout.includes('SwarmClient: RODANDO');
                
                resolve({
                    success: true,
                    status: {
                        webmap: webmapRunning ? 'running' : 'stopped',
                        swarmclient: swarmclientRunning ? 'running' : 'stopped',
                        platform: 'linux',
                        endpoint: 'http://localhost:3456'
                    }
                });
            });
        });
    }

    async startServices() {
        const { exec } = await import('child_process');
        
        return new Promise((resolve) => {
            exec('./scripts/swarm-service-manager.sh start', {
                cwd: process.cwd()
            }, (error, stdout) => {
                if (error) {
                    resolve({
                        success: false,
                        error: error.message
                    });
                    return;
                }
                
                resolve({
                    success: true,
                    message: 'Services started successfully'
                });
            });
        });
    }

    async stopServices() {
        const { exec } = await import('child_process');
        
        return new Promise((resolve) => {
            exec('./scripts/swarm-service-manager.sh stop', {
                cwd: process.cwd()
            }, (error, stdout) => {
                if (error) {
                    resolve({
                        success: false,
                        error: error.message
                    });
                    return;
                }
                
                resolve({
                    success: true,
                    message: 'Services stopped successfully'
                });
            });
        });
    }
}
