import SftpClient from 'ssh2-sftp-client';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

async function deploy() {
  const host = process.env.SFTP_HOST;
  const port = parseInt(process.env.SFTP_PORT || '22', 10);
  const username = process.env.SFTP_USER;
  const password = process.env.SFTP_PASSWORD;
  const privateKeyPath = process.env.SFTP_KEY_PATH;
  const remotePath = process.env.SFTP_REMOTE_PATH;

  console.log('🚀 Starting SFTP Deployment Routine...\n');

  if (!host || !username || (!password && !privateKeyPath) || !remotePath) {
    console.error('❌ Error: Missing required SFTP environment variables in .env file.');
    console.error('Please configure the following settings in your .env file:');
    console.error('  - SFTP_HOST (e.g. 192.168.0.5)');
    console.error('  - SFTP_PORT (e.g. 22)');
    console.error('  - SFTP_USER (e.g. your_username)');
    console.error('  - SFTP_PASSWORD (or SFTP_KEY_PATH)');
    console.error('  - SFTP_REMOTE_PATH (e.g. /var/www/html)\n');
    process.exit(1);
  }

  if (!fs.existsSync(distDir)) {
    console.error(`❌ Error: Build directory "${distDir}" does not exist.`);
    console.error('Please run "npm run build" before deploying.\n');
    process.exit(1);
  }

  const sftp = new SftpClient();

  try {
    console.log(`📡 Connecting to SFTP server at ${host}:${port} as "${username}"...`);

    const config = {
      host,
      port,
      username,
    };

    if (password) {
      config.password = password;
    }
    if (privateKeyPath) {
      const resolvedKeyPath = path.resolve(privateKeyPath);
      if (fs.existsSync(resolvedKeyPath)) {
        config.privateKey = fs.readFileSync(resolvedKeyPath);
      } else {
        console.warn(`⚠️ Warning: Key file at ${resolvedKeyPath} not found. Attempting password authentication.`);
      }
    }

    await sftp.connect(config);
    console.log('✅ SFTP Connection established!');

    console.log(`📁 Uploading build assets from "${distDir}" to "${remotePath}"...`);
    await sftp.uploadDir(distDir, remotePath);

    console.log('\n🎉 Deployment successful! Your web app is updated on the server.');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

deploy();
