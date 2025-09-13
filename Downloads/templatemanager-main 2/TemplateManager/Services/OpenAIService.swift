import Foundation
import SwiftUI

// MARK: - OpenAI Models
struct OpenAICompletionRequest: Codable {
    let model: String
    let messages: [OpenAIMessage]
    let temperature: Double
    let max_tokens: Int?
}

struct OpenAIMessage: Codable {
    let role: String
    let content: String
}

struct OpenAICompletionResponse: Codable {
    let id: String
    let object: String
    let created: Int
    let model: String
    let choices: [OpenAIChoice]
    let usage: OpenAIUsage?
}

struct OpenAIChoice: Codable {
    let index: Int
    let message: OpenAIMessage
    let finish_reason: String?
}

struct OpenAIUsage: Codable {
    let prompt_tokens: Int
    let completion_tokens: Int
    let total_tokens: Int
}

// MARK: - OpenAI Service
class OpenAIService: ObservableObject {
    static let shared = OpenAIService()

    @Published var isConfigured: Bool = false
    @Published var isProcessing: Bool = false
    @Published var lastError: String?

    private let baseURL = "https://api.openai.com/v1"
    private var apiKey: String = ""

    private init() {
        loadAPIKey()
    }

    // MARK: - Configuration

    func loadAPIKey() {
        apiKey = SettingsService.shared.settings.openAIAPIKey
        isConfigured = !apiKey.isEmpty
    }

    func setAPIKey(_ key: String) {
        apiKey = key
        SettingsService.shared.settings.openAIAPIKey = key
        isConfigured = !key.isEmpty
    }

    // MARK: - AI Features

    func generateProjectName(for template: String) async throws -> String {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        let prompt = """
        Generate a creative and professional project name for a \(template) template.
        Requirements:
        - Must be lowercase with hyphens (kebab-case)
        - Should be memorable and relevant
        - Maximum 30 characters
        - No special characters except hyphens
        - Should not be generic like "my-app" or "test-project"

        Return only the project name, nothing else.
        """

        let response = try await sendCompletionRequest(prompt: prompt, maxTokens: 50)
        return response.trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .replacingOccurrences(of: "_", with: "-")
    }

    func generateProjectDescription(for projectName: String, template: String) async throws -> String {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        let prompt = """
        Generate a professional README description for a project named "\(projectName)" using the \(template) template.
        The description should be 2-3 sentences that explain what the project does and its key features.
        Make it sound professional and engaging.
        """

        return try await sendCompletionRequest(prompt: prompt, maxTokens: 150)
    }

    func suggestEnvironmentVariables(for template: String) async throws -> [String: String] {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        let prompt = """
        For a \(template) project, suggest the most important environment variables that should be configured.
        Return them in JSON format as key-value pairs where the key is the variable name and value is a placeholder.
        Example: {"DATABASE_URL": "postgresql://localhost:5432/mydb", "API_KEY": "your-api-key-here"}
        Maximum 5 variables.
        """

        let response = try await sendCompletionRequest(prompt: prompt, maxTokens: 200)

        // Parse JSON response
        guard let data = response.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
            return [:]
        }

        return json
    }

    func improveCode(code: String, language: String) async throws -> String {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        let prompt = """
        Improve the following \(language) code by:
        1. Fixing any bugs or issues
        2. Improving performance where possible
        3. Following best practices
        4. Adding helpful comments

        Code:
        ```\(language)
        \(code)
        ```

        Return only the improved code without explanations.
        """

        return try await sendCompletionRequest(prompt: prompt, maxTokens: 1000)
    }

    // MARK: - Private Methods

    private func sendCompletionRequest(prompt: String, maxTokens: Int = 500) async throws -> String {
        guard !apiKey.isEmpty else {
            throw OpenAIError.notConfigured
        }

        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let requestBody = OpenAICompletionRequest(
            model: SettingsService.shared.settings.aiModel,
            messages: [
                OpenAIMessage(role: "system", content: "You are a helpful assistant for a project template manager application."),
                OpenAIMessage(role: "user", content: prompt)
            ],
            temperature: 0.7,
            max_tokens: maxTokens
        )

        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw OpenAIError.invalidResponse
        }

        if httpResponse.statusCode == 401 {
            throw OpenAIError.invalidAPIKey
        }

        if httpResponse.statusCode != 200 {
            throw OpenAIError.requestFailed(statusCode: httpResponse.statusCode)
        }

        let completionResponse = try JSONDecoder().decode(OpenAICompletionResponse.self, from: data)

        guard let firstChoice = completionResponse.choices.first else {
            throw OpenAIError.noResponse
        }

        return firstChoice.message.content
    }
}

// MARK: - OpenAI Errors
enum OpenAIError: LocalizedError {
    case notConfigured
    case invalidAPIKey
    case invalidResponse
    case noResponse
    case requestFailed(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "OpenAI API key is not configured. Please add your API key in settings."
        case .invalidAPIKey:
            return "Invalid OpenAI API key. Please check your API key in settings."
        case .invalidResponse:
            return "Invalid response from OpenAI API."
        case .noResponse:
            return "No response received from OpenAI."
        case .requestFailed(let statusCode):
            return "OpenAI request failed with status code: \(statusCode)"
        }
    }
}

// MARK: - AI Feature Helpers
extension OpenAIService {
    func testConnection() async -> Bool {
        do {
            _ = try await sendCompletionRequest(prompt: "Say 'Hello'", maxTokens: 10)
            return true
        } catch {
            lastError = error.localizedDescription
            return false
        }
    }

    var availableModels: [String] {
        ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
    }
}