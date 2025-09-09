import SwiftUI

struct InitialSplashView: View {
    @State private var logoScale: CGFloat = 0.1
    @State private var logoOpacity: Double = 0.0
    @State private var logoRotation: Double = 0.0
    @State private var showRipple = false
    @State private var rippleScale: CGFloat = 0.5
    @State private var rippleOpacity: Double = 0.0
    @State private var showParticles = false
    @State private var particleOffset: CGFloat = 0
    
    let onComplete: () -> Void
    
    var body: some View {
        ZStack {
            // Deep space-like background
            LinearGradient(
                colors: [
                    Color(red: 0.05, green: 0.05, blue: 0.15),
                    Color(red: 0.1, green: 0.05, blue: 0.2),
                    Color(red: 0.05, green: 0.1, blue: 0.25)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Animated background stars
            if showParticles {
                ForEach(0..<30, id: \.self) { index in
                    Circle()
                        .fill(Color.white.opacity(0.3))
                        .frame(width: CGFloat.random(in: 1...3))
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
            
            VStack(spacing: 0) {
                Spacer()
                
                // Main logo with multiple animation layers
                ZStack {
                    // Outer ripple effect
                    if showRipple {
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.4)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2
                            )
                            .frame(width: 200, height: 200)
                            .scaleEffect(rippleScale)
                            .opacity(rippleOpacity)
                            .blur(radius: 1)
                    }
                    
                    // Middle glow ring
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.6)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 3
                        )
                        .frame(width: 160, height: 160)
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)
                        .blur(radius: 2)
                    
                    // Inner circle with gradient
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.blue.opacity(0.4),
                                    Color.purple.opacity(0.6),
                                    Color.blue.opacity(0.2)
                                ],
                                center: .center,
                                startRadius: 20,
                                endRadius: 80
                            )
                        )
                        .frame(width: 120, height: 120)
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                        )
                    
                    // Main microphone icon
                    Image(systemName: "mic.fill")
                        .font(.system(size: 50, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.white, Color.white.opacity(0.8)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)
                        .rotationEffect(.degrees(logoRotation))
                        .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 2)
                }
                
                Spacer()
                
                // App name with typewriter effect
                VStack(spacing: 8) {
                    Text("CallAI")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.white, Color.white.opacity(0.8)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(logoOpacity)
                        .offset(y: particleOffset)
                        .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 2)
                    
                    Text("Powered by AI")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                        .opacity(logoOpacity)
                        .offset(y: particleOffset)
                }
                .padding(.bottom, 50)
            }
        }
        .onAppear {
            startInitialAnimation()
        }
    }
    
    private func startInitialAnimation() {
        // Show particles first
        withAnimation(.easeInOut(duration: 0.5)) {
            showParticles = true
        }
        
        // Initial logo entrance
        withAnimation(.spring(response: 1.2, dampingFraction: 0.6, blendDuration: 0)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }
        
        // Rotation animation
        withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
            logoRotation = 360
        }
        
        // Ripple effect
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation(.easeOut(duration: 0.3)) {
                showRipple = true
            }
            
            withAnimation(.easeOut(duration: 1.5)) {
                rippleScale = 1.5
                rippleOpacity = 0.8
            }
        }
        
        // Text entrance
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.7, blendDuration: 0)) {
                particleOffset = 0
            }
        }
        
        // Complete after total duration
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            withAnimation(.easeInOut(duration: 0.8)) {
                logoOpacity = 0.0
                rippleOpacity = 0.0
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                onComplete()
            }
        }
    }
}

#Preview {
    InitialSplashView {
        print("Initial splash completed")
    }
}
