import Foundation
import Combine

// MARK: - Authentication ViewModel
// Bridges UI and authentication service

@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var errorMessage: String?
    @Published var isLoading = false
    
    private let authenticationService: any AuthenticationService
    private var cancellables = Set<AnyCancellable>()
    
    init(authenticationService: (any AuthenticationService)? = nil) {
        self.authenticationService = authenticationService ?? AuthenticationServiceImpl()
        setupBindings()
    }
    
    // MARK: - Setup
    
    private func setupBindings() {
        // Note: Protocol-based services don't expose @Published properties directly
        // We'll handle state updates through method calls instead
    }
    
    // MARK: - Authentication Methods
    
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await authenticationService.signIn(email: email, password: password)
            isLoading = false
            // Update local state from service
            isAuthenticated = authenticationService.isAuthenticated
            currentUser = authenticationService.currentUser
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
    
    func signUp(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await authenticationService.signUp(email: email, password: password)
            isLoading = false
            // Update local state from service
            isAuthenticated = authenticationService.isAuthenticated
            currentUser = authenticationService.currentUser
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
    
    func signOut() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await authenticationService.signOut()
            isLoading = false
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
    
    func resetPassword(email: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await authenticationService.resetPassword(email: email)
            isLoading = false
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Validation
    
    func validateEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    func validatePassword(_ password: String) -> Bool {
        return password.count >= 8
    }
    
    // MARK: - Computed Properties
    
    var userDisplayName: String {
        currentUser?.name ?? currentUser?.email ?? "Unknown User"
    }
    
    var canSignIn: Bool {
        !isLoading
    }
    
    var canSignUp: Bool {
        !isLoading
    }
    
    var canSignOut: Bool {
        isAuthenticated && !isLoading
    }
}
