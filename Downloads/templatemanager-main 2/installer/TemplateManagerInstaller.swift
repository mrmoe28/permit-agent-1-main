#!/usr/bin/swift

import Foundation
import AppKit
import SwiftUI

// MARK: - Installer Logic
class InstallerManager: ObservableObject {
    @Published var installationProgress: Double = 0
    @Published var statusMessage: String = "Ready to install"
    @Published var isInstalling: Bool = false
    @Published var installationComplete: Bool = false
    @Published var errorMessage: String? = nil

    private let appName = "Template Manager"
    private let bundleName = "TemplateManager.app"
    private let destinationPath = "/Applications"

    func install() {
        Task { @MainActor in
            isInstalling = true
            errorMessage = nil

            do {
                // Step 1: Check for existing installation
                updateStatus("Checking for existing installation...", progress: 0.1)
                try await checkAndRemoveExisting()

                // Step 2: Copy app to Applications
                updateStatus("Installing Template Manager...", progress: 0.3)
                try await copyAppToApplications()

                // Step 3: Set up launch agent for auto-updates
                updateStatus("Configuring auto-updates...", progress: 0.5)
                try await setupLaunchAgent()

                // Step 4: Create necessary directories
                updateStatus("Creating support directories...", progress: 0.7)
                try await createSupportDirectories()

                // Step 5: Set permissions
                updateStatus("Setting permissions...", progress: 0.85)
                try await setPermissions()

                // Step 6: Launch the app
                updateStatus("Installation complete!", progress: 1.0)
                installationComplete = true

                // Wait a moment before launching
                try await Task.sleep(nanoseconds: 1_000_000_000)
                launchApp()

            } catch {
                errorMessage = "Installation failed: \(error.localizedDescription)"
                statusMessage = "Installation failed"
                isInstalling = false
            }
        }
    }

    private func updateStatus(_ message: String, progress: Double) {
        statusMessage = message
        installationProgress = progress
    }

    private func checkAndRemoveExisting() async throws {
        let fileManager = FileManager.default
        let existingPath = "\(destinationPath)/\(bundleName)"

        if fileManager.fileExists(atPath: existingPath) {
            // Ask user permission to replace
            let alert = NSAlert()
            alert.messageText = "Replace Existing Installation?"
            alert.informativeText = "Template Manager is already installed. Would you like to replace it with this version?"
            alert.alertStyle = .warning
            alert.addButton(withTitle: "Replace")
            alert.addButton(withTitle: "Cancel")

            let response = alert.runModal()
            if response == .alertFirstButtonReturn {
                try fileManager.removeItem(atPath: existingPath)
            } else {
                throw InstallerError.userCancelled
            }
        }
    }

    private func copyAppToApplications() async throws {
        let fileManager = FileManager.default

        // Find the app bundle in the DMG
        guard let dmgPath = findAppInDMG() else {
            throw InstallerError.appNotFound
        }

        let destinationURL = URL(fileURLWithPath: "\(destinationPath)/\(bundleName)")

        try fileManager.copyItem(at: URL(fileURLWithPath: dmgPath), to: destinationURL)
    }

    private func findAppInDMG() -> String? {
        let fileManager = FileManager.default

        // Check common DMG mount points
        let volumes = fileManager.urls(for: .directoryURL, in: .localDomainMask)

        // Look for the app in /Volumes/Template Manager/
        let potentialPaths = [
            "/Volumes/Template Manager/\(bundleName)",
            "/Volumes/TemplateManager/\(bundleName)",
            Bundle.main.bundlePath.replacingOccurrences(of: "TemplateManagerInstaller.app", with: bundleName)
        ]

        for path in potentialPaths {
            if fileManager.fileExists(atPath: path) {
                return path
            }
        }

        // If running from DMG, look in the same directory
        let currentPath = Bundle.main.bundlePath
        let parentDir = (currentPath as NSString).deletingLastPathComponent
        let appPath = "\(parentDir)/\(bundleName)"

        if fileManager.fileExists(atPath: appPath) {
            return appPath
        }

        return nil
    }

    private func setupLaunchAgent() async throws {
        let launchAgentPath = NSHomeDirectory() + "/Library/LaunchAgents"
        let plistPath = "\(launchAgentPath)/com.ekodevapps.templatemanager.plist"

        // Create LaunchAgents directory if it doesn't exist
        try FileManager.default.createDirectory(atPath: launchAgentPath,
                                               withIntermediateDirectories: true)

        let plistContent = """
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <dict>
            <key>Label</key>
            <string>com.ekodevapps.templatemanager</string>
            <key>ProgramArguments</key>
            <array>
                <string>/Applications/TemplateManager.app/Contents/MacOS/TemplateManager</string>
                <string>--check-updates</string>
            </array>
            <key>RunAtLoad</key>
            <false/>
            <key>StartCalendarInterval</key>
            <dict>
                <key>Hour</key>
                <integer>12</integer>
                <key>Minute</key>
                <integer>0</integer>
            </dict>
        </dict>
        </plist>
        """

        try plistContent.write(toFile: plistPath, atomically: true, encoding: .utf8)
    }

    private func createSupportDirectories() async throws {
        let fileManager = FileManager.default
        let supportPaths = [
            NSHomeDirectory() + "/Library/Application Support/Template Manager",
            NSHomeDirectory() + "/.templatemanager",
            NSHomeDirectory() + "/.templatemanager/templates",
            NSHomeDirectory() + "/.templatemanager/backups"
        ]

        for path in supportPaths {
            try fileManager.createDirectory(atPath: path,
                                           withIntermediateDirectories: true)
        }
    }

    private func setPermissions() async throws {
        let appPath = "\(destinationPath)/\(bundleName)"
        let executablePath = "\(appPath)/Contents/MacOS/TemplateManager"

        // Make executable
        let process = Process()
        process.launchPath = "/bin/chmod"
        process.arguments = ["+x", executablePath]

        try process.run()
        process.waitUntilExit()

        // Remove quarantine attribute
        let xattrProcess = Process()
        xattrProcess.launchPath = "/usr/bin/xattr"
        xattrProcess.arguments = ["-cr", appPath]

        try xattrProcess.run()
        xattrProcess.waitUntilExit()
    }

    private func launchApp() {
        let appPath = "\(destinationPath)/\(bundleName)"
        NSWorkspace.shared.openApplication(at: URL(fileURLWithPath: appPath),
                                          configuration: NSWorkspace.OpenConfiguration())

        // Quit installer after launching the app
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            NSApplication.shared.terminate(nil)
        }
    }
}

enum InstallerError: LocalizedError {
    case userCancelled
    case appNotFound
    case installationFailed(String)

    var errorDescription: String? {
        switch self {
        case .userCancelled:
            return "Installation cancelled by user"
        case .appNotFound:
            return "Could not find Template Manager app in DMG"
        case .installationFailed(let reason):
            return "Installation failed: \(reason)"
        }
    }
}

// MARK: - SwiftUI Interface
struct InstallerView: View {
    @StateObject private var installer = InstallerManager()
    @State private var showingError = false

    var body: some View {
        VStack(spacing: 30) {
            // App icon and title
            VStack(spacing: 15) {
                Image(systemName: "app.badge.checkmark")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                    .symbolRenderingMode(.hierarchical)

                Text("Template Manager Installer")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Version 1.0.0")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Installation status
            VStack(spacing: 20) {
                if installer.isInstalling {
                    ProgressView(value: installer.installationProgress) {
                        Text(installer.statusMessage)
                            .font(.headline)
                    }
                    .progressViewStyle(.linear)
                    .frame(width: 300)

                    if installer.installationProgress < 1 {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                } else if installer.installationComplete {
                    VStack(spacing: 15) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.green)

                        Text("Installation Complete!")
                            .font(.headline)

                        Text("Template Manager has been installed and will launch automatically.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                } else {
                    VStack(spacing: 15) {
                        Text("Ready to Install")
                            .font(.headline)

                        Text("Template Manager will be installed to your Applications folder.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Text("The installer will:")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        VStack(alignment: .leading, spacing: 8) {
                            Label("Copy app to Applications", systemImage: "folder")
                            Label("Set up auto-updates", systemImage: "arrow.triangle.2.circlepath")
                            Label("Create support directories", systemImage: "folder.badge.plus")
                            Label("Configure permissions", systemImage: "lock.shield")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                }
            }

            // Action buttons
            HStack(spacing: 20) {
                if !installer.isInstalling && !installer.installationComplete {
                    Button("Cancel") {
                        NSApplication.shared.terminate(nil)
                    }
                    .keyboardShortcut(.escape)

                    Button("Install") {
                        installer.install()
                    }
                    .keyboardShortcut(.return)
                    .buttonStyle(.borderedProminent)
                    .disabled(installer.isInstalling)
                }
            }
        }
        .padding(40)
        .frame(width: 500, height: 450)
        .alert("Installation Error", isPresented: .constant(installer.errorMessage != nil)) {
            Button("OK") {
                installer.errorMessage = nil
            }
        } message: {
            Text(installer.errorMessage ?? "Unknown error")
        }
    }
}

// MARK: - App Delegate
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create the window
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 500, height: 450),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )

        window.title = "Template Manager Installer"
        window.center()
        window.contentView = NSHostingView(rootView: InstallerView())
        window.makeKeyAndOrderFront(nil)

        // Make sure the app appears in front
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// MARK: - Main
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()