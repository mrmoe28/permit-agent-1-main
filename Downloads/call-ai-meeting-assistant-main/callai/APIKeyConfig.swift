import Foundation
import CryptoKit

class APIKeyConfig {
    static let shared = APIKeyConfig()
    
    private init() {}
    
    func getAPIKey() -> String {
        // Return empty string - user must provide their own API key
        return ""
    }
    
    // Automatically initialize the keychain with the baked-in key
    func initializeKeychainIfNeeded() {
        // Only set if no key exists in keychain
        // No longer auto-initializing - user must provide their own key
        // if KeychainManager.shared.openAIAPIKey == nil {
        //     let apiKey = getAPIKey()
        //     if !apiKey.isEmpty {
        //         KeychainManager.shared.openAIAPIKey = apiKey
        //     }
        // }
    }
}