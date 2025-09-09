import SwiftUI

struct EnhancedTabBarView: View {
    @Binding var selectedTab: Int
    @State private var showHamburgerMenu = false
    
    private var mainTabs: [(icon: String, title: String)] {
        [
            ("house.fill", "Home"),
            ("calendar", "Calendar"),
            ("doc.plaintext.fill", "Transcripts")
        ]
    }
    
    var body: some View {
        HStack(spacing: 0) {
            // Main tabs
            ForEach(0..<mainTabs.count, id: \.self) { index in
                EnhancedTabButton(
                    icon: mainTabs[index].icon,
                    title: mainTabs[index].title,
                    isSelected: selectedTab == index,
                    action: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedTab = index
                        }
                    }
                )
            }
            
            // Hamburger menu button
            Button(action: {
                withAnimation(.easeInOut(duration: 0.3)) {
                    showHamburgerMenu = true
                }
            }) {
                VStack(spacing: 4) {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(showHamburgerMenu ? .blue : .secondary)
                    
                    Text("More")
                        .font(.caption2)
                        .foregroundColor(showHamburgerMenu ? .blue : .secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 60)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .background(Color(.systemBackground))
        .overlay(
            Rectangle()
                .frame(height: 0.5)
                .foregroundColor(Color.gray.opacity(0.3))
                .offset(y: -30),
            alignment: .top
        )
        .overlay(
            HamburgerMenuView(isPresented: $showHamburgerMenu) { tabIndex in
                selectedTab = tabIndex
            }
            .opacity(showHamburgerMenu ? 1 : 0)
            .allowsHitTesting(showHamburgerMenu)
        )
    }
}

struct EnhancedTabButton: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(isSelected ? .blue : .secondary)
                
                Text(title)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .blue : .secondary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 60)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    EnhancedTabBarView(selectedTab: .constant(0))
}
