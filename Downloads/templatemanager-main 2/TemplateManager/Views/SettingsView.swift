import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @StateObject private var settingsService = SettingsService.shared
    @StateObject private var updateService = UpdateService.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedTab = "general"
    @State private var showingLocationPicker = false
    @State private var showingExportPanel = false
    @State private var showingImportPanel = false
    @State private var showingResetConfirmation = false
    
    // MARK: - Package Manager Installation
    private func installPackageManager(_ packageManager: PackageManager) {
        let installCommands = [
            PackageManager.npm: "brew install node",
            PackageManager.yarn: "brew install yarn", 
            PackageManager.pnpm: "brew install pnpm",
            PackageManager.bun: "curl -fsSL https://bun.sh/install | bash"
        ]
        
        let command = installCommands[packageManager] ?? "Please install \(packageManager.displayName) manually"
        
        // Show installation dialog
        let alert = NSAlert()
        alert.messageText = "Install \(packageManager.displayName)"
        alert.informativeText = "Run this command in Terminal to install \(packageManager.displayName):\n\n\(command)"
        alert.addButton(withTitle: "Copy Command")
        alert.addButton(withTitle: "Open Terminal")
        alert.addButton(withTitle: "Cancel")
        
        let response = alert.runModal()
        
        switch response {
        case .alertFirstButtonReturn:
            // Copy to clipboard
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(command, forType: .string)
        case .alertSecondButtonReturn:
            // Open Terminal with command
            let script = """
            tell application "Terminal"
                activate
                do script "\(command)"
            end tell
            """
            if let appleScript = NSAppleScript(source: script) {
                appleScript.executeAndReturnError(nil)
            }
        default:
            break
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Settings")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
            }
            .padding()
            
            Divider()
            
            // Tab Selection
            HStack(spacing: 20) {
                SettingsTab(title: "General", icon: "gear", isSelected: selectedTab == "general") {
                    selectedTab = "general"
                }
                SettingsTab(title: "Package Manager", icon: "shippingbox", isSelected: selectedTab == "package") {
                    selectedTab = "package"
                }
                SettingsTab(title: "Git", icon: "arrow.triangle.branch", isSelected: selectedTab == "git") {
                    selectedTab = "git"
                }
                SettingsTab(title: "Appearance", icon: "paintbrush", isSelected: selectedTab == "appearance") {
                    selectedTab = "appearance"
                }
                SettingsTab(title: "Advanced", icon: "gearshape.2", isSelected: selectedTab == "advanced") {
                    selectedTab = "advanced"
                }
            }
            .padding()
            
            Divider()
            
            // Content
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    switch selectedTab {
                    case "general":
                        generalSettings
                    case "package":
                        packageManagerSettings
                    case "git":
                        gitSettings
                    case "appearance":
                        appearanceSettings
                    case "advanced":
                        advancedSettings
                    default:
                        EmptyView()
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            
            Divider()
            
            // Footer Actions
            HStack {
                Button("Reset to Defaults") {
                    showingResetConfirmation = true
                }
                .foregroundColor(.red)
                
                Spacer()
                
                Button("Import...") {
                    showingImportPanel = true
                }
                
                Button("Export...") {
                    showingExportPanel = true
                }
            }
            .padding()
        }
        .frame(width: 700, height: 600)
        .alert("Reset Settings", isPresented: $showingResetConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Reset", role: .destructive) {
                settingsService.resetToDefaults()
            }
        } message: {
            Text("Are you sure you want to reset all settings to their default values?")
        }
        .fileImporter(isPresented: $showingImportPanel, allowedContentTypes: [.json]) { result in
            switch result {
            case .success(let url):
                do {
                    try settingsService.importSettings(from: url)
                } catch {
                    // Handle error
                }
            case .failure:
                break
            }
        }
        .fileExporter(
            isPresented: $showingExportPanel,
            document: SettingsDocument(settings: settingsService.settings),
            contentType: .json,
            defaultFilename: "template-manager-settings.json"
        ) { _ in }
    }
    
    // MARK: - General Settings
    var generalSettings: some View {
        VStack(alignment: .leading, spacing: 15) {
            SettingsSection(title: "Project Creation") {
                // Default Project Location
                VStack(alignment: .leading, spacing: 5) {
                    Text("Default Project Location")
                        .font(.headline)
                    HStack {
                        Text(settingsService.settings.defaultProjectLocation)
                            .lineLimit(1)
                            .truncationMode(.middle)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(Color(NSColor.controlBackgroundColor))
                            .cornerRadius(5)
                        
                        Button("Choose...") {
                            chooseDefaultLocation()
                        }
                    }
                }
                
                // Preferred Editor
                VStack(alignment: .leading, spacing: 5) {
                    Text("Preferred Editor")
                        .font(.headline)
                    Picker("", selection: $settingsService.settings.preferredEditor) {
                        ForEach(Editor.allCases, id: \.self) { editor in
                            Text(editor.rawValue).tag(editor)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                Toggle("Open in editor after creation", isOn: $settingsService.settings.openInEditorAfterCreation)
                Toggle("Show project preview before creation", isOn: $settingsService.settings.showProjectPreview)
                Toggle("Confirm before creating project", isOn: $settingsService.settings.confirmBeforeCreation)
            }
            
            SettingsSection(title: "Recent Projects") {
                HStack {
                    Text("Maximum recent projects")
                    TextField("", value: $settingsService.settings.maxRecentProjects, format: .number)
                        .frame(width: 60)
                        .textFieldStyle(.roundedBorder)
                }
                
                Toggle("Automatically cleanup deleted projects", isOn: $settingsService.settings.cleanupDeletedProjects)
                Toggle("Show Git status in project cards", isOn: $settingsService.settings.showGitStatus)
            }
        }
    }
    
    // MARK: - Package Manager Settings
    var packageManagerSettings: some View {
        VStack(alignment: .leading, spacing: 15) {
            SettingsSection(title: "Package Manager") {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Default Package Manager")
                        .font(.headline)
                    
                    ForEach(PackageManager.allCases, id: \.self) { pm in
                        HStack {
                            RadioButton(
                                title: pm.displayName,
                                isSelected: settingsService.settings.packageManager == pm,
                                action: { settingsService.settings.packageManager = pm }
                            )
                            
                            if !pm.isInstalled {
                                Text("(Not installed)")
                                    .font(.caption)
                                    .foregroundColor(.red)
                                
                                Button("Install") {
                                    installPackageManager(pm)
                                }
                                .buttonStyle(.bordered)
                                .controlSize(.small)
                            } else {
                                Text("✓ Installed")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }
                        }
                    }
                }
                
                Divider()
                
                Toggle("Automatically install dependencies after project creation", 
                       isOn: $settingsService.settings.autoInstallDependencies)
                
                Toggle("Automatically run dev server after installation", 
                       isOn: $settingsService.settings.autoRunDevServer)
                    .disabled(!settingsService.settings.autoInstallDependencies)
            }
        }
    }
    
    // MARK: - Git Settings
    var gitSettings: some View {
        VStack(alignment: .leading, spacing: 15) {
            SettingsSection(title: "Version Control") {
                Toggle("Initialize Git repository in new projects", 
                       isOn: $settingsService.settings.autoInitGitRepo)
                
                HStack {
                    Text("Default branch name")
                    TextField("main", text: $settingsService.settings.defaultBranch)
                        .frame(width: 120)
                        .textFieldStyle(.roundedBorder)
                }
                
                Toggle("Create initial commit after project creation", 
                       isOn: $settingsService.settings.commitAfterCreation)
                    .disabled(!settingsService.settings.autoInitGitRepo)
            }
        }
    }
    
    // MARK: - Appearance Settings
    var appearanceSettings: some View {
        VStack(alignment: .leading, spacing: 15) {
            SettingsSection(title: "Theme") {
                Picker("Appearance", selection: $settingsService.settings.theme) {
                    ForEach(AppTheme.allCases, id: \.self) { theme in
                        Text(theme.rawValue).tag(theme)
                    }
                }
                .pickerStyle(.segmented)
                
                Text("Theme changes will take effect immediately")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - Advanced Settings
    var advancedSettings: some View {
        VStack(alignment: .leading, spacing: 15) {
            SettingsSection(title: "Terminal") {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Preferred Terminal Application")
                        .font(.headline)
                    
                    ForEach(TerminalApp.allCases, id: \.self) { terminal in
                        HStack {
                            RadioButton(
                                title: terminal.rawValue,
                                isSelected: settingsService.settings.terminalApp == terminal,
                                action: { settingsService.settings.terminalApp = terminal }
                            )
                            
                            if !terminal.isInstalled {
                                Text("(Not installed)")
                                    .font(.caption)
                                    .foregroundColor(.red)
                            }
                        }
                    }
                }
            }
            
            SettingsSection(title: "Updates") {
                Toggle("Automatically check for updates", isOn: $settingsService.settings.autoCheckForUpdates)
                    .onChange(of: settingsService.settings.autoCheckForUpdates) { newValue in
                        updateService.enableAutoUpdateCheck(newValue)
                    }
                
                Toggle("Notify when updates are available", isOn: $settingsService.settings.notifyOnUpdates)
                    .disabled(!settingsService.settings.autoCheckForUpdates)
                
                HStack {
                    Button("Check for Updates Now") {
                        Task {
                            await updateService.checkForUpdates(silent: false)
                        }
                    }
                    .buttonStyle(.bordered)
                    
                    if updateService.isChecking {
                        ProgressView()
                            .scaleEffect(0.7)
                    }
                    
                    if updateService.updateAvailable {
                        Text("Update available: v\(updateService.latestVersion ?? "")")
                            .foregroundColor(.green)
                    }
                }
            }
            
            SettingsSection(title: "Debugging") {
                Toggle("Enable debug logging", isOn: $settingsService.settings.enableDebugLogging)
                
                if settingsService.settings.enableDebugLogging {
                    Button("Print Current Settings to Console") {
                        settingsService.printCurrentSettings()
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    func chooseDefaultLocation() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.canCreateDirectories = true
        panel.directoryURL = URL(fileURLWithPath: settingsService.settings.defaultProjectLocation)
        
        if panel.runModal() == .OK {
            settingsService.settings.defaultProjectLocation = panel.url?.path ?? settingsService.settings.defaultProjectLocation
        }
    }
}

// MARK: - Supporting Views

struct SettingsTab: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption)
            }
            .foregroundColor(isSelected ? .accentColor : .secondary)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }
}

struct SettingsSection<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.title3)
                .fontWeight(.semibold)
            
            VStack(alignment: .leading, spacing: 10) {
                content
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
        }
    }
}

struct RadioButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "circle.inset.filled" : "circle")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                Text(title)
                    .foregroundColor(.primary)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Settings Document for Export
struct SettingsDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    
    var settings: AppSettings
    
    init(settings: AppSettings) {
        self.settings = settings
    }
    
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else {
            throw CocoaError(.fileReadCorruptFile)
        }
        settings = try JSONDecoder().decode(AppSettings.self, from: data)
    }
    
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(settings)
        return FileWrapper(regularFileWithContents: data)
    }
}