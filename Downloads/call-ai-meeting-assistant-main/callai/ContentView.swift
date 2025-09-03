import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var showingSettings = false
    @State private var showingDebugView = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            MeetingsListView(selectedTab: $selectedTab)
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Meetings")
                }
                .tag(0)
            
            RecordingView(selectedTab: $selectedTab)
                .tabItem {
                    Image(systemName: "record.circle")
                    Text("Record")
                }
                .tag(1)
            
            TranscriptsView()
                .tabItem {
                    Image(systemName: "doc.text")
                    Text("Transcripts")
                }
                .tag(2)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(3)
        }
        .onAppear {
            checkAPIKeyConfiguration()
            // Initialize permission debug service
            _ = PermissionDebugService.shared
            // Proactively request permissions
            Task {
                await requestInitialPermissions()
            }
        }
        #if DEBUG
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button("Debug Permissions") {
                    showingDebugView = true
                }
            }
        }
        .sheet(isPresented: $showingDebugView) {
            PermissionDebugView()
        }
        #endif
    }
    
    private func checkAPIKeyConfiguration() {
        if !AppConfig.shared.hasValidOpenAIAPIKey {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                selectedTab = 3 // Automatically switch to Settings tab if no API key
            }
        }
    }
    
    private func requestInitialPermissions() async {
        // Request microphone permission proactively
        print("Requesting microphone permission...")
        await PermissionDebugService.shared.testMicrophonePermission()
        
        // Request calendar permission proactively  
        print("Requesting calendar permission...")
        await PermissionDebugService.shared.testCalendarPermission()
        
        print("Permission requests completed successfully")
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Meeting.self, Transcript.self])
}
