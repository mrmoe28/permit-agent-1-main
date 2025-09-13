import Foundation
import SwiftUI

// MARK: - Project Model
struct Project: Codable, Identifiable {
    let id: UUID
    let name: String
    let path: String
    let templateName: String
    let templateIcon: String
    let createdDate: Date
    var lastOpenedDate: Date
    var githubURL: String?
    var vercelURL: String?
    var isFavorite: Bool = false
    
    var exists: Bool {
        FileManager.default.fileExists(atPath: path)
    }
    
    var url: URL {
        URL(fileURLWithPath: path)
    }
}

// MARK: - Project History Service
class ProjectHistoryService: ObservableObject {
    static let shared = ProjectHistoryService()
    
    @Published var projects: [Project] = []
    @Published var isLoading = false
    
    private let storageKey = "com.templatemanager.projectHistory"
    private let maxProjects = 50
    
    private init() {
        loadProjects()
    }
    
    // MARK: - Public Methods
    
    func addProject(name: String, path: String, templateName: String, templateIcon: String, githubURL: String? = nil, vercelURL: String? = nil) {
        let project = Project(
            id: UUID(),
            name: name,
            path: path,
            templateName: templateName,
            templateIcon: templateIcon,
            createdDate: Date(),
            lastOpenedDate: Date(),
            githubURL: githubURL,
            vercelURL: vercelURL
        )
        
        // Remove existing project with same path if it exists
        projects.removeAll { $0.path == path }
        
        // Add new project at the beginning
        projects.insert(project, at: 0)
        
        // Limit the number of stored projects
        if projects.count > maxProjects {
            projects = Array(projects.prefix(maxProjects))
        }
        
        saveProjects()
    }
    
    func updateLastOpened(for projectId: UUID) {
        if let index = projects.firstIndex(where: { $0.id == projectId }) {
            projects[index].lastOpenedDate = Date()
            saveProjects()
        }
    }
    
    func toggleFavorite(for projectId: UUID) {
        if let index = projects.firstIndex(where: { $0.id == projectId }) {
            projects[index].isFavorite.toggle()
            saveProjects()
        }
    }
    
    func removeProject(_ project: Project) {
        projects.removeAll { $0.id == project.id }
        saveProjects()
    }
    
    func cleanupNonExistentProjects() {
        let existingProjects = projects.filter { $0.exists }
        if existingProjects.count != projects.count {
            projects = existingProjects
            saveProjects()
        }
    }
    
    func sortProjects(by sortOption: SortOption) {
        switch sortOption {
        case .recentlyOpened:
            projects.sort { $0.lastOpenedDate > $1.lastOpenedDate }
        case .recentlyCreated:
            projects.sort { $0.createdDate > $1.createdDate }
        case .name:
            projects.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        case .template:
            projects.sort { $0.templateName.localizedCaseInsensitiveCompare($1.templateName) == .orderedAscending }
        }
    }
    
    func filteredProjects(searchText: String, showOnlyFavorites: Bool) -> [Project] {
        var filtered = projects
        
        if showOnlyFavorites {
            filtered = filtered.filter { $0.isFavorite }
        }
        
        if !searchText.isEmpty {
            filtered = filtered.filter { project in
                project.name.localizedCaseInsensitiveContains(searchText) ||
                project.templateName.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return filtered
    }
    
    // MARK: - Private Methods
    
    private func loadProjects() {
        isLoading = true
        
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let decodedProjects = try? JSONDecoder().decode([Project].self, from: data) {
            self.projects = decodedProjects
        }
        
        // Clean up non-existent projects on load
        cleanupNonExistentProjects()
        
        isLoading = false
    }
    
    private func saveProjects() {
        if let encoded = try? JSONEncoder().encode(projects) {
            UserDefaults.standard.set(encoded, forKey: storageKey)
        }
    }
    
    // MARK: - Utility Methods
    
    func openInEditor(_ project: Project, editor: Editor) async throws {
        // Update last opened date
        updateLastOpened(for: project.id)
        
        // Open in the specified editor
        try await ShellExecutor.openInEditor(projectPath: project.path, editor: editor)
    }
    
    func openInFinder(_ project: Project) {
        // Update last opened date
        updateLastOpened(for: project.id)
        
        // Open in Finder
        NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: project.path)
    }
    
    func openTerminal(at project: Project) async throws {
        // Update last opened date
        updateLastOpened(for: project.id)
        
        // Open Terminal at project location
        let script = """
        tell application "Terminal"
            activate
            do script "cd \"\(project.path)\""
        end tell
        """
        
        if let appleScript = NSAppleScript(source: script) {
            var error: NSDictionary?
            appleScript.executeAndReturnError(&error)
            
            if let error = error {
                throw NSError(domain: "ProjectHistoryService", code: 1, 
                            userInfo: [NSLocalizedDescriptionKey: "Failed to open Terminal: \(error)"])
            }
        }
    }
    
    func getGitStatus(for project: Project) async -> String? {
        do {
            let result = try await ShellExecutor.execute(
                script: "cd \"\(project.path)\" && git status --porcelain"
            )
            return result.output.isEmpty ? "Clean" : "Changes"
        } catch {
            return nil
        }
    }
}

// MARK: - Supporting Types

enum SortOption: String, CaseIterable {
    case recentlyOpened = "Recently Opened"
    case recentlyCreated = "Recently Created"
    case name = "Name"
    case template = "Template"
}