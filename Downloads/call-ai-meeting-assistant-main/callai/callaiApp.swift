//
//  callaiApp.swift
//  callai
//
//  Created by Edward Harrison on 9/2/25.
//

import SwiftUI
import SwiftData

@main
struct callaiApp: App {
    let modelContainer: ModelContainer
    
    init() {
        do {
            modelContainer = try ModelContainer(for: Meeting.self, Transcript.self)
            print("✅ Successfully initialized Core Data model container")
        } catch {
            print("❌ Failed to initialize model container: \(error)")
            print("📝 Creating fallback in-memory container...")
            
            // Create fallback in-memory container instead of crashing
            do {
                let config = ModelConfiguration(isStoredInMemoryOnly: true)
                modelContainer = try ModelContainer(for: Meeting.self, Transcript.self, configurations: config)
                print("✅ Successfully created fallback in-memory container")
            } catch {
                print("💥 Fatal error: Could not create fallback container: \(error)")
                fatalError("Failed to initialize any model container: \(error)")
            }
        }
        
        // Initialize API key on app launch
        APIKeyConfig.shared.initializeKeychainIfNeeded()
        print("✅ API Key configuration initialized")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(modelContainer)
        }
    }
}
