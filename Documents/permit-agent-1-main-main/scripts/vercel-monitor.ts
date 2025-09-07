#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface DeploymentInfo {
  url: string;
  status: string;
  age: string;
  environment: string;
}

interface DeploymentError {
  type: 'build' | 'runtime' | 'env' | 'dependency' | 'config';
  message: string;
  solution: string;
  command?: string;
}

class VercelDeploymentMonitor {
  private projectPath: string;
  private maxRetries: number = 3;
  private checkInterval: number = 60000; // 1 minute
  private isMonitoring: boolean = false;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  async checkDeploymentStatus(): Promise<DeploymentInfo[]> {
    try {
      const { stdout } = await execAsync('vercel ls --json', { cwd: this.projectPath });
      const deployments = JSON.parse(stdout);
      
      return deployments.deployments.map((d: any) => ({
        url: d.url,
        status: d.state,
        age: d.createdAt,
        environment: d.target || 'preview'
      }));
    } catch (error) {
      console.error('Failed to fetch deployment status:', error);
      return [];
    }
  }

  async getLatestDeploymentLogs(deploymentUrl: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`vercel logs ${deploymentUrl} 2>&1 || true`, { 
        cwd: this.projectPath 
      });
      return stdout;
    } catch (error) {
      return String(error);
    }
  }

  analyzeError(logs: string): DeploymentError | null {
    const errorPatterns = [
      {
        pattern: /Module not found|Cannot find module/i,
        type: 'dependency' as const,
        message: 'Missing dependencies detected',
        solution: 'Reinstalling dependencies and clearing cache',
        command: 'npm ci && rm -rf .next && npm run build'
      },
      {
        pattern: /OPENAI_API_KEY|Environment variable .* is not defined/i,
        type: 'env' as const,
        message: 'Missing environment variables',
        solution: 'Syncing environment variables with Vercel',
        command: 'vercel env pull .env.local'
      },
      {
        pattern: /Type error:|TSError:|TypeScript error/i,
        type: 'build' as const,
        message: 'TypeScript compilation errors',
        solution: 'Fixing type errors and rebuilding',
        command: 'npm run lint:fix && npm run build'
      },
      {
        pattern: /ENOSPC|out of memory|JavaScript heap out of memory/i,
        type: 'runtime' as const,
        message: 'Memory or resource limits exceeded',
        solution: 'Optimizing build configuration',
        command: 'NODE_OPTIONS="--max-old-space-size=4096" npm run build'
      },
      {
        pattern: /Invalid configuration|next\.config/i,
        type: 'config' as const,
        message: 'Next.js configuration issues',
        solution: 'Validating Next.js configuration',
        command: 'npx next info'
      },
      {
        pattern: /package-lock\.json|lockfile|npm ERR!/i,
        type: 'dependency' as const,
        message: 'Package lock file conflicts',
        solution: 'Regenerating lock file',
        command: 'rm -rf node_modules package-lock.json && npm install && npm run build'
      }
    ];

    for (const { pattern, type, message, solution, command } of errorPatterns) {
      if (pattern.test(logs)) {
        return { type, message, solution, command };
      }
    }

    if (logs.includes('Error') || logs.includes('failed')) {
      return {
        type: 'build',
        message: 'Unknown build error detected',
        solution: 'Running comprehensive fix attempt',
        command: 'npm ci && rm -rf .next .vercel && npm run build'
      };
    }

    return null;
  }

  async applyFix(error: DeploymentError): Promise<boolean> {
    console.log(`\n🔧 Applying fix for ${error.type} error: ${error.solution}`);
    
    if (!error.command) {
      console.log('No automated fix available');
      return false;
    }

    try {
      console.log(`Running: ${error.command}`);
      const { stdout, stderr } = await execAsync(error.command, { 
        cwd: this.projectPath,
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('Fix output:', stdout);
      if (stderr) console.error('Fix warnings:', stderr);
      
      return true;
    } catch (fixError) {
      console.error('Fix failed:', fixError);
      return false;
    }
  }

  async runHealthChecks(): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check Node version
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      if (majorVersion < 18) {
        issues.push(`Node version ${nodeVersion} is below recommended v18+`);
      }
    } catch (error) {
      issues.push('Failed to check Node version');
    }

    // Check package.json exists
    try {
      await fs.access(path.join(this.projectPath, 'package.json'));
    } catch {
      issues.push('package.json not found');
    }

    // Check next.config.js/ts exists
    try {
      const hasConfig = await Promise.any([
        fs.access(path.join(this.projectPath, 'next.config.js')),
        fs.access(path.join(this.projectPath, 'next.config.ts')),
        fs.access(path.join(this.projectPath, 'next.config.mjs'))
      ]).then(() => true).catch(() => false);
      
      if (!hasConfig) {
        issues.push('Next.js configuration file not found');
      }
    } catch {
      // Config file check handled above
    }

    // Check .vercel directory
    try {
      await fs.access(path.join(this.projectPath, '.vercel'));
    } catch {
      console.log('⚠️  .vercel directory not found - running vercel link');
      await execAsync('vercel link --yes', { cwd: this.projectPath });
    }

    // Check environment variables
    try {
      const envPath = path.join(this.projectPath, '.env.local');
      const envContent = await fs.readFile(envPath, 'utf-8').catch(() => '');
      
      const requiredEnvVars = ['OPENAI_API_KEY'];
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          issues.push(`Missing required environment variable: ${envVar}`);
        }
      }
    } catch {
      issues.push('Unable to check environment variables');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  async triggerRedeploy(): Promise<boolean> {
    console.log('\n🚀 Triggering redeployment...');
    
    try {
      // First, ensure we're on the correct branch
      const { stdout: branch } = await execAsync('git branch --show-current', { 
        cwd: this.projectPath 
      });
      
      console.log(`Current branch: ${branch.trim()}`);
      
      // Run deployment
      const { stdout } = await execAsync('vercel --prod --yes', { 
        cwd: this.projectPath,
        timeout: 600000 // 10 minutes timeout
      });
      
      console.log('Deployment output:', stdout);
      return true;
    } catch (error) {
      console.error('Deployment failed:', error);
      return false;
    }
  }

  async monitorAndFix(): Promise<void> {
    console.log('🔍 Starting Vercel deployment monitor...\n');
    
    // Run initial health checks
    const healthCheck = await this.runHealthChecks();
    if (!healthCheck.passed) {
      console.log('⚠️  Health check issues found:');
      healthCheck.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Check recent deployments
    const deployments = await this.checkDeploymentStatus();
    const failedDeployments = deployments.filter(d => d.status === 'ERROR' || d.status === 'FAILED');
    
    if (failedDeployments.length === 0) {
      console.log('✅ No failed deployments found');
      return;
    }

    console.log(`\n❌ Found ${failedDeployments.length} failed deployment(s)`);
    
    // Analyze the most recent failure
    const latestFailure = failedDeployments[0];
    console.log(`\nAnalyzing failure: ${latestFailure.url}`);
    
    const logs = await this.getLatestDeploymentLogs(latestFailure.url);
    const error = this.analyzeError(logs);
    
    if (error) {
      console.log(`\n🔎 Detected issue: ${error.message}`);
      
      // Attempt to fix the issue
      const fixApplied = await this.applyFix(error);
      
      if (fixApplied) {
        console.log('\n✅ Fix applied successfully');
        
        // Trigger redeployment
        const redeployed = await this.triggerRedeploy();
        
        if (redeployed) {
          console.log('\n✅ Redeployment triggered successfully');
          
          // Wait and check status
          console.log('\n⏳ Waiting 30 seconds for deployment to complete...');
          await new Promise(resolve => setTimeout(resolve, 30000));
          
          const newDeployments = await this.checkDeploymentStatus();
          const latestDeployment = newDeployments[0];
          
          if (latestDeployment && latestDeployment.status === 'READY') {
            console.log('\n✅ Deployment successful!');
            console.log(`URL: ${latestDeployment.url}`);
          } else {
            console.log('\n⚠️  Deployment may still be in progress or failed');
          }
        }
      } else {
        console.log('\n⚠️  Automatic fix could not be applied');
        console.log('Manual intervention may be required');
      }
    } else {
      console.log('\n⚠️  Could not identify the specific issue');
      console.log('Log excerpt:', logs.substring(0, 500));
    }
  }

  async startContinuousMonitoring(): Promise<void> {
    this.isMonitoring = true;
    console.log('🔄 Starting continuous monitoring (press Ctrl+C to stop)...\n');
    
    while (this.isMonitoring) {
      await this.monitorAndFix();
      console.log(`\n⏰ Next check in ${this.checkInterval / 1000} seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
    }
  }

  stop(): void {
    this.isMonitoring = false;
    console.log('\n🛑 Monitoring stopped');
  }
}

// CLI usage
async function main() {
  const monitor = new VercelDeploymentMonitor();
  
  const args = process.argv.slice(2);
  const continuous = args.includes('--continuous') || args.includes('-c');
  
  if (continuous) {
    process.on('SIGINT', () => {
      monitor.stop();
      process.exit(0);
    });
    
    await monitor.startContinuousMonitoring();
  } else {
    await monitor.monitorAndFix();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { VercelDeploymentMonitor };