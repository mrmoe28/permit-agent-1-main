//
//  AuthGateView.swift
//  callai
//
//  Created by Edward Harrison on 9/2/25.
//

import SwiftUI

struct AuthGateView: View {
    @StateObject private var authViewModel = AuthenticationViewModel()
    @State private var showingSignIn = false
    @State private var showingSignUp = false
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                // User is authenticated, show main app
                AppCoordinatorView()
            } else {
                // User is not authenticated, show auth screens
                if showingSignUp {
                    SignUpView(onSignUpComplete: {
                        showingSignUp = false
                    }, onBackToSignIn: {
                        showingSignUp = false
                        showingSignIn = true
                    })
                } else if showingSignIn {
                    SignInView(onSignInComplete: {
                        showingSignIn = false
                    }, onBackToSignUp: {
                        showingSignIn = false
                        showingSignUp = true
                    })
                } else {
                    // Landing screen
                    AuthLandingView(
                        onSignIn: { showingSignIn = true },
                        onSignUp: { showingSignUp = true }
                    )
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authViewModel.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: showingSignIn)
        .animation(.easeInOut(duration: 0.3), value: showingSignUp)
    }
}

struct AuthLandingView: View {
    let onSignIn: () -> Void
    let onSignUp: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 40) {
                Spacer()
                
                // App Logo/Title
                VStack(spacing: 16) {
                    Image(systemName: "mic.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                    
                    Text("Call AI")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Your intelligent meeting assistant")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                Spacer()
                
                // Auth Buttons
                VStack(spacing: 16) {
                    Button(action: onSignIn) {
                        HStack {
                            Image(systemName: "person.circle")
                            Text("Sign In")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    
                    Button(action: onSignUp) {
                        HStack {
                            Image(systemName: "person.badge.plus")
                            Text("Sign Up")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 32)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Welcome")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
        }
    }
}

#Preview {
    AuthGateView()
}
