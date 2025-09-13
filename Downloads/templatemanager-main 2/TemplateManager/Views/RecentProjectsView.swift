import SwiftUI

struct RecentProjectsView: View {
    @StateObject private var projectHistory = ProjectHistoryService.shared
    @State private var searchText = ""
    @State private var sortOption: SortOption = .recentlyOpened
    @State private var showOnlyFavorites = false
    @State private var selectedProject: Project?
    @State private var showingDeleteConfirmation = false
    @State private var projectToDelete: Project?
    @State private var availableEditors: [Editor] = []
    
    private let columns = [
        GridItem(.adaptive(minimum: 280, maximum: 350), spacing: 20)
    ]
    
    var filteredProjects: [Project] {
        projectHistory.filteredProjects(searchText: searchText, showOnlyFavorites: showOnlyFavorites)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search and Filter Bar
            HStack(spacing: 15) {
                // Search field
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search projects...", text: $searchText)
                        .textFieldStyle(.plain)
                }
                .padding(8)
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(8)
                
                // Sort options
                Picker("Sort by", selection: $sortOption) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.menu)
                .onChange(of: sortOption) { newValue in
                    projectHistory.sortProjects(by: newValue)
                }
                
                // Favorites toggle
                Toggle(isOn: $showOnlyFavorites) {
                    Label("Favorites", systemImage: showOnlyFavorites ? "star.fill" : "star")
                }
                .toggleStyle(.button)
                
                // Refresh button
                Button(action: {
                    projectHistory.cleanupNonExistentProjects()
                }) {
                    Image(systemName: "arrow.clockwise")
                }
                .help("Refresh and clean up deleted projects")
            }
            .padding()
            
            Divider()
            
            // Projects Grid
            if projectHistory.isLoading {
                ProgressView("Loading projects...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredProjects.isEmpty {
                emptyStateView
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 20) {
                        ForEach(filteredProjects) { project in
                            ProjectCard(
                                project: project,
                                availableEditors: availableEditors,
                                onOpen: { editor in
                                    Task {
                                        try await projectHistory.openInEditor(project, editor: editor)
                                    }
                                },
                                onOpenInFinder: {
                                    projectHistory.openInFinder(project)
                                },
                                onToggleFavorite: {
                                    projectHistory.toggleFavorite(for: project.id)
                                },
                                onDelete: {
                                    projectToDelete = project
                                    showingDeleteConfirmation = true
                                }
                            )
                        }
                    }
                    .padding()
                }
            }
        }
        .onAppear {
            checkAvailableEditors()
        }
        .alert("Remove Project", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Remove", role: .destructive) {
                if let project = projectToDelete {
                    projectHistory.removeProject(project)
                }
            }
        } message: {
            Text("Remove this project from recent projects? The project files will not be deleted.")
        }
    }
    
    var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "folder.badge.questionmark")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text(searchText.isEmpty && !showOnlyFavorites ? "No Recent Projects" : "No Projects Found")
                .font(.title2)
                .fontWeight(.medium)
            
            Text(searchText.isEmpty && !showOnlyFavorites ? 
                 "Projects you create will appear here" : 
                 "Try adjusting your search or filters")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(50)
    }
    
    func checkAvailableEditors() {
        availableEditors = Editor.allCases.filter { editor in
            ShellExecutor.checkEditorInstalled(editor: editor)
        }
    }
}

// MARK: - Project Card Component

struct ProjectCard: View {
    let project: Project
    let availableEditors: [Editor]
    let onOpen: (Editor) -> Void
    let onOpenInFinder: () -> Void
    let onToggleFavorite: () -> Void
    let onDelete: () -> Void
    
    @State private var isHovering = false
    @State private var gitStatus: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: project.templateIcon)
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(project.name)
                        .font(.headline)
                        .lineLimit(1)
                    
                    Text(project.templateName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: onToggleFavorite) {
                    Image(systemName: project.isFavorite ? "star.fill" : "star")
                        .foregroundColor(project.isFavorite ? .yellow : .secondary)
                }
                .buttonStyle(.plain)
            }
            
            Divider()
            
            // Project Info
            VStack(alignment: .leading, spacing: 6) {
                Label {
                    Text(RelativeDateTimeFormatter().localizedString(for: project.createdDate, relativeTo: Date()))
                        .font(.caption)
                } icon: {
                    Image(systemName: "calendar")
                        .font(.caption)
                }
                
                Label {
                    Text("Opened \(RelativeDateTimeFormatter().localizedString(for: project.lastOpenedDate, relativeTo: Date()))")
                        .font(.caption)
                } icon: {
                    Image(systemName: "clock")
                        .font(.caption)
                }
                
                if let status = gitStatus {
                    Label {
                        Text(status)
                            .font(.caption)
                            .foregroundColor(status == "Clean" ? .green : .orange)
                    } icon: {
                        Image(systemName: "arrow.triangle.branch")
                            .font(.caption)
                    }
                }
            }
            .foregroundColor(.secondary)
            
            // External Links
            if project.githubURL != nil || project.vercelURL != nil {
                HStack(spacing: 10) {
                    if let githubURL = project.githubURL {
                        Link(destination: URL(string: githubURL)!) {
                            Label("GitHub", systemImage: "link")
                                .font(.caption)
                        }
                        .buttonStyle(.link)
                    }
                    
                    if let vercelURL = project.vercelURL {
                        Link(destination: URL(string: vercelURL)!) {
                            Label("Vercel", systemImage: "triangle.fill")
                                .font(.caption)
                        }
                        .buttonStyle(.link)
                    }
                }
            }
            
            Divider()
            
            // Action Buttons
            HStack(spacing: 8) {
                if let preferredEditor = availableEditors.first {
                    Button(action: { onOpen(preferredEditor) }) {
                        Label("Open", systemImage: editorIcon(for: preferredEditor))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
                
                Menu {
                    ForEach(availableEditors, id: \.self) { editor in
                        Button(action: { onOpen(editor) }) {
                            Label("Open in \(editor.rawValue)", systemImage: editorIcon(for: editor))
                        }
                    }
                    
                    Divider()
                    
                    Button(action: onOpenInFinder) {
                        Label("Open in Finder", systemImage: "folder")
                    }
                    
                    Button(action: openTerminal) {
                        Label("Open Terminal", systemImage: "terminal")
                    }
                    
                    Divider()
                    
                    Button(action: onDelete) {
                        Label("Remove from Recent", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .frame(width: 30)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(NSColor.controlBackgroundColor))
                .shadow(color: .black.opacity(isHovering ? 0.15 : 0.05), radius: isHovering ? 8 : 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(project.exists ? Color.clear : Color.red.opacity(0.5), lineWidth: 2)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
        .onAppear {
            checkGitStatus()
        }
    }
    
    func openTerminal() {
        Task {
            try await ProjectHistoryService.shared.openTerminal(at: project)
        }
    }
    
    func checkGitStatus() {
        Task {
            gitStatus = await ProjectHistoryService.shared.getGitStatus(for: project)
        }
    }
    
    func editorIcon(for editor: Editor) -> String {
        switch editor {
        case .vscode:
            return "chevron.left.forwardslash.chevron.right"
        case .cursor:
            return "cursorarrow"
        case .claude:
            return "brain"
        }
    }
}