import Foundation
import SwiftUI
import SwiftData

@MainActor
class WhisperService: ObservableObject {
    @Published var isTranscribing = false
    @Published var transcriptionProgress: Double = 0
    @Published var errorMessage: String?
    
    private let apiKey: String
    private let baseURL = "https://api.openai.com/v1/audio/transcriptions"
    
    init(apiKey: String = "") {
        self.apiKey = apiKey
    }
    
    func transcribeAudio(from url: URL, for meeting: Meeting, modelContext: ModelContext) async -> Transcript? {
        guard !apiKey.isEmpty else {
            errorMessage = ServiceError.invalidAPIKey.errorDescription
            return nil
        }
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            errorMessage = ServiceError.fileNotFound(url.path).errorDescription
            return nil
        }
        
        isTranscribing = true
        transcriptionProgress = 0.1
        defer { isTranscribing = false }
        
        do {
            // Read the audio file
            let audioData = try Data(contentsOf: url)
            transcriptionProgress = 0.3
            
            // Create multipart form data
            let boundary = UUID().uuidString
            guard let url = URL(string: baseURL) else {
                errorMessage = ServiceError.invalidURL(baseURL).errorDescription
                return nil
            }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            var body = Data()
            
            // Add model parameter
            guard let boundaryData = "--\(boundary)\r\n".data(using: .utf8),
                  let modelDisposition = "Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8),
                  let modelValue = "whisper-1\r\n".data(using: .utf8) else {
                errorMessage = ServiceError.audioProcessingFailed("Failed to create form data").errorDescription
                return nil
            }
            body.append(boundaryData)
            body.append(modelDisposition)
            body.append(modelValue)
            
            // Add language parameter (optional, helps with accuracy)
            guard let languageDisposition = "Content-Disposition: form-data; name=\"language\"\r\n\r\n".data(using: .utf8),
                  let languageValue = "en\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create language form data"
                return nil
            }
            body.append(boundaryData)
            body.append(languageDisposition)
            body.append(languageValue)
            
            // Add response format parameter
            guard let formatDisposition = "Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".data(using: .utf8),
                  let formatValue = "verbose_json\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create format form data"
                return nil
            }
            body.append(boundaryData)
            body.append(formatDisposition)
            body.append(formatValue)
            
            // Add timestamp granularities for better processing
            guard let granularityDisposition = "Content-Disposition: form-data; name=\"timestamp_granularities[]\"\r\n\r\n".data(using: .utf8),
                  let granularityValue = "word\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create granularity form data"
                return nil
            }
            body.append(boundaryData)
            body.append(granularityDisposition)
            body.append(granularityValue)
            
            // Add audio file
            guard let fileDisposition = "Content-Disposition: form-data; name=\"file\"; filename=\"\(url.lastPathComponent)\"\r\n".data(using: .utf8),
                  let contentType = "Content-Type: audio/m4a\r\n\r\n".data(using: .utf8),
                  let newlineData = "\r\n".data(using: .utf8),
                  let closeBoundary = "--\(boundary)--\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create file form data"
                return nil
            }
            body.append(boundaryData)
            body.append(fileDisposition)
            body.append(contentType)
            body.append(audioData)
            body.append(newlineData)
            
            // Close multipart form
            body.append(closeBoundary)
            
            request.httpBody = body
            transcriptionProgress = 0.6
            
            // Make the request
            let (data, response) = try await URLSession.shared.data(for: request)
            transcriptionProgress = 0.8
            
            guard let httpResponse = response as? HTTPURLResponse else {
                errorMessage = "Invalid response"
                return nil
            }
            
            guard httpResponse.statusCode == 200 else {
                if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let error = errorData["error"] as? [String: Any],
                   let message = error["message"] as? String {
                    errorMessage = "Whisper API error: \(message)"
                } else {
                    errorMessage = "Whisper API error: \(httpResponse.statusCode)"
                }
                return nil
            }
            
            // Parse the response
            let responseJSON = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard let text = responseJSON?["text"] as? String else {
                errorMessage = "Invalid response format"
                return nil
            }
            
            transcriptionProgress = 1.0
            
            // Create transcript with enhanced data
            // Create transcript using SwiftData context
            let transcript = Transcript(
                content: text,
                confidence: 0.95, // Whisper generally has high confidence
                meetingID: meeting.id
            )
            
            // Note: Additional segment and word data could be stored separately
            // if needed for future features
            
            meeting.transcript = transcript
            meeting.updatedAt = Date()
            
            return transcript
            
        } catch {
            errorMessage = "Transcription failed: \(error.localizedDescription)"
            return nil
        }
    }
    
    func translateAudio(from url: URL, targetLanguage: String = "en") async -> String? {
        guard !apiKey.isEmpty else {
            errorMessage = "OpenAI API key not configured"
            return nil
        }
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            errorMessage = "Audio file not found"
            return nil
        }
        
        do {
            let audioData = try Data(contentsOf: url)
            
            let boundary = UUID().uuidString
            guard let translationURL = URL(string: "https://api.openai.com/v1/audio/translations") else {
                errorMessage = "Invalid translation API URL"
                return nil
            }
            var request = URLRequest(url: translationURL)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            var body = Data()
            
            // Add model parameter
            guard let boundaryData = "--\(boundary)\r\n".data(using: .utf8),
                  let modelDisposition = "Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8),
                  let modelValue = "whisper-1\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create translation form data"
                return nil
            }
            body.append(boundaryData)
            body.append(modelDisposition)
            body.append(modelValue)
            
            // Add audio file
            guard let fileDisposition = "Content-Disposition: form-data; name=\"file\"; filename=\"\(url.lastPathComponent)\"\r\n".data(using: .utf8),
                  let contentType = "Content-Type: audio/m4a\r\n\r\n".data(using: .utf8),
                  let newlineData = "\r\n".data(using: .utf8),
                  let closeBoundary = "--\(boundary)--\r\n".data(using: .utf8) else {
                errorMessage = "Failed to create file form data for translation"
                return nil
            }
            body.append(boundaryData)
            body.append(fileDisposition)
            body.append(contentType)
            body.append(audioData)
            body.append(newlineData)
            body.append(closeBoundary)
            
            request.httpBody = body
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return nil
            }
            
            let responseJSON = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            return responseJSON?["text"] as? String
            
        } catch {
            errorMessage = "Translation failed: \(error.localizedDescription)"
            return nil
        }
    }
}

// Enhanced transcript data structures
struct WhisperTranscriptSegment: Codable {
    let start: Double
    let end: Double
    let text: String
}
