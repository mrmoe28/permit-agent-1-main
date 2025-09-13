import Foundation

struct Template: Codable, Identifiable, Hashable {
    var id: String { name }
    let name: String
    let directories: [String]
    let files: [String]
    
    // GitHub template support
    let githubRepository: String?
    let githubBranch: String?
    let isGitHubTemplate: Bool
    
    // Template variables support
    let variables: [TemplateVariable]?
    
    // Custom initializer for backward compatibility
    init(name: String, directories: [String], files: [String], githubRepository: String? = nil, githubBranch: String? = nil, variables: [TemplateVariable]? = nil) {
        self.name = name
        self.directories = directories
        self.files = files
        self.githubRepository = githubRepository
        self.githubBranch = githubBranch ?? "main"
        self.isGitHubTemplate = githubRepository != nil
        self.variables = variables
    }
    
    // Custom Codable implementation for backward compatibility
    enum CodingKeys: String, CodingKey {
        case name, directories, files, githubRepository, githubBranch, isGitHubTemplate, variables
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        directories = try container.decode([String].self, forKey: .directories)
        files = try container.decode([String].self, forKey: .files)
        githubRepository = try container.decodeIfPresent(String.self, forKey: .githubRepository)
        githubBranch = try container.decodeIfPresent(String.self, forKey: .githubBranch) ?? "main"
        isGitHubTemplate = githubRepository != nil
        variables = try container.decodeIfPresent([TemplateVariable].self, forKey: .variables)
    }
}

struct TemplateConfig: Codable {
    let templates: [String: Template]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        // First try to decode as new format with Template objects
        if let templatesDict = try? container.decode([String: Template].self) {
            self.templates = templatesDict
        } else {
            // Fall back to legacy format for backward compatibility
            let dict = try container.decode([String: LegacyTemplateData].self)
            
            var templates: [String: Template] = [:]
            for (key, value) in dict {
                templates[key] = Template(
                    name: key,
                    directories: value.directories,
                    files: value.files,
                    githubRepository: value.githubRepository,
                    githubBranch: value.githubBranch,
                    variables: value.variables
                )
            }
            self.templates = templates
        }
    }
}

// Helper struct for decoding legacy template format
private struct LegacyTemplateData: Codable {
    let directories: [String]
    let files: [String]
    let githubRepository: String?
    let githubBranch: String?
    let variables: [TemplateVariable]?
}

struct ProjectConfiguration {
    let template: Template
    let projectName: String
    let location: URL
    
    // GitHub options
    let createGitHubRepository: Bool
    let isPrivateRepository: Bool
    let gitignoreTemplate: String?
    let licenseTemplate: String?
    
    // Vercel options
    let deployToVercel: Bool
    let vercelProjectName: String?
    let vercelIsProduction: Bool
    let vercelEnvironmentVariables: [String: String]
    
    // Template variables
    let templateVariables: [String: String]
    
    init(template: Template, projectName: String, location: URL, 
         createGitHubRepository: Bool = false, isPrivateRepository: Bool = false,
         gitignoreTemplate: String? = nil, licenseTemplate: String? = nil,
         deployToVercel: Bool = false, vercelProjectName: String? = nil,
         vercelIsProduction: Bool = false, vercelEnvironmentVariables: [String: String] = [:],
         templateVariables: [String: String] = [:]) {
        self.template = template
        self.projectName = projectName
        self.location = location
        self.createGitHubRepository = createGitHubRepository
        self.isPrivateRepository = isPrivateRepository
        self.gitignoreTemplate = gitignoreTemplate
        self.licenseTemplate = licenseTemplate
        self.deployToVercel = deployToVercel
        self.vercelProjectName = vercelProjectName ?? projectName
        self.vercelIsProduction = vercelIsProduction
        self.vercelEnvironmentVariables = vercelEnvironmentVariables
        self.templateVariables = templateVariables
    }
}

// MARK: - Template Variable Support

struct TemplateVariable: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let type: VariableType
    let defaultValue: String?
    let required: Bool
    let placeholder: String?
    let options: [String]? // For choice type
    
    enum VariableType: String, Codable {
        case string
        case boolean
        case choice
        case number
    }
}

// Variable values collected from user
struct TemplateVariableValue: Identifiable, Equatable {
    let id: String
    let variable: TemplateVariable
    var value: String
}