/**
 * Kill Ports Helper Script
 * Kills processes on common development ports
 * @author fkndean_
 * @date 2025-10-14
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORTS = [3002, 3000, 5173, 5174]; // API, common dev, Vite default, Vite alt

console.log('🔍 Checking for processes on development ports...\n');

async function killProcessOnPort(port) {
  try {
    // Find process using the port (Windows)
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout) {
      console.log(`✅ Port ${port}: Available`);
      return;
    }

    // Extract PID from netstat output
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      console.log(`✅ Port ${port}: Available`);
      return;
    }

    // Kill all PIDs using this port
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`🔥 Port ${port}: Killed process ${pid}`);
      } catch (error) {
        console.log(`⚠️  Port ${port}: Failed to kill process ${pid} (might already be dead)`);
      }
    }
  } catch (error) {
    // No process found on this port
    console.log(`✅ Port ${port}: Available`);
  }
}

async function main() {
  for (const port of PORTS) {
    await killProcessOnPort(port);
  }
  
  console.log('\n✨ Done! All ports checked and cleared.');
}

main().catch(console.error);

