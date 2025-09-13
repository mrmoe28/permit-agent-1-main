import Foundation
import SwiftUI

// MARK: - Settings Model
struct AppSettings: Codable {
    // General Settings
    var defaultProjectLocation: String
    var preferredEditor: Editor
    var openInEditorAfterCreation: Bool
    
    // Package Manager Settings
    var packageManager: PackageManager
    var autoInstallDependencies: Bool
    var autoRunDevServer: Bool
    
    // Git Settings
    var autoInitGitRepo: Bool
    var defaultBranch: String
    var commitAfterCreation: Bool
    
    // UI Settings
    var theme: AppTheme
    var showProjectPreview: Bool
    var confirmBeforeCreation: Bool
    
    // Recent Projects Settings
    var maxRecentProjects: Int
    var cleanupDeletedProjects: Bool
    var showGitStatus: Bool
    
    // Advanced Settings
    var enableDebugLogging: Bool
    var terminalApp: TerminalApp

    // Auto-update Settings
    var autoCheckForUpdates: Bool
    var notifyOnUpdates: Bool

    // AI Settings
    var openAIAPIKey: String
    var enableAIFeatures: Bool
    var aiModel: String
    
    // Default values
    static let defaults = AppSettings(
        defaultProjectLocation: FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first!.path,
        preferredEditor: .cursor,
        openInEditorAfterCreation: true,
        packageManager: .npm,
        autoInstallDependencies: false,
        autoRunDevServer: false,
        autoInitGitRepo: true,
        defaultBranch: "main",
        commitAfterCreation: false,
        theme: .system,
        showProjectPreview: true,
        confirmBeforeCreation: false,
        maxRecentProjects: 50,
        cleanupDeletedProjects: true,
        showGitStatus: true,
        enableDebugLogging: false,
        terminalApp: .terminal,
        autoCheckForUpdates: true,
        notifyOnUpdates: true,
        openAIAPIKey: "",
        enableAIFeatures: false,
        aiModel: "gpt-4o"
    )
}

// MARK: - Supporting Types
enum PackageManager: String, CaseIterable, Codable {
    case npm = "npm"
    case yarn = "yarn"
    case pnpm = "pnpm"
    case bun = "bun"
    
    var displayName: String {
        switch self {
        case .npm: return "npm"
        case .yarn: return "Yarn"
        case .pnpm: return "pnpm"
        case .bun: return "Bun"
        }
    }
    
    var installCommand: String {
        switch self {
        case .npm: return "npm install"
        case .yarn: return "yarn install"
        case .pnpm: return "pnpm install"
        case .bun: return "bun install"
        }
    }
    
    var isInstalled: Bool {
        // Check multiple possible locations
        let possiblePaths = [
            "/usr/local/bin/\(self.rawValue)",
            "/opt/homebrew/bin/\(self.rawValue)",
            "/usr/bin/\(self.rawValue)",
            "~/.bun/bin/\(self.rawValue)"
        ]
        
        // First check if any of the common paths exist
        for path in possiblePaths {
            let expandedPath = NSString(string: path).expandingTildeInPath
            if FileManager.default.fileExists(atPath: expandedPath) {
                return true
            }
        }
        
        // Fallback to which command
        let result = Process()
        result.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        result.arguments = [self.rawValue]
        
        let pipe = Pipe()
        result.standardOutput = pipe
        result.standardError = pipe
        
        do {
            try result.run()
            result.waitUntilExit()
            return result.terminationStatus == 0
        } catch {
            return false
        }
    }
}

enum AppTheme: String, CaseIterable, Codable {
    case light = "Light"
    case dark = "Dark"
    case system = "System"
}

enum TerminalApp: String, CaseIterable, Codable {
    case terminal = "Terminal"
    case iterm = "iTerm"
    case warp = "Warp"
    case hyper = "Hyper"
    
    var bundleIdentifier: String {
        switch self {
        case .terminal: return "com.apple.Terminal"
        case .iterm: return "com.googlecode.iterm2"
        case .warp: return "dev.warp.Warp-Stable"
        case .hyper: return "co.zeit.hyper"
        }
    }
    
    var isInstalled: Bool {
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleIdentifier) != nil
    }
}

// MARK: - Settings Service
class SettingsService: ObservableObject {
    static let shared = SettingsService()
    
    @Published var settings: AppSettings {
        didSet {
            saveSettings()
        }
    }
    
    private let settingsKey = "com.templatemanager.settings"
    
    private init() {
        self.settings = Self.loadSettings()
    }
    
    // MARK: - Public Methods
    
    func resetToDefaults() {
        settings = AppSettings.defaults
    }
    
    func exportSettings(to url: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(settings)
        try data.write(to: url)
    }
    
    func importSettings(from url: URL) throws {
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        settings = try decoder.decode(AppSettings.self, from: data)
    }
    
    // MARK: - Private Methods
    
    private static func loadSettings() -> AppSettings {
        let settingsKey = "com.templatemanager.settings"
        guard let data = UserDefaults.standard.data(forKey: settingsKey),
              let settings = try? JSONDecoder().decode(AppSettings.self, from: data) else {
            return AppSettings.defaults
        }
        return settings
    }
    
    private func saveSettings() {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: settingsKey)
    }
    
    // MARK: - Convenience Methods
    
    func getDefaultProjectURL() -> URL {
        URL(fileURLWithPath: settings.defaultProjectLocation)
    }
    
    func getAvailablePackageManagers() -> [PackageManager] {
        PackageManager.allCases.filter { $0.isInstalled }
    }
    
    func getAvailableTerminalApps() -> [TerminalApp] {
        TerminalApp.allCases.filter { $0.isInstalled }
    }
    
    func shouldShowConfirmation() -> Bool {
        settings.confirmBeforeCreation
    }
    
    func applyTheme() {
        // This would be called to apply theme changes
        // For now, we'll rely on SwiftUI's automatic handling
    }
}

// MARK: - UserDefaults Extension for Debugging
extension SettingsService {
    func printCurrentSettings() {
        if settings.enableDebugLogging {
            print("=== Current Settings ===")
            print("Default Location: \(settings.defaultProjectLocation)")
            print("Preferred Editor: \(settings.preferredEditor.rawValue)")
            print("Package Manager: \(settings.packageManager.rawValue)")
            print("Auto Install: \(settings.autoInstallDependencies)")
            print("Theme: \(settings.theme.rawValue)")
            print("======================")
        }
    }
}