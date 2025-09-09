import SwiftUI

struct AppCoordinatorView: View {
    @State private var showInitialSplash = true
    @State private var showIntro = false
    @State private var showLandingPage = false
    @State private var showMainApp = false
    @State private var hasSeenIntro = false
    @StateObject private var breadcrumbManager = BreadcrumbManager()
    
    var body: some View {
        ZStack {
            if showInitialSplash {
                InitialSplashView {
                    completeInitialSplash()
                }
                .transition(.opacity)
            } else if showIntro {
                IntroSplashView {
                    completeIntro()
                }
                .transition(.opacity)
            } else if showLandingPage {
                ContentView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
            } else if showMainApp {
                ContentView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
            }
        }
        .onAppear {
            checkFirstLaunch()
        }
    }
    
    private func checkFirstLaunch() {
        hasSeenIntro = UserDefaults.standard.bool(forKey: "hasSeenIntro")
        
        if hasSeenIntro {
            // Skip intro for returning users - go directly to landing page
            showInitialSplash = false
            showIntro = false
            showLandingPage = true
            breadcrumbManager.setPath(BreadcrumbManager.landingPath)
        } else {
            // Show initial splash for all users, then intro for first-time users
            showInitialSplash = true
        }
    }
    
    private func completeInitialSplash() {
        withAnimation(.easeInOut(duration: 0.5)) {
            showInitialSplash = false
            
            if hasSeenIntro {
                // Returning user - go to landing page
                showLandingPage = true
                breadcrumbManager.setPath(BreadcrumbManager.landingPath)
            } else {
                // First-time user - show intro
                showIntro = true
            }
        }
    }
    
    private func completeIntro() {
        withAnimation(.easeInOut(duration: 0.5)) {
            showIntro = false
            showLandingPage = true
        }
        
        // Mark intro as seen
        UserDefaults.standard.set(true, forKey: "hasSeenIntro")
        hasSeenIntro = true
        breadcrumbManager.setPath(BreadcrumbManager.landingPath)
    }
    
    // Method to navigate to main app (can be called from landing page)
    func navigateToMainApp() {
        withAnimation(.easeInOut(duration: 0.5)) {
            showLandingPage = false
            showMainApp = true
        }
    }
    
    // Method to return to landing page (can be called from main app)
    func returnToLandingPage() {
        withAnimation(.easeInOut(duration: 0.5)) {
            showMainApp = false
            showLandingPage = true
            breadcrumbManager.setPath(BreadcrumbManager.landingPath)
        }
    }
    
    // Method to handle back button from any page
    func handleBackNavigation() {
        if showMainApp {
            returnToLandingPage()
        }
    }
    
    // Handle breadcrumb navigation
    func handleBreadcrumbAction(_ action: BreadcrumbAction) {
        switch action {
        case .goToLanding:
            returnToLandingPage()
        case .goToMainApp:
            navigateToMainApp()
        case .goToTab(_):
            // This will be handled by ContentView
            break
        case .custom(let customAction):
            customAction()
        }
    }
}

#Preview {
    AppCoordinatorView()
}
