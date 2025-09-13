import Foundation
import AppKit

class VercelService: ObservableObject {
    static let shared = VercelService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: String?
    
    private init() {
        Task {
            await checkAuthentication()
        }
    }
    
    // MARK: - Authentication
    
    func checkAuthentication() async {
        do {
            let result = try await ShellExecutor.execute(script: "vercel whoami")
            let output = result.output.trimmingCharacters(in: .whitespacesAndNewlines)
            
            await MainActor.run {
                if !output.isEmpty && !output.contains("Error") && !output.contains("not found") {
                    self.isAuthenticated = true
                    self.currentUser = output
                } else {
                    self.isAuthenticated = false
                    self.currentUser = nil
                }
            }
        } catch {
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
            }
        }
    }
    
    func login() async throws {
        // Vercel CLI login is interactive, so we'll guide the user
        let alert = await MainActor.run {
            let alert = NSAlert()
            alert.messageText = "Vercel Login Required"
            alert.informativeText = """
            To deploy to Vercel, you need to authenticate using the Vercel CLI.
            
            Please run the following command in Terminal:
            vercel login
            
            After logging in, click 'Check Authentication' to continue.
            """
            alert.alertStyle = .informational
            alert.addButton(withTitle: "Open Terminal")
            alert.addButton(withTitle: "Check Authentication")
            alert.addButton(withTitle: "Cancel")
            return alert
        }
        
        let response = await MainActor.run { alert.runModal() }
        
        switch response {
        case .alertFirstButtonReturn:
            // Open Terminal with the command
            let script = """
            tell application "Terminal"
                activate
                do script "vercel login"
            end tell
            """
            
            let appleScript = NSAppleScript(source: script)
            appleScript?.executeAndReturnError(nil)
            
        case .alertSecondButtonReturn:
            // Check authentication
            await checkAuthentication()
            if !isAuthenticated {
                throw VercelError.notAuthenticated
            }
            
        default:
            throw VercelError.cancelled
        }
    }
    
    func logout() async throws {
        let result = try await ShellExecutor.execute(script: "vercel logout")
        if result.error.contains("Error") {
            throw VercelError.logoutFailed(result.error)
        }
        
        await MainActor.run {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
    
    // MARK: - CLI Installation Check
    
    static func checkCLIInstalled() -> Bool {
        let result = Process()
        result.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        result.arguments = ["vercel"]
        
        let pipe = Pipe()
        result.standardOutput = pipe
        result.standardError = pipe
        
        do {
            try result.run()
            result.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""
            
            return !output.isEmpty && result.terminationStatus == 0
        } catch {
            return false
        }
    }
    
    static func showInstallInstructions() {
        let alert = NSAlert()
        alert.messageText = "Vercel CLI Not Found"
        alert.informativeText = """
        The Vercel CLI is required for deployment features.
        
        To install Vercel CLI, run one of these commands in Terminal:
        
        Using npm:
        npm i -g vercel
        
        Using Homebrew:
        brew install vercel-cli
        
        Using yarn:
        yarn global add vercel
        """
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
    
    // MARK: - Deployment
    
    func deployProject(at path: String, configuration: VercelConfiguration) async throws -> DeploymentResult {
        // First, check if we're authenticated
        if !isAuthenticated {
            throw VercelError.notAuthenticated
        }
        
        // Build the deployment command
        var command = "cd \"\(path)\" && vercel"
        
        // Add configuration flags
        if configuration.projectName != nil {
            command += " --name \"\(configuration.projectName!)\""
        }
        
        if configuration.isProduction {
            command += " --prod"
        }
        
        // Add --yes flag to skip interactive prompts
        command += " --yes"
        
        // Execute deployment
        let result = try await ShellExecutor.execute(script: command)
        
        // Parse the output to get the deployment URL
        let output = result.output
        if let deploymentURL = parseDeploymentURL(from: output) {
            return DeploymentResult(
                url: deploymentURL,
                projectName: configuration.projectName ?? "",
                isProduction: configuration.isProduction
            )
        } else if result.error.contains("Error") {
            throw VercelError.deploymentFailed(result.error)
        } else {
            throw VercelError.deploymentFailed("Could not parse deployment URL from output")
        }
    }
    
    func linkProject(at path: String, projectName: String) async throws {
        let command = "cd \"\(path)\" && vercel link --yes"
        let result = try await ShellExecutor.execute(script: command)
        
        if result.error.contains("Error") {
            throw VercelError.linkFailed(result.error)
        }
    }
    
    func setEnvironmentVariables(at path: String, variables: [String: String]) async throws {
        for (key, value) in variables {
            let command = "cd \"\(path)\" && vercel env add \(key) production preview development <<< \"\(value)\""
            let result = try await ShellExecutor.execute(script: command)
            
            if result.error.contains("Error") {
                throw VercelError.envVarFailed(key, result.error)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func parseDeploymentURL(from output: String) -> String? {
        // Vercel CLI outputs the deployment URL in the format:
        // "Ready! Available at https://project-name.vercel.app"
        // or "Production: https://project-name.vercel.app"
        
        let lines = output.components(separatedBy: .newlines)
        for line in lines {
            if line.contains("https://") && line.contains(".vercel.app") {
                // Extract URL using regex or string manipulation
                if let range = line.range(of: "https://[^ ]+", options: .regularExpression) {
                    return String(line[range])
                }
            }
        }
        
        return nil
    }
}

// MARK: - Supporting Types

struct VercelConfiguration {
    var projectName: String?
    var isProduction: Bool = false
    var environmentVariables: [String: String] = [:]
    var buildCommand: String?
    var outputDirectory: String?
    var framework: String?
}

struct DeploymentResult {
    let url: String
    let projectName: String
    let isProduction: Bool
}

enum VercelError: LocalizedError {
    case notAuthenticated
    case cancelled
    case deploymentFailed(String)
    case linkFailed(String)
    case envVarFailed(String, String)
    case logoutFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Not authenticated with Vercel. Please login first."
        case .cancelled:
            return "Operation cancelled by user."
        case .deploymentFailed(let message):
            return "Deployment failed: \(message)"
        case .linkFailed(let message):
            return "Failed to link project: \(message)"
        case .envVarFailed(let key, let message):
            return "Failed to set environment variable '\(key)': \(message)"
        case .logoutFailed(let message):
            return "Failed to logout: \(message)"
        }
    }
}