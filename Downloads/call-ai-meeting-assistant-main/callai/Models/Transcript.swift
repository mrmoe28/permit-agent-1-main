import Foundation
import SwiftData

struct TranscriptWord: Codable {
    let start: Double
    let end: Double
    let word: String
}

// MARK: - Transcript Model
// Clean, simple transcript data structure

@Model
class Transcript: Identifiable {
    var id: UUID
    var content: String
    var confidence: Double
    var meetingID: UUID
    var summary: String?
    var keyPoints: [String]
    var actionItems: [String]
    var participants: [String]
    var language: String?
    var duration: TimeInterval?
    var meeting: Meeting?
    var segments: [WhisperTranscriptSegment]?
    var words: [TranscriptWord]?
    var createdAt: Date
    var updatedAt: Date
    
    init(
        id: UUID = UUID(),
        content: String,
        confidence: Double,
        meetingID: UUID,
        summary: String? = nil,
        keyPoints: [String] = [],
        actionItems: [String] = [],
        participants: [String] = [],
        language: String? = nil,
        duration: TimeInterval? = nil,
        meeting: Meeting? = nil,
        segments: [WhisperTranscriptSegment]? = nil,
        words: [TranscriptWord]? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.content = content
        self.confidence = confidence
        self.meetingID = meetingID
        self.summary = summary
        self.keyPoints = keyPoints
        self.actionItems = actionItems
        self.participants = participants
        self.language = language
        self.duration = duration
        self.meeting = meeting
        self.segments = segments
        self.words = words
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // MARK: - Computed Properties
    
    var wordCount: Int {
        content.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .count
    }
    
    var estimatedReadingTime: TimeInterval {
        // Average reading speed: 200 words per minute
        Double(wordCount) / 200.0 * 60.0
    }
    
    var formattedReadingTime: String {
        let minutes = Int(estimatedReadingTime) / 60
        let seconds = Int(estimatedReadingTime) % 60
        
        if minutes > 0 {
            return "\(minutes)m \(seconds)s"
        } else {
            return "\(seconds)s"
        }
    }
    
    var confidencePercentage: Int {
        Int(confidence * 100)
    }
    
    var confidenceDescription: String {
        switch confidence {
        case 0.9...1.0:
            return "Excellent"
        case 0.8..<0.9:
            return "Good"
        case 0.7..<0.8:
            return "Fair"
        case 0.6..<0.7:
            return "Poor"
        default:
            return "Very Poor"
        }
    }
}

// MARK: - Transcript Segment (for future use)
// Represents a portion of the transcript with timing information

@Model
class TranscriptSegment: Identifiable {
    var id: UUID
    var content: String
    var startOffset: TimeInterval
    var endOffset: TimeInterval
    var confidence: Double
    var transcriptID: UUID
    
    init(
        id: UUID = UUID(),
        content: String,
        startOffset: TimeInterval,
        endOffset: TimeInterval,
        confidence: Double,
        transcriptID: UUID
    ) {
        self.id = id
        self.content = content
        self.startOffset = startOffset
        self.endOffset = endOffset
        self.confidence = confidence
        self.transcriptID = transcriptID
    }
    
    var duration: TimeInterval {
        endOffset - startOffset
    }
}
