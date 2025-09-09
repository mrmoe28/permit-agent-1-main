import SwiftUI

struct IntroSplashView: View {
    @State private var isAnimating = false
    @State private var showContent = false
    @State private var scale: CGFloat = 0.3
    @State private var opacity: Double = 0.0
    @State private var rotation: Double = 0.0
    @State private var pulseScale: CGFloat = 1.0
    @State private var showParticles = false
    @State private var progress: Double = 0.0
    
    let onComplete: () -> Void
    
    var body: some View {
        ZStack {
            // Modern gradient background
            LinearGradient(
                colors: [
                    Color(red: 0.1, green: 0.1, blue: 0.3),
                    Color(red: 0.2, green: 0.1, blue: 0.4),
                    Color(red: 0.1, green: 0.2, blue: 0.5)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Animated background particles
            if showParticles {
                ForEach(0..<15, id: \.self) { index in
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: CGFloat.random(in: 2...6))
                        .position(
                            x: CGFloat.random(in: 0...800),
                            y: CGFloat.random(in: 0...600)
                        )
                        .animation(
                            .easeInOut(duration: Double.random(in: 2...4))
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.1),
                            value: showParticles
                        )
                }
            }
            
            VStack(spacing: 40) {
                Spacer()
                
                // Modern App Icon/Logo
                ZStack {
                    // Outer glow ring
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 3
                        )
                        .frame(width: 140, height: 140)
                        .scaleEffect(scale)
                        .opacity(opacity)
                        .blur(radius: 2)
                    
                    // Main circle
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.5)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)
                        .scaleEffect(scale)
                        .opacity(opacity)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                    
                    // Microphone icon with modern styling
                    ZStack {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 40, weight: .medium))
                            .foregroundColor(.white)
                            .scaleEffect(scale)
                            .opacity(opacity)
                        
                        // Pulse effect
                        Circle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 2)
                            .frame(width: 60, height: 60)
                            .scaleEffect(pulseScale)
                            .opacity(opacity * 0.6)
                    }
                }
                
                // App Name with modern typography
                VStack(spacing: 12) {
                    Text("CallAI")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.white, Color.white.opacity(0.8)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(showContent ? 1.0 : 0.0)
                        .offset(y: showContent ? 0 : 30)
                        .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 2)
                    
                    Text("AI-Powered Meeting Assistant")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .opacity(showContent ? 1.0 : 0.0)
                        .offset(y: showContent ? 0 : 20)
                        .multilineTextAlignment(.center)
                }
                
                Spacer()
                
                // Modern loading indicator
                if showContent {
                    VStack(spacing: 16) {
                        // Custom progress indicator
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.2), lineWidth: 3)
                                .frame(width: 40, height: 40)
                            
                            Circle()
                                .trim(from: 0, to: progress)
                                .stroke(
                                    LinearGradient(
                                        colors: [Color.blue, Color.purple],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ),
                                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                                )
                                .frame(width: 40, height: 40)
                                .rotationEffect(.degrees(-90))
                        }
                        
                        Text("Preparing your AI assistant...")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .opacity(showContent ? 1.0 : 0.0)
                    .offset(y: showContent ? 0 : 20)
                }
                
                Spacer()
            }
            .padding(.horizontal, 30)
        }
        .onAppear {
            startAnimation()
        }
    }
    
    private func startAnimation() {
        // Show particles
        withAnimation(.easeInOut(duration: 0.5)) {
            showParticles = true
        }
        
        // Initial scale and opacity animation
        withAnimation(.easeOut(duration: 0.8)) {
            scale = 1.0
            opacity = 1.0
        }
        
        // Pulse animation
        withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
            pulseScale = 1.1
        }
        
        // Show content after initial animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation(.easeOut(duration: 0.6)) {
                showContent = true
            }
        }
        
        // Progress animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeInOut(duration: 2.0)) {
                progress = 1.0
            }
        }
        
        // Complete intro after total duration
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) {
            withAnimation(.easeInOut(duration: 0.5)) {
                onComplete()
            }
        }
    }
}

#Preview {
    IntroSplashView {
        print("Intro completed")
    }
}