import SwiftUI

struct SettingsView: View {
    @State private var apiKey: String = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var isSecureEntry = true
    @State private var recordingQuality = AppConfig.shared.defaultRecordingQuality
    @State private var autoRecordEnabled = AppConfig.shared.autoRecordEnabled
    @State private var autoTranscribeEnabled = AppConfig.shared.autoTranscribeEnabled
    @State private var autoSummarizeEnabled = AppConfig.shared.autoSummarizeEnabled
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("OpenAI Configuration")) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("OpenAI API Key")
                            .font(.headline)
                        
                        HStack {
                            Group {
                                if isSecureEntry {
                                    SecureField("Enter your OpenAI API key", text: $apiKey)
                                } else {
                                    TextField("Enter your OpenAI API key", text: $apiKey)
                                }
                            }
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            
                            Button(action: {
                                isSecureEntry.toggle()
                            }) {
                                Image(systemName: isSecureEntry ? "eye.slash" : "eye")
                                    .foregroundColor(.secondary)
                            }
                            .buttonStyle(BorderlessButtonStyle())
                        }
                        
                        Text("Your API key is stored securely in the macOS Keychain and never leaves your device.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Link("Get your API key from OpenAI", 
                             destination: URL(string: "https://platform.openai.com/api-keys")!)
                            .font(.caption)
                    }
                }
                
                Section(header: Text("API Key Status")) {
                    HStack {
                        Image(systemName: AppConfig.shared.hasValidOpenAIAPIKey ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(AppConfig.shared.hasValidOpenAIAPIKey ? .green : .red)
                        
                        Text(AppConfig.shared.hasValidOpenAIAPIKey ? "API Key Configured" : "API Key Required")
                            .font(.body)
                    }
                }
                
                Section(header: Text("Recording Settings")) {
                    Picker("Recording Quality", selection: $recordingQuality) {
                        ForEach(RecordingQuality.allCases, id: \.self) { quality in
                            Text(quality.rawValue).tag(quality)
                        }
                    }
                    .onChange(of: recordingQuality) { _, newValue in
                        AppConfig.shared.defaultRecordingQuality = newValue
                    }
                    
                    Toggle("Auto-record meetings", isOn: $autoRecordEnabled)
                        .onChange(of: autoRecordEnabled) { _, newValue in
                            AppConfig.shared.autoRecordEnabled = newValue
                        }
                    
                    Text("Automatically start recording when a calendar meeting begins")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section(header: Text("AI Features")) {
                    Toggle("Auto-transcribe recordings", isOn: $autoTranscribeEnabled)
                        .onChange(of: autoTranscribeEnabled) { _, newValue in
                            AppConfig.shared.autoTranscribeEnabled = newValue
                        }
                    
                    Toggle("Auto-generate summaries", isOn: $autoSummarizeEnabled)
                        .onChange(of: autoSummarizeEnabled) { _, newValue in
                            AppConfig.shared.autoSummarizeEnabled = newValue
                        }
                        .disabled(!AppConfig.shared.hasValidOpenAIAPIKey)
                    
                    if !AppConfig.shared.hasValidOpenAIAPIKey {
                        Text("OpenAI API key required for AI features")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Section(header: Text("Actions")) {
                    Button("Save API Key") {
                        saveAPIKey()
                    }
                    .disabled(apiKey.isEmpty)
                    
                    if AppConfig.shared.hasValidOpenAIAPIKey {
                        Button("Remove API Key", role: .destructive) {
                            removeAPIKey()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            loadCurrentAPIKey()
        }
        .alert("Settings", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func loadCurrentAPIKey() {
        if AppConfig.shared.hasValidOpenAIAPIKey {
            apiKey = String(repeating: "•", count: 20) + " (saved)"
        }
    }
    
    private func saveAPIKey() {
        let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmedKey.isEmpty else {
            alertMessage = "Please enter an API key."
            showingAlert = true
            return
        }
        
        guard trimmedKey.starts(with: "sk-") else {
            alertMessage = "Please enter a valid OpenAI API key (should start with 'sk-')."
            showingAlert = true
            return
        }
        
        KeychainManager.shared.openAIAPIKey = trimmedKey
        
        alertMessage = "API key saved successfully!"
        showingAlert = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            loadCurrentAPIKey()
        }
    }
    
    private func removeAPIKey() {
        KeychainManager.shared.openAIAPIKey = nil
        apiKey = ""
        alertMessage = "API key removed successfully!"
        showingAlert = true
    }
}