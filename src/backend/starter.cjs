const database = require('./database.cjs');
const sshServer = require('./ssh.cjs');
//const rdpServer = require('./rdp.cjs');
//const vncServer = require('./vnc.cjs');
//const sftpServer = require('./sftp.cjs');

const logger = {
    info: (...args) => console.log(`🚀 |  🔧 [${new Date().toISOString()}] INFO:`, ...args),
    error: (...args) => console.error(`🚀 | ❌ [${new Date().toISOString()}] ERROR:`, ...args),
    warn: (...args) => console.warn(`⚠️ [${new Date().toISOString()}] WARN:`, ...args),
    debug: (...args) => console.debug(`🚀 | 🔍 [${new Date().toISOString()}] DEBUG:`, ...args)
};

(async () => {
    try {
        logger.info("Starting all backend servers...");
        
        logger.info("All servers started successfully");

        process.on('SIGINT', () => {
            logger.info("Shutting down servers...");
            process.exit(0);
        });
    } catch (error) {
        logger.error("Failed to start servers:", error);
        process.exit(1);
    }
})();
