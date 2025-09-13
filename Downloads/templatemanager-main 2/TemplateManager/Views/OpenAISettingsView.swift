import SwiftUI

struct OpenAISettingsView: View {
    @StateObject private var openAIService = OpenAIService.shared
    @StateObject private var settingsService = SettingsService.shared
    @State private var apiKey: String = ""
    @State private var showAPIKey = false
    @State private var isTestingConnection = false
    @State private var testResult: String?
    @State private var selectedModel: String = "gpt-4o"
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text("OpenAI Settings")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Configure AI-powered features for Template Manager")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.escape)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))

            ScrollView {
                VStack(alignment: .leading, spacing: 25) {
                    // API Key Section
                    GroupBox {
                        VStack(alignment: .leading, spacing: 15) {
                            Label("API Key Configuration", systemImage: "key.fill")
                                .font(.headline)

                            HStack {
                                if showAPIKey {
                                    TextField("Enter your OpenAI API key", text: $apiKey)
                                        .textFieldStyle(.roundedBorder)
                                        .onChange(of: apiKey) { newValue in
                                            openAIService.setAPIKey(newValue)
                                        }
                                } else {
                                    SecureField("Enter your OpenAI API key", text: $apiKey)
                                        .textFieldStyle(.roundedBorder)
                                        .onChange(of: apiKey) { newValue in
                                            openAIService.setAPIKey(newValue)
                                        }
                                }

                                Button(action: { showAPIKey.toggle() }) {
                                    Image(systemName: showAPIKey ? "eye.slash" : "eye")
                                        .foregroundColor(.secondary)
                                }
                                .buttonStyle(.plain)

                                if openAIService.isConfigured {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                        .help("API key is configured")
                                }
                            }

                            HStack {
                                Button("Test Connection") {
                                    Task {
                                        await testConnection()
                                    }
                                }
                                .disabled(apiKey.isEmpty || isTestingConnection)

                                if isTestingConnection {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                }

                                if let result = testResult {
                                    Text(result)
                                        .font(.caption)
                                        .foregroundColor(result.contains("Success") ? .green : .red)
                                }

                                Spacer()

                                Link("Get API Key", destination: URL(string: "https://platform.openai.com/api-keys")!)
                                    .font(.caption)
                            }
                        }
                        .padding(10)
                    }

                    // Model Selection
                    GroupBox {
                        VStack(alignment: .leading, spacing: 15) {
                            Label("Model Selection", systemImage: "cpu")
                                .font(.headline)

                            Picker("AI Model", selection: $selectedModel) {
                                ForEach(openAIService.availableModels, id: \.self) { model in
                                    Text(model).tag(model)
                                }
                            }
                            .pickerStyle(.segmented)
                            .onChange(of: selectedModel) { newValue in
                                settingsService.settings.aiModel = newValue
                            }

                            Text("Select the OpenAI model to use for AI features")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(10)
                    }

                    // AI Features Toggle
                    GroupBox {
                        VStack(alignment: .leading, spacing: 15) {
                            Label("AI Features", systemImage: "sparkles")
                                .font(.headline)

                            Toggle("Enable AI Features", isOn: $settingsService.settings.enableAIFeatures)
                                .disabled(!openAIService.isConfigured)

                            if settingsService.settings.enableAIFeatures {
                                VStack(alignment: .leading, spacing: 10) {
                                    Label("Available AI Features:", systemImage: "list.bullet")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)

                                    VStack(alignment: .leading, spacing: 5) {
                                        HStack {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                                .imageScale(.small)
                                            Text("Smart project name generation")
                                                .font(.caption)
                                        }

                                        HStack {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                                .imageScale(.small)
                                            Text("Auto-generate README descriptions")
                                                .font(.caption)
                                        }

                                        HStack {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                                .imageScale(.small)
                                            Text("Suggest environment variables")
                                                .font(.caption)
                                        }

                                        HStack {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                                .imageScale(.small)
                                            Text("Code improvement suggestions")
                                                .font(.caption)
                                        }
                                    }
                                    .padding(.leading, 20)
                                }
                            }
                        }
                        .padding(10)
                    }

                    // Usage Information
                    GroupBox {
                        VStack(alignment: .leading, spacing: 10) {
                            Label("Usage Information", systemImage: "info.circle")
                                .font(.headline)

                            Text("Your OpenAI API key is stored securely in your local settings and is never shared with third parties.")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Text("API usage will be billed to your OpenAI account according to their pricing.")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Link("View OpenAI Pricing", destination: URL(string: "https://openai.com/pricing")!)
                                .font(.caption)
                        }
                        .padding(10)
                    }
                }
                .padding()
            }
        }
        .frame(width: 600, height: 650)
        .onAppear {
            apiKey = settingsService.settings.openAIAPIKey
            selectedModel = settingsService.settings.aiModel
        }
    }

    private func testConnection() async {
        isTestingConnection = true
        testResult = nil

        let success = await openAIService.testConnection()

        await MainActor.run {
            isTestingConnection = false
            testResult = success ? "✓ Success! Connection established" : "✗ Failed: \(openAIService.lastError ?? "Unknown error")"
        }
    }
}

struct OpenAISettingsView_Previews: PreviewProvider {
    static var previews: some View {
        OpenAISettingsView()
    }
}