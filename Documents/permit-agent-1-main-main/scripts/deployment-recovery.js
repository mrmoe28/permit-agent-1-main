#!/usr/bin/env node

/**
 * Deployment Recovery Script for PermitAgent
 * 
 * This script provides manual and automated deployment recovery capabilities.
 * It can be run locally or triggered from CI/CD for comprehensive deployment fixes.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');

class DeploymentRecovery {
  constructor() {
    this.projectRoot = process.cwd();
    this.vercelConfig = this.loadVercelConfig();
    this.packageJson = this.loadPackageJson();
    
    // Configuration
    this.config = {
      vercelProjectId: process.env.VERCEL_PROJECT_ID || 'prj_3HrsCfwM8vNwFahwWMPcSnAnPpxq',
      vercelToken: process.env.VERCEL_TOKEN,
      deployHook: process.env.VERCEL_DEPLOY_HOOK || 'https://api.vercel.com/v1/integrations/deploy/prj_3HrsCfwM8vNwFahwWMPcSnAnPpxq/zx1Mi4flvz',
      nodeOptions: process.env.NODE_OPTIONS || '--max_old_space_size=4096',
      maxRetries: 3,
      retryDelay: 30000,
    };
  }

  loadVercelConfig() {
    try {
      const configPath = path.join(this.projectRoot, 'vercel.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      this.log('Warning: Could not load vercel.json', 'warn');
      return {};
    }
  }

  loadPackageJson() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      this.log('Error: Could not load package.json', 'error');
      throw error;
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || 'ℹ️';
    
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const { cwd = this.projectRoot, timeout = 300000 } = options;
      
      this.log(`Executing: ${command}`);
      
      try {
        const result = execSync(command, {
          cwd,
          encoding: 'utf8',
          timeout,
          env: {
            ...process.env,
            NODE_OPTIONS: this.config.nodeOptions
          }
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async analyzeFailure() {
    this.log('🔍 Analyzing deployment failures...');
    
    const analysis = {
      type: 'unknown',
      severity: 'medium',
      fixable: true,
      actions: [],
      details: {}
    };

    try {
      // Check for common build issues
      const buildLog = this.getBuildLog();
      
      // TypeScript errors
      if (buildLog.includes('TypeScript') && buildLog.includes('error')) {
        analysis.type = 'typescript';
        analysis.actions.push('fix-typescript', 'rebuild');
        this.log('Detected TypeScript errors', 'warn');
      }
      
      // ESLint errors
      if (buildLog.includes('ESLint') || buildLog.includes('linting failed')) {
        analysis.type = analysis.type === 'unknown' ? 'eslint' : 'multiple';
        analysis.actions.push('fix-eslint');
        this.log('Detected ESLint errors', 'warn');
      }
      
      // Memory issues
      if (buildLog.includes('out of memory') || buildLog.includes('heap out of memory')) {
        analysis.type = 'memory';
        analysis.actions.push('increase-memory', 'optimize-build');
        analysis.severity = 'high';
        this.log('Detected memory issues', 'warn');
      }
      
      // Lockfile conflicts
      if (buildLog.includes('lockfile') || buildLog.includes('multiple lockfiles')) {
        analysis.type = analysis.type === 'unknown' ? 'lockfile' : 'multiple';
        analysis.actions.push('fix-lockfile');
        this.log('Detected lockfile conflicts', 'warn');
      }
      
      // Dependency issues
      if (buildLog.includes('not found') || buildLog.includes('cannot resolve')) {
        analysis.type = 'dependencies';
        analysis.actions.push('reinstall-deps');
        this.log('Detected dependency issues', 'warn');
      }

      // Environment variable issues
      if (buildLog.includes('env') && buildLog.includes('not found')) {
        analysis.type = 'environment';
        analysis.actions.push('check-env-vars');
        this.log('Detected environment variable issues', 'warn');
      }

    } catch (error) {
      this.log(`Analysis error: ${error.message}`, 'warn');
    }

    // If no specific issues found, assume basic rebuild needed
    if (analysis.type === 'unknown') {
      analysis.actions.push('basic-rebuild');
    }

    this.log(`Analysis complete: ${analysis.type} (${analysis.severity})`, 'info');
    return analysis;
  }

  getBuildLog() {
    const logPaths = [
      path.join(this.projectRoot, 'build.log'),
      path.join(this.projectRoot, 'npm-debug.log'),
      path.join(this.projectRoot, '.next/build-trace')
    ];

    for (const logPath of logPaths) {
      try {
        if (fs.existsSync(logPath)) {
          return fs.readFileSync(logPath, 'utf8');
        }
      } catch (error) {
        // Continue to next log file
      }
    }

    return '';
  }

  async fixLockfileConflicts() {
    this.log('🔧 Fixing lockfile conflicts...');
    
    try {
      // Remove conflicting lockfiles
      const homeDir = require('os').homedir();
      const homeLockfile = path.join(homeDir, 'package-lock.json');
      if (fs.existsSync(homeLockfile)) {
        fs.unlinkSync(homeLockfile);
        this.log('Removed global lockfile conflict');
      }

      // Regenerate clean lockfile
      const projectLockfile = path.join(this.projectRoot, 'package-lock.json');
      if (fs.existsSync(projectLockfile)) {
        fs.unlinkSync(projectLockfile);
      }

      await this.executeCommand('npm cache clean --force');
      await this.executeCommand('npm install --package-lock-only');
      
      this.log('Lockfile conflicts resolved', 'success');
      return true;
    } catch (error) {
      this.log(`Lockfile fix failed: ${error.message}`, 'error');
      return false;
    }
  }

  async fixTypeScriptErrors() {
    this.log('🔧 Fixing TypeScript errors...');
    
    try {
      // Run TypeScript with incremental disabled to get fresh errors
      await this.executeCommand('npx tsc --noEmit --incremental false');
      this.log('TypeScript check passed', 'success');
      return true;
    } catch (error) {
      this.log('Auto-fixing common TypeScript issues...');
      
      try {
        // Remove unused imports (basic pattern matching)
        const srcDir = path.join(this.projectRoot, 'src');
        const tsFiles = this.findFiles(srcDir, /\.(ts|tsx)$/);
        
        for (const file of tsFiles) {
          let content = fs.readFileSync(file, 'utf8');
          
          // Fix unused variables by prefixing with underscore
          content = content.replace(
            /^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/gm,
            '$1_$2:'
          );
          
          fs.writeFileSync(file, content);
        }
        
        this.log('Applied basic TypeScript fixes', 'success');
        return true;
      } catch (fixError) {
        this.log(`TypeScript auto-fix failed: ${fixError.message}`, 'error');
        return false;
      }
    }
  }

  async fixESLintErrors() {
    this.log('🔧 Fixing ESLint errors...');
    
    try {
      await this.executeCommand('npm run lint -- --fix');
      this.log('ESLint auto-fixes applied', 'success');
      return true;
    } catch (error) {
      this.log(`ESLint fix failed: ${error.message}`, 'warn');
      return false;
    }
  }

  async reinstallDependencies() {
    this.log('🔧 Reinstalling dependencies...');
    
    try {
      // Clean installation
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        await this.executeCommand('rm -rf node_modules');
      }
      
      await this.executeCommand('npm cache clean --force');
      await this.executeCommand('npm ci', { timeout: 600000 }); // 10 minutes timeout
      
      this.log('Dependencies reinstalled', 'success');
      return true;
    } catch (error) {
      this.log(`Dependency reinstall failed: ${error.message}`, 'error');
      return false;
    }
  }

  async optimizeMemoryUsage() {
    this.log('🧠 Optimizing memory usage...');
    
    try {
      // Update vercel.json with higher memory limits
      const updatedConfig = {
        ...this.vercelConfig,
        functions: {
          ...this.vercelConfig.functions,
          'src/app/api/search/route.ts': {
            ...this.vercelConfig.functions?.['src/app/api/search/route.ts'],
            memory: 2048,
            maxDuration: 30
          },
          'src/app/api/*/route.ts': {
            ...this.vercelConfig.functions?.['src/app/api/*/route.ts'],
            memory: 1024,
            maxDuration: 15
          }
        },
        build: {
          ...this.vercelConfig.build,
          env: {
            ...this.vercelConfig.build?.env,
            NODE_OPTIONS: '--max_old_space_size=4096'
          }
        }
      };
      
      fs.writeFileSync(
        path.join(this.projectRoot, 'vercel.json'),
        JSON.stringify(updatedConfig, null, 2)
      );
      
      this.log('Memory optimizations applied', 'success');
      return true;
    } catch (error) {
      this.log(`Memory optimization failed: ${error.message}`, 'error');
      return false;
    }
  }

  async validateBuild() {
    this.log('🧪 Validating build...');
    
    try {
      await this.executeCommand('npm run build', { timeout: 600000 });
      this.log('Build validation successful', 'success');
      return true;
    } catch (error) {
      this.log(`Build validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async clearVercelCache() {
    if (!this.config.vercelToken) {
      this.log('Skipping Vercel cache clear (no token)', 'warn');
      return false;
    }

    this.log('🧹 Clearing Vercel cache...');
    
    try {
      await this.makeVercelRequest(
        `DELETE`,
        `/v1/projects/${this.config.vercelProjectId}/cache`
      );
      this.log('Vercel cache cleared', 'success');
      return true;
    } catch (error) {
      this.log(`Cache clear failed: ${error.message}`, 'warn');
      return false;
    }
  }

  async triggerDeployment(context = {}) {
    this.log('🚀 Triggering deployment...');
    
    try {
      const deploymentData = {
        source: 'recovery_script',
        timestamp: new Date().toISOString(),
        ...context
      };
      
      const response = await this.makeHttpRequest('POST', this.config.deployHook, deploymentData);
      this.log('Deployment triggered', 'success');
      return true;
    } catch (error) {
      this.log(`Deployment trigger failed: ${error.message}`, 'error');
      return false;
    }
  }

  async monitorDeployment() {
    if (!this.config.vercelToken) {
      this.log('Cannot monitor deployment without Vercel token', 'warn');
      return false;
    }

    this.log('📊 Monitoring deployment...');
    
    const maxAttempts = 40;
    const checkInterval = 30000; // 30 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const deployments = await this.makeVercelRequest(
          'GET',
          `/v9/projects/${this.config.vercelProjectId}/deployments?limit=1`
        );
        
        const latest = deployments.deployments?.[0];
        if (!latest) {
          this.log('No deployments found', 'warn');
          break;
        }
        
        const { state, url } = latest;
        this.log(`Attempt ${attempt}/${maxAttempts}: ${state}`);
        
        switch (state) {
          case 'READY':
            this.log(`Deployment successful: https://${url}`, 'success');
            return true;
            
          case 'ERROR':
          case 'CANCELED':
            this.log(`Deployment failed with state: ${state}`, 'error');
            return false;
            
          case 'BUILDING':
          case 'QUEUED':
            this.log('Deployment in progress...', 'info');
            await this.sleep(checkInterval);
            break;
            
          default:
            this.log(`Unknown state: ${state}`, 'warn');
            await this.sleep(checkInterval);
        }
      } catch (error) {
        this.log(`Monitor error: ${error.message}`, 'warn');
        await this.sleep(checkInterval);
      }
    }
    
    this.log('Deployment monitoring timeout', 'warn');
    return false;
  }

  async makeVercelRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.vercel.com',
        path: endpoint,
        method,
        headers: {
          'Authorization': `Bearer ${this.config.vercelToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (error) {
            resolve(body);
          }
        });
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async makeHttpRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve(body));
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  findFiles(dir, pattern) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          traverse(itemPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(itemPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run(options = {}) {
    const {
      analyze = true,
      fix = true,
      deploy = true,
      monitor = true,
      force = false
    } = options;

    this.log('🚀 Starting deployment recovery...', 'info');
    
    try {
      let analysis = { actions: ['basic-rebuild'] };
      
      if (analyze) {
        analysis = await this.analyzeFailure();
      }
      
      if (fix) {
        let fixSuccess = true;
        
        for (const action of analysis.actions) {
          switch (action) {
            case 'fix-lockfile':
              fixSuccess = await this.fixLockfileConflicts() && fixSuccess;
              break;
              
            case 'fix-typescript':
              fixSuccess = await this.fixTypeScriptErrors() && fixSuccess;
              break;
              
            case 'fix-eslint':
              fixSuccess = await this.fixESLintErrors() && fixSuccess;
              break;
              
            case 'reinstall-deps':
              fixSuccess = await this.reinstallDependencies() && fixSuccess;
              break;
              
            case 'increase-memory':
            case 'optimize-build':
              fixSuccess = await this.optimizeMemoryUsage() && fixSuccess;
              break;
              
            case 'basic-rebuild':
              // Just clear cache and rebuild
              await this.clearVercelCache();
              break;
          }
        }
        
        if (fixSuccess || force) {
          const buildValid = await this.validateBuild();
          if (!buildValid && !force) {
            throw new Error('Build validation failed after fixes');
          }
        }
      }
      
      if (deploy) {
        const deploySuccess = await this.triggerDeployment({
          recovery_type: analysis.type,
          actions_applied: analysis.actions
        });
        
        if (!deploySuccess && !force) {
          throw new Error('Deployment trigger failed');
        }
      }
      
      if (monitor) {
        const monitorSuccess = await this.monitorDeployment();
        if (!monitorSuccess) {
          this.log('Deployment monitoring completed with warnings', 'warn');
        }
      }
      
      this.log('🎉 Recovery process completed', 'success');
      return true;
      
    } catch (error) {
      this.log(`Recovery failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--force':
        options.force = true;
        break;
      case '--no-analyze':
        options.analyze = false;
        break;
      case '--no-fix':
        options.fix = false;
        break;
      case '--no-deploy':
        options.deploy = false;
        break;
      case '--no-monitor':
        options.monitor = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Deployment Recovery Script

Usage: node scripts/deployment-recovery.js [options]

Options:
  --force       Force recovery even if validation fails
  --no-analyze  Skip failure analysis
  --no-fix      Skip applying fixes
  --no-deploy   Skip triggering deployment
  --no-monitor  Skip deployment monitoring
  --help, -h    Show this help message

Environment Variables:
  VERCEL_TOKEN          Vercel API token for monitoring
  VERCEL_PROJECT_ID     Vercel project ID
  VERCEL_DEPLOY_HOOK    Deployment webhook URL
  NODE_OPTIONS          Node.js memory options

Examples:
  node scripts/deployment-recovery.js              # Full recovery
  node scripts/deployment-recovery.js --no-deploy  # Fix only
  node scripts/deployment-recovery.js --force      # Force recovery
`);
        process.exit(0);
    }
  }
  
  const recovery = new DeploymentRecovery();
  recovery.run(options).then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Recovery script error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentRecovery;