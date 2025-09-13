import Foundation
import SwiftUI

@MainActor
class UpdateService: ObservableObject {
    static let shared = UpdateService()
    
    @Published var updateAvailable = false
    @Published var latestVersion: String?
    @Published var downloadURL: String?
    @Published var releaseNotes: String?
    @Published var isChecking = false
    
    private let githubRepo = "mrmoe28/templatemanager"
    private let currentVersion: String
    
    init() {
        // Get current version from Info.plist
        if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
            self.currentVersion = version
        } else {
            self.currentVersion = "1.0.0"
        }
    }
    
    func checkForUpdates(silent: Bool = false) async {
        guard !isChecking else { return }
        
        isChecking = true
        defer { isChecking = false }
        
        do {
            // Fetch latest release from GitHub API
            guard let url = URL(string: "https://api.github.com/repos/\(githubRepo)/releases/latest") else {
                throw NSError(domain: "UpdateService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
            }
            
            var request = URLRequest(url: url)
            request.setValue("application/vnd.github.v3+json", forHTTPHeaderField: "Accept")
            
            let (data, _) = try await URLSession.shared.data(for: request)
            
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let tagName = json["tag_name"] as? String {
                
                // Remove 'v' prefix if present
                let latestVersionString = tagName.hasPrefix("v") ? String(tagName.dropFirst()) : tagName
                self.latestVersion = latestVersionString
                
                // Compare versions
                if isNewerVersion(latestVersionString, than: currentVersion) {
                    self.updateAvailable = true
                    
                    // Get download URL for DMG
                    if let assets = json["assets"] as? [[String: Any]] {
                        for asset in assets {
                            if let name = asset["name"] as? String,
                               name.hasSuffix(".dmg"),
                               let downloadURL = asset["browser_download_url"] as? String {
                                self.downloadURL = downloadURL
                                break
                            }
                        }
                    }
                    
                    // Get release notes
                    if let body = json["body"] as? String {
                        self.releaseNotes = body
                    }
                    
                    if !silent {
                        // Show update notification
                        showUpdateNotification()
                    }
                } else {
                    self.updateAvailable = false
                    if !silent {
                        // Show "up to date" message
                        showUpToDateNotification()
                    }
                }
            }
        } catch {
            print("Failed to check for updates: \(error)")
            if !silent {
                showErrorNotification(error)
            }
        }
    }
    
    private func isNewerVersion(_ version1: String, than version2: String) -> Bool {
        let v1Components = version1.split(separator: ".").compactMap { Int($0) }
        let v2Components = version2.split(separator: ".").compactMap { Int($0) }
        
        let maxCount = max(v1Components.count, v2Components.count)
        
        for i in 0..<maxCount {
            let v1Value = i < v1Components.count ? v1Components[i] : 0
            let v2Value = i < v2Components.count ? v2Components[i] : 0
            
            if v1Value > v2Value {
                return true
            } else if v1Value < v2Value {
                return false
            }
        }
        
        return false
    }
    
    private func showUpdateNotification() {
        Task { @MainActor in
            let alert = NSAlert()
            alert.messageText = "Update Available"
            alert.informativeText = "Template Manager \(latestVersion ?? "") is available. You are currently running version \(currentVersion)."
            alert.alertStyle = .informational
            alert.addButton(withTitle: "Download Update")
            alert.addButton(withTitle: "Later")
            
            let response = alert.runModal()
            if response == .alertFirstButtonReturn {
                downloadAndInstallUpdate()
            }
        }
    }
    
    private func showUpToDateNotification() {
        Task { @MainActor in
            let alert = NSAlert()
            alert.messageText = "You're up to date!"
            alert.informativeText = "Template Manager \(currentVersion) is the latest version."
            alert.alertStyle = .informational
            alert.addButton(withTitle: "OK")
            alert.runModal()
        }
    }
    
    private func showErrorNotification(_ error: Error) {
        Task { @MainActor in
            let alert = NSAlert()
            alert.messageText = "Update Check Failed"
            alert.informativeText = "Unable to check for updates: \(error.localizedDescription)"
            alert.alertStyle = .warning
            alert.addButton(withTitle: "OK")
            alert.runModal()
        }
    }
    
    func downloadAndInstallUpdate() {
        guard let downloadURL = downloadURL,
              let url = URL(string: downloadURL) else {
            return
        }
        
        // Open the download URL in the default browser
        NSWorkspace.shared.open(url)
        
        // Show instructions
        Task { @MainActor in
            let alert = NSAlert()
            alert.messageText = "Downloading Update"
            alert.informativeText = """
            The update is being downloaded in your browser.
            
            Once downloaded:
            1. Quit Template Manager
            2. Open the downloaded DMG file
            3. Drag Template Manager to Applications
            4. Restart Template Manager
            """
            alert.alertStyle = .informational
            alert.addButton(withTitle: "OK")
            alert.runModal()
        }
    }
}

// MARK: - Settings Integration
extension UpdateService {
    func enableAutoUpdateCheck(_ enabled: Bool) {
        if enabled {
            // Schedule daily update checks
            scheduleAutoUpdateChecks()
        } else {
            // Cancel scheduled checks
            cancelAutoUpdateChecks()
        }
    }
    
    private func scheduleAutoUpdateChecks() {
        // Check on app launch
        Task {
            await checkForUpdates(silent: true)
        }
        
        // Schedule daily checks
        Timer.scheduledTimer(withTimeInterval: 86400, repeats: true) { _ in
            Task {
                await self.checkForUpdates(silent: true)
            }
        }
    }
    
    private func cancelAutoUpdateChecks() {
        // Implementation depends on how timers are stored
        // For now, this is handled by the settings
    }
}