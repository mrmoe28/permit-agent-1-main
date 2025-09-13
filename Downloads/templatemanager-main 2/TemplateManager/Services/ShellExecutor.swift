import Foundation

class ShellExecutor {
    static func execute(script: String, arguments: [String] = [], currentDirectory: String? = nil, input: String? = nil) async throws -> (output: String, error: String) {
        return try await withCheckedThrowingContinuation { continuation in
            let task = Process()
            let outputPipe = Pipe()
            let errorPipe = Pipe()
            let inputPipe = Pipe()
            
            task.standardOutput = outputPipe
            task.standardError = errorPipe
            task.standardInput = inputPipe
            task.executableURL = URL(fileURLWithPath: "/bin/bash")
            task.arguments = ["-l", "-c", script] + arguments
            
            if let currentDirectory = currentDirectory {
                task.currentDirectoryURL = URL(fileURLWithPath: currentDirectory)
            }
            
            do {
                try task.run()
                
                // Send input if provided
                if let input = input {
                    inputPipe.fileHandleForWriting.write(input.data(using: .utf8)!)
                    inputPipe.fileHandleForWriting.closeFile()
                }
                
                task.waitUntilExit()
                
                let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
                let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
                
                let output = String(data: outputData, encoding: .utf8) ?? ""
                let error = String(data: errorData, encoding: .utf8) ?? ""
                
                continuation.resume(returning: (output, error))
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    static func runSetupScript(templateName: String, projectPath: String, scriptPath: String) async throws -> String {
        let script = """
        cd "\(projectPath)" && echo "\(templateName)" | "\(scriptPath)"
        """
        
        let result = try await execute(script: script)
        return result.output + result.error
    }
    
    static func checkEditorInstalled(editor: Editor) -> Bool {
        let checkCommand: String
        
        switch editor {
        case .vscode:
            checkCommand = "which code || ls '/Applications/Visual Studio Code.app' 2>/dev/null"
        case .cursor:
            checkCommand = "which cursor || ls '/Applications/Cursor.app' 2>/dev/null"
        case .claude:
            checkCommand = "which claude"
        }
        
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/bin/bash")
        task.arguments = ["-c", checkCommand]
        
        do {
            try task.run()
            task.waitUntilExit()
            return task.terminationStatus == 0
        } catch {
            return false
        }
    }
    
    static func openInEditor(projectPath: String, editor: Editor) async throws {
        await MainActor.run {
            var errorDict: NSDictionary?
            
            switch editor {
            case .vscode:
                let script = """
                tell application "Visual Studio Code"
                    activate
                    open POSIX file "\(projectPath)"
                end tell
                """
                
                if let appleScript = NSAppleScript(source: script) {
                    appleScript.executeAndReturnError(&errorDict)
                    if errorDict != nil {
                        // Fallback to shell command
                        Task {
                            _ = try? await execute(script: "open -a 'Visual Studio Code' '\(projectPath)'")
                        }
                    }
                }
                
            case .cursor:
                let script = """
                tell application "Cursor"
                    activate
                    open POSIX file "\(projectPath)"
                end tell
                """
                
                if let appleScript = NSAppleScript(source: script) {
                    appleScript.executeAndReturnError(&errorDict)
                    if let error = errorDict {
                        print("AppleScript error: \(error)")
                        // Fallback to opening Cursor first, then the folder
                        Task {
                            // First open Cursor
                            _ = try? await execute(script: "open -a Cursor")
                            // Wait a moment for it to launch
                            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                            // Then try to open the project
                            _ = try? await execute(script: "open -a Cursor '\(projectPath)'")
                        }
                    }
                }
                
            case .claude:
                // Claude still uses command line
                Task {
                    _ = try? await execute(script: "claude '\(projectPath)'")
                }
            }
        }
    }
}

enum Editor: String, CaseIterable, Codable {
    case vscode = "VS Code"
    case cursor = "Cursor"
    case claude = "Claude Code"
}