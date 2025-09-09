import Foundation
import CryptoKit

@MainActor
class APIKeyConfig {
    static let shared = APIKeyConfig()
    
    private init() {}
    
    func getAPIKey() -> String {
        // Read from environment variable set in Xcode scheme
        if let envKey = ProcessInfo.processInfo.environment["openai_api_key"], !envKey.isEmpty {
            return envKey
        }
        
        // Fallback to empty string
        return ""
    }
    
    // Automatically initialize the keychain with the baked-in key
    func initializeKeychainIfNeeded() {
        // Only set if no key exists in keychain
        if KeychainManager.shared.openAIAPIKey == nil {
            let apiKey = getAPIKey()
            if !apiKey.isEmpty {
                KeychainManager.shared.openAIAPIKey = apiKey
            }
        }
    }
}