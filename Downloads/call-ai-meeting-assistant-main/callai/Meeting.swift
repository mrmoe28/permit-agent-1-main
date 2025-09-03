import Foundation
import SwiftData
import EventKit

enum RecordingQuality: String, CaseIterable, Codable {
    case low = "Low (8 kHz)"
    case standard = "Standard (16 kHz)" 
    case high = "High (44.1 kHz)"
    case lossless = "Lossless (48 kHz)"
    
    var sampleRate: Double {
        switch self {
        case .low: return 8000
        case .standard: return 16000
        case .high: return 44100
        case .lossless: return 48000
        }
    }
}

@Model
class Meeting {
    var id: UUID
    var title: String
    var startDate: Date
    var endDate: Date
    var location: String?
    var calendarEventID: String?
    var recordingURL: URL?
    var transcript: Transcript?
    var isRecorded: Bool
    var createdAt: Date
    var updatedAt: Date
    
    // Enhanced features
    var participants: [String]
    var notes: String?
    var isFromCalendar: Bool
    var externalEventId: String?
    var autoRecorded: Bool
    var recordingQuality: RecordingQuality
    var tags: [String]
    
    init(
        title: String,
        startDate: Date,
        endDate: Date,
        location: String? = nil,
        calendarEventID: String? = nil,
        participants: [String] = []
    ) {
        self.id = UUID()
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.location = location
        self.calendarEventID = calendarEventID
        self.participants = participants
        self.notes = nil
        self.isFromCalendar = calendarEventID != nil
        self.externalEventId = calendarEventID
        self.autoRecorded = false
        self.recordingQuality = .standard
        self.tags = []
        self.isRecorded = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    convenience init(from event: EKEvent) {
        self.init(
            title: event.title ?? "Untitled Meeting",
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            calendarEventID: event.eventIdentifier,
            participants: event.attendees?.compactMap { $0.name } ?? []
        )
        
        if let notes = event.notes {
            self.notes = notes
        }
        
        self.externalEventId = event.eventIdentifier
    }
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var isUpcoming: Bool {
        startDate > Date()
    }
    
    var isInProgress: Bool {
        let now = Date()
        return startDate <= now && now <= endDate
    }
}