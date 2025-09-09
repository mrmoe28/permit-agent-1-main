import SwiftUI

struct BreadcrumbNavigation: View {
    let items: [BreadcrumbItem]
    let onItemTap: (BreadcrumbItem) -> Void
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                HStack(spacing: 4) {
                    if index > 0 {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Button(action: {
                        onItemTap(item)
                    }) {
                        HStack(spacing: 4) {
                            if let icon = item.icon {
                                Image(systemName: icon)
                                    .font(.system(size: 12, weight: .medium))
                            }
                            
                            Text(item.title)
                                .font(.system(size: 14, weight: index == items.count - 1 ? .semibold : .medium))
                        }
                        .foregroundColor(index == items.count - 1 ? .primary : .secondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 0.5)
                )
        )
    }
}

struct BreadcrumbItem: Identifiable, Equatable, Sendable {
    let id = UUID()
    let title: String
    let icon: String?
    let action: BreadcrumbAction
    
    static func == (lhs: BreadcrumbItem, rhs: BreadcrumbItem) -> Bool {
        lhs.id == rhs.id
    }
}

enum BreadcrumbAction: Sendable {
    case goToLanding
    case goToMainApp
    case goToTab(Int)
    case custom(@Sendable () -> Void)
}

// MARK: - Breadcrumb Manager
@MainActor
class BreadcrumbManager: ObservableObject {
    @Published var currentPath: [BreadcrumbItem] = []
    
    func setPath(_ items: [BreadcrumbItem]) {
        currentPath = items
    }
    
    func addItem(_ item: BreadcrumbItem) {
        currentPath.append(item)
    }
    
    func removeLast() {
        if !currentPath.isEmpty {
            currentPath.removeLast()
        }
    }
    
    func clear() {
        currentPath = []
    }
    
    // Predefined breadcrumb sets
    static let landingPath = [
        BreadcrumbItem(title: "Home", icon: "house.fill", action: .goToLanding)
    ]
    
    static func mainAppPath(selectedTab: Int) -> [BreadcrumbItem] {
        let tabNames = ["Meetings", "Calendar", "Transcripts", "Analytics", "Call Recordings", "Settings"]
        let tabIcons = ["calendar.badge.plus", "calendar", "doc.plaintext.fill", "chart.bar.fill", "waveform", "gearshape.fill"]
        
        return [
            BreadcrumbItem(title: "Home", icon: "house.fill", action: .goToLanding),
            BreadcrumbItem(title: tabNames[selectedTab], icon: tabIcons[selectedTab], action: .goToTab(selectedTab))
        ]
    }
    
    static let quickRecordPath = [
        BreadcrumbItem(title: "Home", icon: "house.fill", action: .goToLanding),
        BreadcrumbItem(title: "Quick Record", icon: "mic.fill", action: .custom({ @Sendable in }))
    ]
}

#Preview {
    VStack(spacing: 20) {
        BreadcrumbNavigation(
            items: [
                BreadcrumbItem(title: "Home", icon: "house.fill", action: .goToLanding),
                BreadcrumbItem(title: "Meetings", icon: "calendar.badge.plus", action: .goToTab(0))
            ]
        ) { item in
            print("Tapped: \(item.title)")
        }
        
        BreadcrumbNavigation(
            items: [
                BreadcrumbItem(title: "Home", icon: "house.fill", action: .goToLanding),
                BreadcrumbItem(title: "Quick Record", icon: "mic.fill", action: .custom({}))
            ]
        ) { item in
            print("Tapped: \(item.title)")
        }
    }
    .padding()
}
