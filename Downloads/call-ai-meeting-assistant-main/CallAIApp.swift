import SwiftUI
import SwiftData

@main
struct CallAIApp: App {
    let modelContainer: ModelContainer
    
    init() {
        do {
            modelContainer = try ModelContainer(for: Meeting.self, Transcript.self)
        } catch {
            fatalError("Failed to initialize model container: \(error)")
        }
        
        // Initialize API key on app launch
        APIKeyConfig.shared.initializeKeychainIfNeeded()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(modelContainer)
        }
    }
}