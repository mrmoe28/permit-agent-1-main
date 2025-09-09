import Foundation
import Combine

// MARK: - Authentication Service Implementation
// Clean implementation for user authentication

@MainActor
class AuthenticationServiceImpl: AuthenticationService {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var errorMessage: String?
    
    private let storageManager = StorageManager.shared
    
    init() {
        checkAuthenticationStatus()
    }
    
    // MARK: - Authentication Status
    
    private func checkAuthenticationStatus() {
        // In a real app, this would check for valid auth tokens
        // For now, we'll use a simple approach
        Task { @MainActor [weak self] in
            if let user = await self?.loadCurrentUser() {
                self?.currentUser = user
                self?.isAuthenticated = true
            }
        }
    }
    
    // MARK: - Authentication Methods
    
    func signIn(email: String, password: String) async throws {
        errorMessage = nil
        
        // Validate input
        guard !email.isEmpty, !password.isEmpty else {
            throw ServiceError.invalidInput("Email and password are required")
        }
        
        guard isValidEmail(email) else {
            throw ServiceError.invalidInput("Invalid email format")
        }
        
        do {
            // Simulate network call
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            
            // Mock authentication - in real app, this would call your auth API
            let user = User(
                email: email,
                name: extractNameFromEmail(email)
            )
            
            // Save user data
            try await saveCurrentUser(user)
            
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.errorMessage = nil
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Sign in failed: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func signUp(email: String, password: String) async throws {
        errorMessage = nil
        
        // Validate input
        guard !email.isEmpty, !password.isEmpty else {
            throw ServiceError.invalidInput("Email and password are required")
        }
        
        guard isValidEmail(email) else {
            throw ServiceError.invalidInput("Invalid email format")
        }
        
        guard password.count >= 8 else {
            throw ServiceError.invalidInput("Password must be at least 8 characters")
        }
        
        do {
            // Simulate network call
            try await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
            
            // Mock user creation - in real app, this would call your auth API
            let user = User(
                email: email,
                name: extractNameFromEmail(email)
            )
            
            // Save user data
            try await saveCurrentUser(user)
            
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.errorMessage = nil
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Sign up failed: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func signOut() async throws {
        do {
            // Clear stored user data
            try await storageManager.delete(key: "current_user")
            
            await MainActor.run {
                self.currentUser = nil
                self.isAuthenticated = false
                self.errorMessage = nil
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Sign out failed: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func resetPassword(email: String) async throws {
        errorMessage = nil
        
        guard !email.isEmpty else {
            throw ServiceError.invalidInput("Email is required")
        }
        
        guard isValidEmail(email) else {
            throw ServiceError.invalidInput("Invalid email format")
        }
        
        do {
            // Simulate network call
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            
            // Mock password reset - in real app, this would call your auth API
            await MainActor.run {
                self.errorMessage = nil
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Password reset failed: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    // MARK: - Private Methods
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func extractNameFromEmail(_ email: String) -> String {
        let components = email.components(separatedBy: "@")
        let localPart = components.first ?? ""
        
        // Convert email local part to a readable name
        return localPart.replacingOccurrences(of: ".", with: " ")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }
    
    private func saveCurrentUser(_ user: User) async throws {
        try await storageManager.save(user, key: "current_user")
    }
    
    private func loadCurrentUser() async -> User? {
        return try? await storageManager.load(User.self, key: "current_user")
    }
}

// MARK: - Service Factory Extension

extension ServiceFactory {
    @MainActor
    static func createAuthenticationService() -> any AuthenticationService {
        return AuthenticationServiceImpl()
    }
}
