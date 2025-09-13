import Foundation

class TemplateService: ObservableObject {
    @Published var templates: [Template] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let configPath: String
    
    init() {
        // Get the path to template-config.json from resources
        if let resourcePath = Bundle.main.path(forResource: "template-config", ofType: "json") {
            self.configPath = resourcePath
        } else if let bundlePath = Bundle.main.resourcePath {
            self.configPath = (bundlePath as NSString).appendingPathComponent("template-config.json")
        } else {
            self.configPath = FileManager.default.homeDirectoryForCurrentUser.path + "/Desktop/template-manager/template-config.json"
        }
        loadTemplates()
    }
    
    func loadTemplates() {
        isLoading = true
        errorMessage = nil
        
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: configPath))
            let decoder = JSONDecoder()
            let config = try decoder.decode(TemplateConfig.self, from: data)
            
            self.templates = Array(config.templates.values).sorted { $0.name < $1.name }
            isLoading = false
        } catch {
            errorMessage = "Failed to load templates: \(error.localizedDescription)"
            isLoading = false
            
            // Try to load from a default location
            loadDefaultTemplates()
        }
    }
    
    private func loadDefaultTemplates() {
        // Fallback templates if config file is not found
        templates = [
            Template(name: "blog", 
                    directories: ["components/blog", "content/posts", "pages/api/posts"],
                    files: ["components/blog/PostCard.jsx", "content/posts/example.md"]),
            Template(name: "ecommerce",
                    directories: ["components/product", "components/cart", "pages/api/products"],
                    files: ["components/product/ProductCard.jsx", "components/cart/CartItem.jsx"]),
            Template(name: "nextjs-google-auth",
                    directories: ["app/(auth)/login", "app/(protected)/dashboard", "lib/auth"],
                    files: ["app/layout.tsx", "app/page.tsx", "middleware.ts"])
        ]
    }
}