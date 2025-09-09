import SwiftUI

struct HamburgerMenuView: View {
    @Binding var isPresented: Bool
    @State private var selectedTab: Int = 0
    
    let onTabSelected: (Int) -> Void
    
    var body: some View {
        ZStack {
            // Background overlay
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isPresented = false
                    }
                }
            
            // Menu panel
            HStack {
                Spacer()
                
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    HStack {
                        Text("More Options")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                isPresented = false
                            }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 16)
                    
                    Divider()
                    
                    // Menu items
                    VStack(spacing: 0) {
                        MenuRow(
                            icon: "calendar.badge.plus",
                            title: "Meetings",
                            subtitle: "View and manage meetings",
                            action: {
                                onTabSelected(0) // Meetings tab
                                isPresented = false
                            }
                        )
                        
                        MenuRow(
                            icon: "calendar",
                            title: "Calendar",
                            subtitle: "Calendar view and events",
                            action: {
                                onTabSelected(1) // Calendar tab
                                isPresented = false
                            }
                        )
                        
                        MenuRow(
                            icon: "doc.plaintext.fill",
                            title: "Transcripts",
                            subtitle: "View meeting transcripts",
                            action: {
                                onTabSelected(2) // Transcripts tab
                                isPresented = false
                            }
                        )
                        
                        MenuRow(
                            icon: "bubble.left.and.bubble.right",
                            title: "Conversation History",
                            subtitle: "View your communication history",
                            action: {
                                onTabSelected(3) // Conversation History tab
                                isPresented = false
                            }
                        )
                        
                        MenuRow(
                            icon: "waveform",
                            title: "Call Recordings",
                            subtitle: "Access iPhone call recordings",
                            action: {
                                onTabSelected(4) // Call Recordings tab
                                isPresented = false
                            }
                        )
                        
                        MenuRow(
                            icon: "gearshape.fill",
                            title: "Settings",
                            subtitle: "App preferences",
                            action: {
                                onTabSelected(5) // Settings tab
                                isPresented = false
                            }
                        )
                    }
                    
                    Spacer()
                }
                .frame(width: 280)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.1), radius: 10, x: -5, y: 0)
            }
        }
        .transition(.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .trailing).combined(with: .opacity)
        ))
    }
}

struct MenuRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .buttonStyle(PlainButtonStyle())
        
        Divider()
            .padding(.leading, 66)
    }
}

// Custom corner radius shape for macOS compatibility
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: RectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        _ = rect.size.width
        _ = rect.size.height
        
        // Create rounded rectangle path manually for macOS compatibility
        path.move(to: CGPoint(x: rect.minX + radius, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
        
        if corners.contains(.topRight) {
            path.addArc(center: CGPoint(x: rect.maxX - radius, y: rect.minY + radius),
                       radius: radius, startAngle: Angle(degrees: -90), endAngle: Angle(degrees: 0), clockwise: false)
        } else {
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + radius))
        }
        
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - radius))
        
        if corners.contains(.bottomRight) {
            path.addArc(center: CGPoint(x: rect.maxX - radius, y: rect.maxY - radius),
                       radius: radius, startAngle: Angle(degrees: 0), endAngle: Angle(degrees: 90), clockwise: false)
        } else {
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.maxY))
        }
        
        path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.maxY))
        
        if corners.contains(.bottomLeft) {
            path.addArc(center: CGPoint(x: rect.minX + radius, y: rect.maxY - radius),
                       radius: radius, startAngle: Angle(degrees: 90), endAngle: Angle(degrees: 180), clockwise: false)
        } else {
            path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - radius))
        }
        
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
        
        if corners.contains(.topLeft) {
            path.addArc(center: CGPoint(x: rect.minX + radius, y: rect.minY + radius),
                       radius: radius, startAngle: Angle(degrees: 180), endAngle: Angle(degrees: 270), clockwise: false)
        } else {
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.minY))
        }
        
        return path
    }
}

struct RectCorner: OptionSet {
    let rawValue: Int
    
    static let topLeft = RectCorner(rawValue: 1 << 0)
    static let topRight = RectCorner(rawValue: 1 << 1)
    static let bottomLeft = RectCorner(rawValue: 1 << 2)
    static let bottomRight = RectCorner(rawValue: 1 << 3)
    static let allCorners: RectCorner = [.topLeft, .topRight, .bottomLeft, .bottomRight]
}

#Preview {
    HamburgerMenuView(isPresented: .constant(true)) { _ in }
}
