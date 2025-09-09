import Foundation
import SwiftData

// MARK: - Core Domain Models
// Clean, simple data structures following Swift best practices

@Model
class Meeting: Identifiable {
    var id: UUID
    var title: String
    var startDate: Date
    var endDate: Date
    var participants: [String]
    var phoneNumber: String?
    var participantName: String?
    var recordingURL: URL?
    var transcript: Transcript?
    var callType: CallType
    var callDirection: CallDirection
    var isInProgress: Bool
    var location: String?
    var isRecorded: Bool
    var isUpcoming: Bool
    var isFromCalendar: Bool
    var autoRecorded: Bool
    var createdAt: Date
    var updatedAt: Date
    
    init(
        id: UUID = UUID(),
        title: String,
        startDate: Date,
        endDate: Date,
        participants: [String] = [],
        phoneNumber: String? = nil,
        participantName: String? = nil,
        recordingURL: URL? = nil,
        transcript: Transcript? = nil,
        callType: CallType = .unknown,
        callDirection: CallDirection = .unknown,
        isInProgress: Bool = false,
        location: String? = nil,
        isRecorded: Bool = false,
        isUpcoming: Bool = false,
        isFromCalendar: Bool = false,
        autoRecorded: Bool = false,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.participants = participants
        self.phoneNumber = phoneNumber
        self.participantName = participantName
        self.recordingURL = recordingURL
        self.transcript = transcript
        self.callType = callType
        self.callDirection = callDirection
        self.isInProgress = isInProgress
        self.location = location
        self.isRecorded = isRecorded
        self.isUpcoming = isUpcoming
        self.isFromCalendar = isFromCalendar
        self.autoRecorded = autoRecorded
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // MARK: - Computed Properties
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        let seconds = Int(duration) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
    
    var hasRecording: Bool {
        recordingURL != nil
    }
    
    var hasTranscript: Bool {
        transcript != nil
    }
}

// MARK: - Supporting Enums

enum CallType: String, CaseIterable, Codable {
    case voice = "Voice"
    case video = "Video"
    case facetime = "FaceTime"
    case unknown = "Unknown"
    
    var icon: String {
        switch self {
        case .voice: return "phone"
        case .video: return "video"
        case .facetime: return "video.fill"
        case .unknown: return "questionmark.circle"
        }
    }
    
    var displayName: String {
        rawValue
    }
}

enum CallDirection: String, CaseIterable, Codable {
    case incoming = "Incoming"
    case outgoing = "Outgoing"
    case missed = "Missed"
    case unknown = "Unknown"
    
    var color: String {
        switch self {
        case .incoming: return "green"
        case .outgoing: return "blue"
        case .missed: return "red"
        case .unknown: return "gray"
        }
    }
    
    var displayName: String {
        rawValue
    }
}
