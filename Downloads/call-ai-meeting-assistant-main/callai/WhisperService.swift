import Foundation
import SwiftUI

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
    
    func transcribeAudio(from url: URL, for meeting: Meeting) async -> Transcript? {
        guard !apiKey.isEmpty else {
            errorMessage = "OpenAI API key not configured"
            return nil
        }
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            errorMessage = "Audio file not found"
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
            var request = URLRequest(url: URL(string: baseURL)!)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            var body = Data()
            
            // Add model parameter
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
            body.append("whisper-1\r\n".data(using: .utf8)!)
            
            // Add language parameter (optional, helps with accuracy)
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"language\"\r\n\r\n".data(using: .utf8)!)
            body.append("en\r\n".data(using: .utf8)!)
            
            // Add response format parameter
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".data(using: .utf8)!)
            body.append("verbose_json\r\n".data(using: .utf8)!)
            
            // Add timestamp granularities for better processing
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"timestamp_granularities[]\"\r\n\r\n".data(using: .utf8)!)
            body.append("word\r\n".data(using: .utf8)!)
            
            // Add audio file
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(url.lastPathComponent)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: audio/m4a\r\n\r\n".data(using: .utf8)!)
            body.append(audioData)
            body.append("\r\n".data(using: .utf8)!)
            
            // Close multipart form
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)
            
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
            let transcript = Transcript(
                content: text,
                confidence: 0.95, // Whisper generally has high confidence
                meeting: meeting
            )
            
            // Extract additional data if available
            if let segments = responseJSON?["segments"] as? [[String: Any]] {
                transcript.segments = segments.compactMap { segment in
                    guard let start = segment["start"] as? Double,
                          let end = segment["end"] as? Double,
                          let text = segment["text"] as? String else { return nil }
                    return TranscriptSegment(start: start, end: end, text: text.trimmingCharacters(in: .whitespacesAndNewlines))
                }
            }
            
            if let words = responseJSON?["words"] as? [[String: Any]] {
                transcript.words = words.compactMap { word in
                    guard let start = word["start"] as? Double,
                          let end = word["end"] as? Double,
                          let text = word["word"] as? String else { return nil }
                    return TranscriptWord(start: start, end: end, word: text)
                }
            }
            
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
            var request = URLRequest(url: URL(string: "https://api.openai.com/v1/audio/translations")!)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            var body = Data()
            
            // Add model parameter
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
            body.append("whisper-1\r\n".data(using: .utf8)!)
            
            // Add audio file
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(url.lastPathComponent)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: audio/m4a\r\n\r\n".data(using: .utf8)!)
            body.append(audioData)
            body.append("\r\n".data(using: .utf8)!)
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)
            
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
struct TranscriptSegment: Codable {
    let start: Double
    let end: Double
    let text: String
}

struct TranscriptWord: Codable {
    let start: Double
    let end: Double
    let word: String
}