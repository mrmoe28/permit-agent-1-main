import Foundation

struct AppConfig {
    static let shared = AppConfig()
    
    private init() {}
    
    var openAIAPIKey: String {
        return KeychainManager.shared.openAIAPIKey ?? ""
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
    func createAISummaryService() -> AISummaryService {
        return AISummaryService(apiKey: openAIAPIKey)
    }
}