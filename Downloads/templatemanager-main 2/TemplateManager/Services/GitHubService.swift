import Foundation

// MARK: - GitHub API Models
struct GitHubRepository: Codable {
    let id: Int
    let name: String
    let fullName: String
    let description: String?
    let `private`: Bool
    let htmlUrl: String
    let cloneUrl: String
    let sshUrl: String
    let defaultBranch: String
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, `private`
        case fullName = "full_name"
        case htmlUrl = "html_url"
        case cloneUrl = "clone_url"
        case sshUrl = "ssh_url"
        case defaultBranch = "default_branch"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct GitHubUser: Codable {
    let login: String
    let id: Int
    let name: String?
    let email: String?
    let avatarUrl: String
    
    enum CodingKeys: String, CodingKey {
        case login, id, name, email
        case avatarUrl = "avatar_url"
    }
}

struct CreateRepositoryRequest: Codable {
    let name: String
    let description: String?
    let `private`: Bool
    let autoInit: Bool
    let gitignoreTemplate: String?
    let licenseTemplate: String?
    
    enum CodingKeys: String, CodingKey {
        case name, description, `private`
        case autoInit = "auto_init"
        case gitignoreTemplate = "gitignore_template"
        case licenseTemplate = "license_template"
    }
}

// MARK: - GitHub API Error
enum GitHubError: LocalizedError {
    case invalidToken
    case networkError(String)
    case apiError(statusCode: Int, message: String)
    case decodingError(String)
    case repositoryAlreadyExists
    case unauthorized
    case rateLimitExceeded
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidToken:
            return "Invalid GitHub token. Please check your settings."
        case .networkError(let message):
            return "Network error: \(message)"
        case .apiError(let statusCode, let message):
            return "GitHub API error (\(statusCode)): \(message)"
        case .decodingError(let message):
            return "Failed to decode response: \(message)"
        case .repositoryAlreadyExists:
            return "A repository with this name already exists."
        case .unauthorized:
            return "Unauthorized. Please check your GitHub token."
        case .rateLimitExceeded:
            return "GitHub API rate limit exceeded. Please try again later."
        case .unknown:
            return "An unknown error occurred."
        }
    }
}

// MARK: - GitHub Service
class GitHubService: ObservableObject {
    static let shared = GitHubService()
    
    private let baseURL = "https://api.github.com"
    private let session: URLSession
    
