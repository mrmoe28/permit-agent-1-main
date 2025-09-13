import SwiftUI

struct GitHubSettingsView: View {
    @StateObject private var githubService = GitHubService.shared
    @State private var tokenInput = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSuccessMessage = false
    @State private var showTokenInput = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header - stays fixed at top
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: "link.circle.fill")
                        .font(.title2)
                        .foregroundColor(.accentColor)
                    Text("GitHub Integration")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                
                Divider()
            }
            .padding(.horizontal)
            .padding(.top)
            
            // Scrollable content
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if githubService.isAuthenticated {
                        authenticatedView
                    } else {
                        unauthenticatedView
                    }
                }
                .padding()
                .padding(.bottom)
            }
        }
        .frame(minWidth: 450, maxWidth: 600, minHeight: 400, maxHeight: 600)
    }
    
    private var authenticatedView: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Status
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                Text("Connected to GitHub")
                    .fontWeight(.semibold)
            }
            
            // User info
            if let user = githubService.currentUser {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Logged in as:")
                            .foregroundColor(.secondary)
                        Text(user.login)
                            .fontWeight(.medium)
                    }
                    
                    if let name = user.name {
                        HStack {
                            Text("Name:")
                                .foregroundColor(.secondary)
                            Text(name)
                        }
                    }
                    
                    if let email = user.email {
                        HStack {
                            Text("Email:")
                                .foregroundColor(.secondary)
                            Text(email)
                        }
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
            }
            
            // Disconnect button
            Button(action: disconnect) {
                Label("Disconnect", systemImage: "xmark.circle")
                    .foregroundColor(.red)
            }
            .buttonStyle(.plain)
            .padding(.vertical, 8)
            .padding(.horizontal, 16)
            .background(Color.red.opacity(0.1))
            .cornerRadius(8)
            
            // Success message
            if showSuccessMessage {
                HStack {
                    Image(systemName: "checkmark.circle")
                        .foregroundColor(.green)
                    Text("GitHub account successfully connected!")
                        .foregroundColor(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
                .transition(.opacity)
            }
        }
    }
    
    private var unauthenticatedView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Connect your GitHub account to:")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 8) {
                Label("Create repositories for your projects", systemImage: "folder.badge.plus")
                Label("Use GitHub-hosted templates", systemImage: "doc.text")
                Label("Push your code automatically", systemImage: "arrow.up.circle")
                Label("Access private repositories", systemImage: "lock.circle")
            }
            .foregroundColor(.secondary)
            
            // Setup instructions
            VStack(alignment: .leading, spacing: 12) {
                Text("Setup Instructions:")
                    .font(.headline)
                    .padding(.top)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("1. Go to GitHub → Settings → Developer settings → Personal access tokens")
                        .fixedSize(horizontal: false, vertical: true)
                    Text("2. Click 'Generate new token (classic)'")
                        .fixedSize(horizontal: false, vertical: true)
                    Text("3. Give it a name and select these scopes:")
                        .fixedSize(horizontal: false, vertical: true)
                    VStack(alignment: .leading) {
                        Text("   • repo (Full control of private repositories)")
                            .fixedSize(horizontal: false, vertical: true)
                        Text("   • user (Read user profile data)")
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.leading)
                    Text("4. Copy the generated token and paste it below")
                        .fixedSize(horizontal: false, vertical: true)
                }
                .font(.caption)
                .foregroundColor(.secondary)
                .lineSpacing(2)
            }
            
            // Token input
            if showTokenInput {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Personal Access Token:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        SecureField("ghp_...", text: $tokenInput)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .disabled(isLoading)
                        
                        Button(action: authenticate) {
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Text("Connect")
                            }
                        }
                        .disabled(tokenInput.isEmpty || isLoading)
                    }
                }
                
                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.top, 4)
                }
            } else {
                Button(action: { showTokenInput = true }) {
                    Label("Add GitHub Account", systemImage: "plus.circle")
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
    }
    
    private func authenticate() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await githubService.setAccessToken(tokenInput)
                await MainActor.run {
                    showSuccessMessage = true
                    tokenInput = ""
                    showTokenInput = false
                    isLoading = false
                    
                    // Hide success message after 3 seconds
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        showSuccessMessage = false
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
    
    private func disconnect() {
        githubService.removeAccessToken()
        tokenInput = ""
        showTokenInput = false
        errorMessage = nil
        showSuccessMessage = false
    }
}

struct GitHubSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        GitHubSettingsView()
    }
}