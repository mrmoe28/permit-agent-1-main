import Foundation

struct TemplateMetadata: Codable {
    let displayName: String
    let description: String
    let category: TemplateCategory
    let features: [String]
    let technologies: [String]
    let icon: String
}

enum TemplateCategory: String, Codable, CaseIterable {
    case full = "full"
    case blank = "blank"
    
    var displayName: String {
        switch self {
        case .full:
            return "Full Featured"
        case .blank:
            return "Blank Starter"
        }
    }
}

struct EnhancedTemplate: Identifiable, Hashable {
    let id: String
    let template: Template
    let metadata: TemplateMetadata
    
    var displayName: String { metadata.displayName }
    var description: String { metadata.description }
    var category: TemplateCategory { metadata.category }
    var features: [String] { metadata.features }
    var technologies: [String] { metadata.technologies }
    var icon: String { metadata.icon }
    
    static func == (lhs: EnhancedTemplate, rhs: EnhancedTemplate) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

class TemplateMetadataService {
    static let shared = TemplateMetadataService()
    private var metadata: [String: TemplateMetadata] = [:]
    
    private init() {
        loadMetadata()
    }
    
    private func loadMetadata() {
        guard let url = Bundle.main.url(forResource: "template-metadata", withExtension: "json") else {
            print("Could not find template-metadata.json")
            return
        }
        
        do {
            let data = try Data(contentsOf: url)
            metadata = try JSONDecoder().decode([String: TemplateMetadata].self, from: data)
        } catch {
            print("Error loading template metadata: \(error)")
        }
    }
    
    func getMetadata(for templateName: String) -> TemplateMetadata? {
        return metadata[templateName]
    }
    
    func enhanceTemplate(_ template: Template) -> EnhancedTemplate? {
        guard let metadata = getMetadata(for: template.name) else {
            return nil
        }
        return EnhancedTemplate(id: template.id, template: template, metadata: metadata)
    }
}