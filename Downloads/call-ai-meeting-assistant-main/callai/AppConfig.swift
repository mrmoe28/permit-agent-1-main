import Foundation

@MainActor
class AppConfig {
    static let shared = AppConfig()
    
    private init() {}
    
    var openAIAPIKey: String {
        // First check keychain
        if let keychainKey = KeychainManager.shared.openAIAPIKey, !keychainKey.isEmpty {
            return keychainKey
        }
        
        // Fallback to baked-in key
        return APIKeyConfig.shared.getAPIKey()
    }
    
    var hasValidOpenAIAPIKey: Bool {
        let key = openAIAPIKey
        return !key.isEmpty && key.starts(with: "sk-")
    }
    
    var appVersion: String {
        return Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    }
    
    var buildNumber: String {
        return Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
    }
    
    var isDebug: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}

extension AppConfig {
    @MainActor
    func createAISummaryService() -> any AISummaryService {
        return AISummaryServiceImpl()
    }
    
    @MainActor
    func createWhisperService() -> WhisperService {
        return WhisperService(apiKey: openAIAPIKey)
    }
    
    @MainActor
    func createExportService() -> ExportService {
        return ExportService()
    }
    
    @MainActor
    func createMeetingDetectionService(
        calendarService: any CalendarService,
        audioService: any AudioRecordingService
    ) -> MeetingDetectionService {
        return MeetingDetectionService(
            calendarService: calendarService,
            audioService: audioService
        )
    }
    
    // App settings
    var defaultRecordingQuality: RecordingQuality {
        get {
            if let rawValue = UserDefaults.standard.object(forKey: "defaultRecordingQuality") as? String,
               let quality = RecordingQuality(rawValue: rawValue) {
                return quality
            }
            return .standard
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: "defaultRecordingQuality")
        }
    }
    
    var autoRecordEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "autoRecordEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "autoRecordEnabled") }
    }
    
    var autoTranscribeEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "autoTranscribeEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "autoTranscribeEnabled") }
    }
    
    var autoSummarizeEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "autoSummarizeEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "autoSummarizeEnabled") }
    }
}