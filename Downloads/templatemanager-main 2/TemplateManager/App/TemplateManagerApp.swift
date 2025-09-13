import SwiftUI

@main
struct TemplateManagerApp: App {
    @StateObject private var settingsService = SettingsService.shared
    @StateObject private var updateService = UpdateService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 600, minHeight: 700)
                .onAppear {
                    // Check for updates on launch if enabled
                    if settingsService.settings.autoCheckForUpdates {
                        Task {
                            await updateService.checkForUpdates(silent: true)
                        }
                    }
                }
        }
        .commands {
            CommandGroup(after: .appInfo) {
                Button("Check for Updates...") {
                    Task {
                        await updateService.checkForUpdates(silent: false)
                    }
                }
                .keyboardShortcut("U", modifiers: [.command, .shift])
            }
        }
    }
}