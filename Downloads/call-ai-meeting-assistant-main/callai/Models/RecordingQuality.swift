import Foundation

// MARK: - Recording Quality Settings
// Audio recording configuration options

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
    
    var displayName: String {
        rawValue
    }
    
    var description: String {
        switch self {
        case .low:
            return "Smaller file size, basic quality"
        case .standard:
            return "Good balance of quality and file size"
        case .high:
            return "High quality, larger file size"
        case .lossless:
            return "Best quality, largest file size"
        }
    }
    
    var estimatedFileSizePerMinute: String {
        switch self {
        case .low:
            return "~1 MB"
        case .standard:
            return "~2 MB"
        case .high:
            return "~5 MB"
        case .lossless:
            return "~10 MB"
        }
    }
}
