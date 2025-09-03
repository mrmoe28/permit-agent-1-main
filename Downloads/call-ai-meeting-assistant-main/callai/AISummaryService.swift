import Foundation
import SwiftUI

@MainActor
class AISummaryService: ObservableObject {
    @Published var isGeneratingSummary = false
    @Published var errorMessage: String?
    
    private let apiKey: String
    private let baseURL = "https://api.openai.com/v1/chat/completions"
    
    init(apiKey: String = "") {
        self.apiKey = apiKey
    }
    
    func generateSummary(for transcript: Transcript) async {
        guard !apiKey.isEmpty else {
            errorMessage = "OpenAI API key not configured"
            return
        }
        
        isGeneratingSummary = true
        defer { isGeneratingSummary = false }
        
        let prompt = """
        Please analyze the following meeting transcript and provide:
        1. A concise summary (2-3 paragraphs)
        2. Key points discussed (bullet points)
        3. Action items with responsible parties if mentioned
        4. List of participants mentioned
        
        Transcript:
        \(transcript.content)
        
        Please format your response as JSON with the following structure:
        {
            "summary": "...",
            "keyPoints": ["...", "..."],
            "actionItems": ["...", "..."],
            "participants": ["...", "..."]
        }
        """
        
        let requestBody = [
            "model": "gpt-4o-mini",
            "messages": [
                [
                    "role": "system",
                    "content": "You are an expert meeting assistant that creates concise, actionable summaries of meeting transcripts. Focus on extracting key decisions, action items, and important discussions."
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        ] as [String: Any]
        
        do {
            guard let url = URL(string: baseURL) else {
                errorMessage = "Invalid API URL"
                return
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                errorMessage = "API request failed"
                return
            }
            
            let responseJSON = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard let choices = responseJSON?["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                errorMessage = "Invalid API response"
                return
            }
            
            if let summaryData = parseAISummary(content) {
                transcript.summary = summaryData.summary
                transcript.keyPoints = summaryData.keyPoints
                transcript.actionItems = summaryData.actionItems
                transcript.participants = summaryData.participants
                transcript.updatedAt = Date()
            }
            
        } catch {
            errorMessage = "Failed to generate summary: \(error.localizedDescription)"
        }
    }
    
    private func parseAISummary(_ content: String) -> (summary: String, keyPoints: [String], actionItems: [String], participants: [String])? {
        do {
            guard let jsonData = content.data(using: .utf8),
                  let json = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                return nil
            }
            
            let summary = json["summary"] as? String ?? ""
            let keyPoints = json["keyPoints"] as? [String] ?? []
            let actionItems = json["actionItems"] as? [String] ?? []
            let participants = json["participants"] as? [String] ?? []
            
            return (summary, keyPoints, actionItems, participants)
        } catch {
            let lines = content.components(separatedBy: .newlines)
            let summary = lines.first { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } ?? ""
            return (summary, [], [], [])
        }
    }
    
    func generateQuickSummary(from text: String) async -> String? {
        guard !apiKey.isEmpty else {
            errorMessage = "OpenAI API key not configured"
            return nil
        }
        
        let prompt = "Please provide a concise 2-sentence summary of this meeting transcript: \(text)"
        
        let requestBody = [
            "model": "gpt-4o-mini",
            "messages": [
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "temperature": 0.3,
            "max_tokens": 200
        ] as [String: Any]
        
        do {
            guard let url = URL(string: baseURL) else { return nil }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
            
            let (data, _) = try await URLSession.shared.data(for: request)
            
            let responseJSON = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard let choices = responseJSON?["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                return nil
            }
            
            return content.trimmingCharacters(in: .whitespacesAndNewlines)
            
        } catch {
            return nil
        }
    }
}