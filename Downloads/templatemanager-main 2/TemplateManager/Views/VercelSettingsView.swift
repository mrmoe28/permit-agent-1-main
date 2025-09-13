import SwiftUI

struct VercelSettingsView: View {
    @StateObject private var vercelService = VercelService.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var showingLoginFlow = false
    @State private var isCheckingAuth = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 10) {
                HStack {
                    Image(systemName: "triangle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.black)
                    
                    Text("Vercel Integration")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                }
                
                Text("Deploy your projects directly to Vercel")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.top)
            
            Divider()
            
            // Authentication Status
            VStack(alignment: .leading, spacing: 15) {
                HStack {
                    Image(systemName: vercelService.isAuthenticated ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundColor(vercelService.isAuthenticated ? .green : .red)
                    
                    Text(vercelService.isAuthenticated ? "Authenticated" : "Not Authenticated")
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    if vercelService.isAuthenticated {
                        Text(vercelService.currentUser ?? "")
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                }
                .padding()
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(8)
                
                // CLI Installation Status
                HStack {
                    Image(systemName: VercelService.checkCLIInstalled() ? "terminal.fill" : "terminal")
                        .foregroundColor(VercelService.checkCLIInstalled() ? .green : .orange)
                    
                    Text(VercelService.checkCLIInstalled() ? "Vercel CLI Installed" : "Vercel CLI Not Found")
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    if !VercelService.checkCLIInstalled() {
                        Button("Install Instructions") {
                            VercelService.showInstallInstructions()
                        }
                        .buttonStyle(.link)
                    }
                }
                .padding()
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(8)
            }
            .padding(.horizontal)
            
            // Actions
            VStack(spacing: 10) {
                if vercelService.isAuthenticated {
                    Button(action: {
                        Task {
                            try await vercelService.logout()
                        }
                    }) {
                        Label("Logout from Vercel", systemImage: "arrow.right.square")
                            .frame(width: 200)
                    }
                    .foregroundColor(.red)
                    
                    Button(action: {
                        isCheckingAuth = true
                        Task {
                            await vercelService.checkAuthentication()
                            isCheckingAuth = false
                        }
                    }) {
                        if isCheckingAuth {
                            ProgressView()
                                .scaleEffect(0.8)
                                .frame(width: 200)
                        } else {
                            Label("Refresh Status", systemImage: "arrow.clockwise")
                                .frame(width: 200)
                        }
                    }
                    .buttonStyle(.bordered)
                    .disabled(isCheckingAuth)
                } else {
                    Button(action: {
                        Task {
                            do {
                                try await vercelService.login()
                            } catch {
                                // Error is handled in the login method
                            }
                        }
                    }) {
                        Label("Login to Vercel", systemImage: "arrow.right.square")
                            .frame(width: 200)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!VercelService.checkCLIInstalled())
                }
            }
            
            Spacer()
            
            // Info Section
            VStack(alignment: .leading, spacing: 10) {
                Text("About Vercel Integration")
                    .font(.headline)
                
                Text("""
                • Deploy Next.js, React, Vue, and other frameworks
                • Automatic HTTPS and global CDN
                • Preview deployments for every push
                • Environment variables management
                • Serverless functions support
                """)
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
            .padding(.horizontal)
            
            // Close Button
            Button("Done") {
                dismiss()
            }
            .buttonStyle(.bordered)
            .keyboardShortcut(.defaultAction)
            .padding(.bottom)
        }
        .frame(width: 500, height: 600)
        .background(Color(NSColor.windowBackgroundColor))
        .onAppear {
            Task {
                await vercelService.checkAuthentication()
            }
        }
    }
}