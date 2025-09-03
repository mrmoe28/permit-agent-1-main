import Foundation
import SwiftData

@Model
class Transcript {
    var id: UUID
    var meeting: Meeting?
    var content: String
    var summary: String?
    var keyPoints: [String]
    var actionItems: [String]
    var participants: [String]
    var confidence: Double
    var createdAt: Date
    var updatedAt: Date
    
    // Enhanced Whisper features
    var segments: [TranscriptSegment]
    var words: [TranscriptWord]
    var language: String?
    var duration: Double?
    
    init(
        content: String,
        confidence: Double = 0.0,
        meeting: Meeting? = nil
    ) {
        self.id = UUID()
        self.content = content
        self.confidence = confidence
        self.meeting = meeting
        self.keyPoints = []
        self.actionItems = []
        self.participants = []
        self.segments = []
        self.words = []
        self.language = "en"
        self.duration = 0.0
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    var wordCount: Int {
        content.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .count
    }
    
    var estimatedReadingTime: Int {
        max(1, wordCount / 200)
    }
}

extension Transcript {
    static let sampleTranscript = Transcript(
        content: """
        Welcome everyone to today's quarterly planning meeting. We have several key items on our agenda today including project updates, budget reviews, and strategic planning for the next quarter.
        
        John mentioned that the development project is ahead of schedule and should be completed by next Friday. Sarah provided an update on the marketing campaign which has exceeded expectations with a 25% increase in engagement.
        
        For action items, we need to finalize the budget proposal by Thursday and schedule follow-up meetings with the stakeholders.
        """,
        confidence: 0.95
    )
}