    @Published var isAuthenticated = false
    @Published var currentUser: GitHubUser?
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: configuration)
        
        // Check if we have a stored token
        if getStoredToken() != nil {
            validateToken()
        }
    }
    
    // MARK: - Token Management
    private func getStoredToken() -> String? {
        return KeychainService.shared.getGitHubToken()
    }
    
    private func storeToken(_ token: String) {
        do {
            try KeychainService.shared.saveGitHubToken(token)
            isAuthenticated = true
        } catch {
            print("Failed to store GitHub token: \(error)")
        }
    }
    
    func setAccessToken(_ token: String) async throws {
        // Validate the token first
        let request = createRequest(endpoint: "/user", method: "GET", token: token)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    let user = try JSONDecoder().decode(GitHubUser.self, from: data)
                    currentUser = user
                    storeToken(token)
                    isAuthenticated = true
                case 401:
                    throw GitHubError.unauthorized
                default:
                    throw GitHubError.apiError(statusCode: httpResponse.statusCode, message: "Failed to validate token")
                }
            }
        } catch {
            isAuthenticated = false
            currentUser = nil
            throw error
        }
    }
    
    func removeAccessToken() {
        do {
            try KeychainService.shared.deleteGitHubToken()
        } catch {
            print("Failed to remove GitHub token: \(error)")
        }
        isAuthenticated = false
        currentUser = nil
    }
    
    // MARK: - API Helpers
    private func createRequest(endpoint: String, method: String, token: String? = nil, body: Data? = nil) -> URLRequest {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue("2022-11-28", forHTTPHeaderField: "X-GitHub-Api-Version")
        
        if let token = token ?? getStoredToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        return request
    }
    
    private func handleResponse<T: Decodable>(_ data: Data, _ response: URLResponse?, type: T.Type) throws -> T {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GitHubError.unknown
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try JSONDecoder().decode(T.self, from: data)
            } catch {
                throw GitHubError.decodingError(error.localizedDescription)
            }
        case 401:
            throw GitHubError.unauthorized
        case 403:
            if let rateLimitRemaining = httpResponse.value(forHTTPHeaderField: "X-RateLimit-Remaining"),
               rateLimitRemaining == "0" {
                throw GitHubError.rateLimitExceeded
            }
            throw GitHubError.unauthorized
        case 422:
            throw GitHubError.repositoryAlreadyExists
        default:
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw GitHubError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
    }
    
    // MARK: - Public API Methods
    func validateToken() {
        Task {
            do {
                let request = createRequest(endpoint: "/user", method: "GET")
                let (data, response) = try await session.data(for: request)
                let user = try handleResponse(data, response, type: GitHubUser.self)
                
                await MainActor.run {
                    self.currentUser = user
                    self.isAuthenticated = true
                }
            } catch {
                await MainActor.run {
                    self.isAuthenticated = false
                    self.currentUser = nil
                }
            }
        }
    }
    
    func createRepository(name: String, description: String?, isPrivate: Bool, includeGitignore: String? = nil, includeLicense: String? = nil) async throws -> GitHubRepository {
        let createRepoRequest = CreateRepositoryRequest(
            name: name,
            description: description,
            private: isPrivate,
            autoInit: true,
            gitignoreTemplate: includeGitignore,
            licenseTemplate: includeLicense
        )
        
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let body = try encoder.encode(createRepoRequest)
        
        let request = createRequest(endpoint: "/user/repos", method: "POST", body: body)
        let (data, response) = try await session.data(for: request)
        
        return try handleResponse(data, response, type: GitHubRepository.self)
    }
    
    func getRepository(owner: String, name: String) async throws -> GitHubRepository {
        let request = createRequest(endpoint: "/repos/\(owner)/\(name)", method: "GET")
        let (data, response) = try await session.data(for: request)
        
        return try handleResponse(data, response, type: GitHubRepository.self)
    }
    
    func listUserRepositories() async throws -> [GitHubRepository] {
        let request = createRequest(endpoint: "/user/repos", method: "GET")
        let (data, response) = try await session.data(for: request)
        
        return try handleResponse(data, response, type: [GitHubRepository].self)
    }
    
    func deleteRepository(owner: String, name: String) async throws {
        let request = createRequest(endpoint: "/repos/\(owner)/\(name)", method: "DELETE")
        let (_, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 204 else {
            throw GitHubError.unknown
        }
    }
    
    // MARK: - Git Operations
    func initializeGitRepository(at path: String) async throws {
        let process = Process()
        process.currentDirectoryURL = URL(fileURLWithPath: path)
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = ["init"]
        
        try process.run()
        process.waitUntilExit()
        
        guard process.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to initialize git repository")
        }
    }
    
    func addRemoteOrigin(at path: String, remoteURL: String) async throws {
        let process = Process()
        process.currentDirectoryURL = URL(fileURLWithPath: path)
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = ["remote", "add", "origin", remoteURL]
        
        try process.run()
        process.waitUntilExit()
        
        guard process.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to add remote origin")
        }
    }
    
    func createInitialCommit(at path: String) async throws {
        // Add all files
        let addProcess = Process()
        addProcess.currentDirectoryURL = URL(fileURLWithPath: path)
        addProcess.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        addProcess.arguments = ["add", "."]
        
        try addProcess.run()
        addProcess.waitUntilExit()
        
        guard addProcess.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to add files to git")
        }
        
        // Create commit
        let commitProcess = Process()
        commitProcess.currentDirectoryURL = URL(fileURLWithPath: path)
        commitProcess.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        commitProcess.arguments = ["commit", "-m", "Initial commit"]
        
        try commitProcess.run()
        commitProcess.waitUntilExit()
        
        guard commitProcess.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to create initial commit")
        }
    }
    
    func pushToRemote(at path: String, branch: String = "main") async throws {
        let process = Process()
        process.currentDirectoryURL = URL(fileURLWithPath: path)
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = ["push", "-u", "origin", branch]
        
        try process.run()
        process.waitUntilExit()
        
        guard process.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to push to remote repository")
        }
    }
    
    func cloneRepository(url: String, to path: String) async throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = ["clone", url, path]
        
        try process.run()
        process.waitUntilExit()
        
        guard process.terminationStatus == 0 else {
            throw GitHubError.networkError("Failed to clone repository")
        }
    }
}