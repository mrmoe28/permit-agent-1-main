import SwiftUI

struct SettingsView: View {
    @Binding var prefersDarkMode: Bool
    let onBackToLanding: () -> Void
    
    var body: some View {
        NavigationView {
            List {
                Section("Appearance") {
                    Toggle("Dark Mode", isOn: $prefersDarkMode)
                }
                
                Section("Recording") {
                    HStack {
                        Text("Quality")
                        Spacer()
                        Text("Standard")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Auto-transcribe")
                        Spacer()
                        Toggle("", isOn: .constant(true))
                    }
                }
                
                Section("Storage") {
                    HStack {
                        Text("Used Space")
                        Spacer()
                        Text("0 MB")
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Clear Cache") {
                        // TODO: Implement clear cache
                    }
                    .foregroundColor(.red)
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Privacy Policy") {
                        // TODO: Open privacy policy
                    }
                    
                    Button("Terms of Service") {
                        // TODO: Open terms of service
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
