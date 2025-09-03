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
                errorMessage = nil // Clear any previous error
            } else {
                // Fallback: use the raw content as summary if JSON parsing fails
                transcript.summary = content.trimmingCharacters(in: .whitespacesAndNewlines)
                transcript.updatedAt = Date()
                errorMessage = "Summary generated but formatting may be imperfect"
            }
            
        } catch {
            errorMessage = "Failed to generate summary: \(error.localizedDescription)"
        }
    }
    
    private func parseAISummary(_ content: String) -> (summary: String, keyPoints: [String], actionItems: [String], participants: [String])? {
        // First try to parse as JSON
        do {
            // Clean up the content - remove code blocks if present
            var cleanedContent = content
            if content.contains("```json") {
                cleanedContent = content
                    .replacingOccurrences(of: "```json", with: "")
                    .replacingOccurrences(of: "```", with: "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
            }
            
            guard let jsonData = cleanedContent.data(using: .utf8),
                  let json = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                return parseAsPlainText(content)
            }
            
            let summary = json["summary"] as? String ?? ""
            let keyPoints = json["keyPoints"] as? [String] ?? []
            let actionItems = json["actionItems"] as? [String] ?? []
            let participants = json["participants"] as? [String] ?? []
            
            // Only return if we have at least a summary
            guard !summary.isEmpty else {
                return parseAsPlainText(content)
            }
            
            return (summary, keyPoints, actionItems, participants)
        } catch {
            return parseAsPlainText(content)
        }
    }
    
    private func parseAsPlainText(_ content: String) -> (summary: String, keyPoints: [String], actionItems: [String], participants: [String])? {
        // Try to extract a readable summary from plain text response
        let lines = content.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        
        var summary = ""
        var keyPoints: [String] = []
        var actionItems: [String] = []
        var participants: [String] = []
        
        var currentSection = ""
        
        for line in lines {
            let lowercaseLine = line.lowercased()
            
            if lowercaseLine.contains("summary") || currentSection.isEmpty {
                currentSection = "summary"
                if !lowercaseLine.contains("summary") {
                    summary += (summary.isEmpty ? "" : " ") + line
                }
            } else if lowercaseLine.contains("key points") || lowercaseLine.contains("key findings") {
                currentSection = "keyPoints"
            } else if lowercaseLine.contains("action items") || lowercaseLine.contains("actions") {
                currentSection = "actionItems"  
            } else if lowercaseLine.contains("participants") || lowercaseLine.contains("attendees") {
                currentSection = "participants"
            } else {
                // Add content to current section
                if currentSection == "summary" && !line.hasPrefix("•") && !line.hasPrefix("-") {
                    summary += (summary.isEmpty ? "" : " ") + line
                } else if currentSection == "keyPoints" && (line.hasPrefix("•") || line.hasPrefix("-")) {
                    keyPoints.append(line.replacingOccurrences(of: "^[•-]\\s*", with: "", options: .regularExpression))
                } else if currentSection == "actionItems" && (line.hasPrefix("•") || line.hasPrefix("-") || line.hasPrefix("□")) {
                    actionItems.append(line.replacingOccurrences(of: "^[•-□]\\s*", with: "", options: .regularExpression))
                } else if currentSection == "participants" {
                    let names = line.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    participants.append(contentsOf: names)
                }
            }
        }
        
        // If no structured summary found, use first few meaningful lines
        if summary.isEmpty {
            summary = lines.prefix(3).joined(separator: " ")
        }
        
        return summary.isEmpty ? nil : (summary, keyPoints, actionItems, participants)
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