import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Simple async queue to prevent Git concurrency issues
class GitQueue {
  private queue: Promise<void> = Promise.resolve();

  async enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(async () => {
      try {
        await task();
      } catch (error) {
        console.error('[GitQueue Task Error]', error);
      }
    });
    return this.queue;
  }
}

const gitQueue = new GitQueue();

export async function commitAndPush(message: string): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production' || process.env.GIT_SYNC_ENABLED === 'true';
  
  if (!isProd) {
    console.log(`[Git Sync Disabled] MOCK: git commit -m "${message}"`);
    return;
  }

  // Enqueue the git operation
  await gitQueue.enqueue(async () => {
    try {
      const cwd = process.cwd();
      
      await execAsync('git add src/content/ public/photos/ dist/client/photos/ || true', { cwd });
      
      let hasChanges = true;
      try {
        await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd });
      } catch (commitErr: any) {
        if (commitErr.stdout && commitErr.stdout.includes('nothing to commit')) {
          hasChanges = false;
          console.log('[Git Sync] No hay cambios para commitear.');
        } else {
          throw commitErr;
        }
      }
      
      // Pull and rebase only if needed (after local commit)
      try {
        await execAsync('git pull --rebase origin main', { cwd });
      } catch (pullErr) {
        console.warn('[Git Sync] Pull failed, continuing anyway...', pullErr);
      }

      if (hasChanges) {
        await execAsync('git push origin main', { cwd });
        console.log(`[Git Sync] Éxito: ${message}`);
      }
    } catch (error) {
      console.error('[Git Sync Error]', error);
    }
  });
}
