import Foundation

class ProjectCreator {
    
    static func createProject(configuration: ProjectConfiguration) async throws {
        let template = configuration.template
        let projectPath = configuration.location.appendingPathComponent(configuration.projectName).path
        let fileManager = FileManager.default
        
        // If this is a GitHub template, clone it
        if template.isGitHubTemplate {
            try await createGitHubTemplate(configuration: configuration, at: projectPath)
        } else {
            // Create project root directory
            try fileManager.createDirectory(atPath: projectPath, withIntermediateDirectories: true)
            
            // Create directories
            for directory in template.directories {
                let fullPath = (projectPath as NSString).appendingPathComponent(directory)
                try fileManager.createDirectory(atPath: fullPath, withIntermediateDirectories: true)
            }
            
            // Create files with content
            for file in template.files {
                let fullPath = (projectPath as NSString).appendingPathComponent(file)
                var content = getFileContent(for: file, template: template.name)
                
                // Apply template variable replacements
                if !configuration.templateVariables.isEmpty {
                    content = applyTemplateVariables(content: content, variables: configuration.templateVariables)
                }
                
                // Replace standard placeholders
                content = content.replacingOccurrences(of: "{{PROJECT_NAME}}", with: configuration.projectName)
                content = content.replacingOccurrences(of: "{{PROJECT_NAME_KEBAB}}", with: configuration.projectName.kebabCased())
                content = content.replacingOccurrences(of: "{{PROJECT_NAME_PASCAL}}", with: configuration.projectName.pascalCased())
                
                // Ensure parent directory exists
                let parentDir = (fullPath as NSString).deletingLastPathComponent
                try fileManager.createDirectory(atPath: parentDir, withIntermediateDirectories: true)
                
                // Write file content
                try content.write(toFile: fullPath, atomically: true, encoding: .utf8)
            }
            
            // Apply knowledge-based fixes if available
            // TODO: Fix KnowledgeService compilation errors
            // let projectURL = URL(fileURLWithPath: projectPath)
            // KnowledgeService.shared.applyFixes(for: template.id, to: projectURL)
            
            // Create special files based on template
            try createSpecialFiles(for: template, at: projectPath)
        }
        
        // Create GitHub repository if requested
        if configuration.createGitHubRepository && GitHubService.shared.isAuthenticated {
            try await createGitHubRepository(for: configuration, at: projectPath)
        }
    }
    
    static func createProject(template: Template, at projectPath: String) throws {
        // Legacy method for backward compatibility
        let projectName = (projectPath as NSString).lastPathComponent
        let location = URL(fileURLWithPath: (projectPath as NSString).deletingLastPathComponent)
        let configuration = ProjectConfiguration(
            template: template,
            projectName: projectName,
            location: location
        )
        
        // Run async method synchronously using a Result type for thread safety
        let semaphore = DispatchSemaphore(value: 0)
        var result: Result<Void, Error>?
        
        Task {
            do {
                try await createProject(configuration: configuration)
                result = .success(())
            } catch {
                result = .failure(error)
            }
            semaphore.signal()
        }
        
        semaphore.wait()
        switch result {
        case .failure(let error):
            throw error
        case .success, .none:
            break
        }
    }
    
    private static func createGitHubTemplate(configuration: ProjectConfiguration, at projectPath: String) async throws {
        guard let githubRepo = configuration.template.githubRepository else {
            throw NSError(domain: "TemplateManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "GitHub repository not specified for template"])
        }
        
        let cloneURL = "https://github.com/\(githubRepo).git"
        try await GitHubService.shared.cloneRepository(url: cloneURL, to: projectPath)
        
        // If a specific branch is specified and it's not the default, checkout that branch
        if let branch = configuration.template.githubBranch, branch != "main" && branch != "master" {
            let process = Process()
            process.currentDirectoryURL = URL(fileURLWithPath: projectPath)
            process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
            process.arguments = ["checkout", branch]
            
            try process.run()
            process.waitUntilExit()
        }
        
        // Remove .git directory to start fresh
        let gitPath = (projectPath as NSString).appendingPathComponent(".git")
        try? FileManager.default.removeItem(atPath: gitPath)
    }
    
    private static func createGitHubRepository(for configuration: ProjectConfiguration, at projectPath: String) async throws {
        let githubService = GitHubService.shared
        
        // Create repository on GitHub
        let repository = try await githubService.createRepository(
            name: configuration.projectName,
            description: "Created with Template Manager - \(configuration.template.name) template",
            isPrivate: configuration.isPrivateRepository,
            includeGitignore: configuration.gitignoreTemplate,
            includeLicense: configuration.licenseTemplate
        )
        
        // Initialize git repository locally
        try await githubService.initializeGitRepository(at: projectPath)
        
        // Add remote origin
        try await githubService.addRemoteOrigin(at: projectPath, remoteURL: repository.cloneUrl)
        
        // Create initial commit
        try await githubService.createInitialCommit(at: projectPath)
        
        // Push to remote
        try await githubService.pushToRemote(at: projectPath, branch: repository.defaultBranch)
    }
    
    private static func getFileContent(for file: String, template: String) -> String {
        let filename = (file as NSString).lastPathComponent
        let ext = (filename as NSString).pathExtension
        
        switch ext {
        case "jsx":
            return getJSXContent(for: filename, template: template)
        case "tsx":
            return getTSXContent(for: filename, template: template)
        case "js":
            return getJSContent(for: filename, template: template)
        case "ts":
            return getTSContent(for: filename, template: template)
        case "md":
            return getMarkdownContent(for: filename)
        case "json":
            return getJSONContent(for: filename, template: template)
        case "yml", "yaml":
            return getYAMLContent(for: filename, template: template)
        default:
            // Handle special files by name
            switch filename {
            case "seed.ts":
                return getSeedContent()
            case ".env.example":
                return getEnvExampleContent()
            default:
                return "// \(filename)\n"
            }
        }
    }
    
    private static func getJSXContent(for filename: String, template: String) -> String {
        // Handle blank templates with minimal content
        if template.contains("-blank") {
            return getBlankJSXContent(for: filename, template: template)
        }
        
        switch filename {
        case "Dashboard.jsx":
            return """
            import React, { useState, useEffect } from 'react';
            import { productsAPI, ordersAPI, usersAPI } from '../services/api';
            
            const Dashboard = () => {
              const [stats, setStats] = useState({
                totalProducts: 0,
                totalOrders: 0,
                totalUsers: 0,
                recentOrders: []
              });
              const [loading, setLoading] = useState(true);
              
              useEffect(() => {
                fetchDashboardData();
              }, []);
              
              const fetchDashboardData = async () => {
                try {
                  const [products, orders, users] = await Promise.all([
                    productsAPI.getAll(),
                    ordersAPI.getMyOrders(),
                    usersAPI.getAll()
                  ]);
                  
                  setStats({
                    totalProducts: products.data.length,
                    totalOrders: orders.data.length,
                    totalUsers: users.data.length,
                    recentOrders: orders.data.slice(0, 5)
                  });
                } catch (error) {
                  console.error('Failed to fetch dashboard data:', error);
                } finally {
                  setLoading(false);
                }
              };
              
              if (loading) return <div>Loading...</div>;
              
              return (
                <div className="dashboard">
                  <h1>Dashboard</h1>
                  
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total Products</h3>
                      <p className="stat-number">{stats.totalProducts}</p>
                    </div>
                    
                    <div className="stat-card">
                      <h3>Total Orders</h3>
                      <p className="stat-number">{stats.totalOrders}</p>
                    </div>
                    
                    <div className="stat-card">
                      <h3>Total Users</h3>
                      <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                  </div>
                  
                  <div className="recent-orders">
                    <h2>Recent Orders</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>${order.total.toFixed(2)}</td>
                            <td>{order.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            };
            
            export default Dashboard;
            """
            
        case "UserList.jsx":
            return """
            import React, { useState, useEffect } from 'react';
            import { usersAPI } from '../services/api';
            
            const UserList = () => {
              const [users, setUsers] = useState([]);
              const [loading, setLoading] = useState(true);
              
              useEffect(() => {
                fetchUsers();
              }, []);
              
              const fetchUsers = async () => {
                try {
                  const response = await usersAPI.getAll();
                  setUsers(response.data);
                } catch (error) {
                  console.error('Failed to fetch users:', error);
                } finally {
                  setLoading(false);
                }
              };
              
              const handleDelete = async (userId) => {
                if (window.confirm('Are you sure you want to delete this user?')) {
                  try {
                    await usersAPI.delete(userId);
                    setUsers(users.filter(u => u.id !== userId));
                  } catch (error) {
                    alert('Failed to delete user');
                  }
                }
              };
              
              if (loading) return <div>Loading users...</div>;
              
              return (
                <div className="user-list">
                  <h2>Users</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button onClick={() => handleDelete(user.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            };
            
            export default UserList;
            """
            
        case "ProductForm.jsx":
            return """
            import React, { useState } from 'react';
            import { productsAPI } from '../services/api';
            
            const ProductForm = ({ product, onSave, onCancel }) => {
              const [formData, setFormData] = useState({
                name: product?.name || '',
                description: product?.description || '',
                price: product?.price || '',
                stock: product?.stock || '',
                category: product?.category || '',
                imageUrl: product?.imageUrl || ''
              });
              const [loading, setLoading] = useState(false);
              
              const handleSubmit = async (e) => {
                e.preventDefault();
                setLoading(true);
                
                try {
                  if (product) {
                    await productsAPI.update(product.id, formData);
                  } else {
                    await productsAPI.create(formData);
                  }
                  onSave();
                } catch (error) {
                  alert('Failed to save product');
                } finally {
                  setLoading(false);
                }
              };
              
              const handleChange = (e) => {
                setFormData({
                  ...formData,
                  [e.target.name]: e.target.value
                });
              };
              
              return (
                <form onSubmit={handleSubmit} className="product-form">
                  <h2>{product ? 'Edit Product' : 'New Product'}</h2>
                  
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={onCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              );
            };
            
            export default ProductForm;
            """
            
        case "ProductCard.jsx":
            return """
            import React from 'react';
            
            const ProductCard = ({ product }) => {
              return (
                <div className="product-card">
                  <img src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p>${product.price}</p>
                  <button>Add to Cart</button>
                </div>
              );
            };
            
            export default ProductCard;
            """
            
        case "CartItem.jsx":
            return """
            import React from 'react';
            
            const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
              return (
                <div className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>${item.price}</p>
                  </div>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                  />
                  <button onClick={() => onRemove(item.id)}>Remove</button>
                </div>
              );
            };
            
            export default CartItem;
            """
            
        case "PostCard.jsx":
            return """
            import React from 'react';
            import Link from 'next/link';
            
            const PostCard = ({ post }) => {
              return (
                <article className="post-card">
                  <Link href={`/posts/${post.slug}`}>
                    <h2>{post.title}</h2>
                  </Link>
                  <time>{new Date(post.date).toLocaleDateString()}</time>
                  <p>{post.excerpt}</p>
                  <Link href={`/posts/${post.slug}`}>Read more →</Link>
                </article>
              );
            };
            
            export default PostCard;
            """
            
        case "MarkdownEditor.jsx":
            return """
            import React, { useState } from 'react';
            
            const MarkdownEditor = ({ initialContent = '', onSave }) => {
              const [content, setContent] = useState(initialContent);
              
              return (
                <div className="markdown-editor">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your markdown here..."
                  />
                  <button onClick={() => onSave(content)}>Save</button>
                </div>
              );
            };
            
            export default MarkdownEditor;
            """
            
        default:
            return """
            import React from 'react';
            
            const Component = () => {
              return <div>New Component</div>;
            };
            
            export default Component;
            """
        }
    }
    
    private static func getBlankJSXContent(for filename: String, template: String) -> String {
        switch filename {
        case "ProductCard.jsx":
            return """
            import React from 'react';
            
            const ProductCard = ({ product }) => {
              return (
                <div className="product-card">
                  <h3>{product.name}</h3>
                  <p className="price">${product.price}</p>
                  <button>View Details</button>
                </div>
              );
            };
            
            export default ProductCard;
            """
            
        case "Layout.jsx":
            return """
            import React from 'react';
            
            const Layout = ({ children }) => {
              return (
                <div className="app-layout">
                  <header>
                    <h1>My App</h1>
                    <nav>
                      <a href="/">Home</a>
                      <a href="/products">Products</a>
                      <a href="/about">About</a>
                    </nav>
                  </header>
                  <main>{children}</main>
                  <footer>
                    <p>&copy; 2025 My App. All rights reserved.</p>
                  </footer>
                </div>
              );
            };
            
            export default Layout;
            """
            
        case "PostCard.jsx":
            return """
            import React from 'react';
            
            const PostCard = ({ post }) => {
              return (
                <article className="post-card">
                  <h2>{post.title}</h2>
                  <p className="meta">By {post.author} on {post.date}</p>
                  <p>{post.excerpt}</p>
                  <a href={`/blog/${post.slug}`}>Read more →</a>
                </article>
              );
            };
            
            export default PostCard;
            """
            
        case "App.jsx":
            return """
            import React from 'react';
            import './App.css';
            
            function App() {
              return (
                <div className="App">
                  <h1>Welcome to My Full-Stack App</h1>
                  <p>Get started by editing this file.</p>
                </div>
              );
            }
            
            export default App;
            """
            
        default:
            return """
            import React from 'react';
            
            const Component = () => {
              return (
                <div>
                  <h2>{filename.replace('.jsx', '')}</h2>
                  <p>Edit this component to get started.</p>
                </div>
              );
            };
            
            export default Component;
            """
        }
    }
    
    private static func getTSXContent(for filename: String, template: String) -> String {
        // Handle blank templates with minimal content
        if template.contains("-blank") {
            return getBlankTSXContent(for: filename, template: template)
        }
        
        switch filename {
        case "layout.tsx":
            return """
            import type { Metadata } from 'next'
            import { Inter } from 'next/font/google'
            import './globals.css'
            import { Providers } from './providers'
            
            const inter = Inter({ subsets: ['latin'] })
            
            export const metadata: Metadata = {
              title: 'Next.js App',
              description: 'Created with Template Manager',
            }
            
            export default function RootLayout({
              children,
            }: {
              children: React.ReactNode
            }) {
              return (
                <html lang="en">
                  <body className={inter.className}>
                    <Providers>{children}</Providers>
                  </body>
                </html>
              )
            }
            """
            
        case "page.tsx":
            if filename.contains("login") {
                return """
                'use client'
                
                import { signIn } from 'next-auth/react'
                
                export default function LoginPage() {
                  return (
                    <div className="flex min-h-screen items-center justify-center">
                      <div className="w-full max-w-md space-y-8">
                        <h2 className="text-center text-3xl font-bold">Sign in to your account</h2>
                        <button
                          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                          Sign in with Google
                        </button>
                      </div>
                    </div>
                  )
                }
                """
            } else if filename.contains("dashboard") {
                return """
                import { getServerSession } from 'next-auth'
                import { authOptions } from '@/lib/auth/auth-options'
                import { redirect } from 'next/navigation'
                
                export default async function DashboardPage() {
                  const session = await getServerSession(authOptions)
                  
                  if (!session) {
                    redirect('/login')
                  }
                  
                  return (
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Welcome, {session.user?.name}!</h1>
                      <p>This is a protected dashboard page.</p>
                    </div>
                  )
                }
                """
            } else {
                return """
                export default function Home() {
                  return (
                    <main className="flex min-h-screen flex-col items-center justify-center p-24">
                      <h1 className="text-4xl font-bold">Welcome to Next.js!</h1>
                      <p className="mt-4 text-xl">Get started by editing this page.</p>
                    </main>
                  )
                }
                """
            }
            
        case "route.ts":
            return """
            import NextAuth from 'next-auth'
            import { authOptions } from '@/lib/auth/auth-options'
            
            const handler = NextAuth(authOptions)
            
            export { handler as GET, handler as POST }
            """
            
        case "LoginButton.tsx":
            return """
            'use client'
            
            import { signIn, signOut, useSession } from 'next-auth/react'
            
            export function LoginButton() {
              const { data: session, status } = useSession()
              
              if (status === 'loading') {
                return <p>Loading...</p>
              }
              
              if (session) {
                return (
                  <>
                    Signed in as {session.user?.email}
                    <button onClick={() => signOut()}>Sign out</button>
                  </>
                )
              }
              
              return <button onClick={() => signIn('google')}>Sign in with Google</button>
            }
            """
            
        case "UserMenu.tsx":
            return """
            'use client'
            
            import { useSession, signOut } from 'next-auth/react'
            import Image from 'next/image'
            
            export function UserMenu() {
              const { data: session } = useSession()
              
              if (!session?.user) return null
              
              return (
                <div className="flex items-center gap-4">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span>{session.user.name}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              )
            }
            """
            
        default:
            return """
            export default function Component() {
              return <div>TypeScript Component</div>
            }
            """
        }
    }
    
    private static func getJSContent(for filename: String, template: String) -> String {
        // Handle blank templates with minimal content
        if template.contains("-blank") {
            return getBlankJSContent(for: filename, template: template)
        }
        
        switch filename {
        case "stripe.js":
            return """
            import Stripe from 'stripe';
            
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
              apiVersion: '2023-10-16',
            });
            
            export async function createPaymentIntent(amount, currency = 'usd') {
              try {
                const paymentIntent = await stripe.paymentIntents.create({
                  amount: amount * 100, // Convert to cents
                  currency,
                });
                return paymentIntent;
              } catch (error) {
                console.error('Stripe error:', error);
                throw error;
              }
            }
            
            export default stripe;
            """
            
        case "[id].js":
            return """
            export default function handler(req, res) {
              const { id } = req.query;
              
              if (req.method === 'GET') {
                // Get product by ID
                res.status(200).json({ id, name: 'Sample Product', price: 99.99 });
              } else if (req.method === 'PUT') {
                // Update product
                res.status(200).json({ message: 'Product updated' });
              } else if (req.method === 'DELETE') {
                // Delete product
                res.status(200).json({ message: 'Product deleted' });
              } else {
                res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
              }
            }
            """
            
        case "index.js":
            return """
            const express = require('express');
            const cors = require('cors');
            const dotenv = require('dotenv');
            const { PrismaClient } = require('@prisma/client');
            
            // Load environment variables
            dotenv.config();
            
            // Import routes
            const userRoutes = require('./routes/users');
            const productRoutes = require('./routes/products');
            const orderRoutes = require('./routes/orders');
            
            // Import middleware
            const errorHandler = require('./middleware/errorHandler');
            
            // Initialize Express app
            const app = express();
            const prisma = new PrismaClient();
            
            // Middleware
            app.use(cors());
            app.use(express.json());
            app.use(express.urlencoded({ extended: true }));
            
            // Make prisma available in req
            app.use((req, res, next) => {
              req.prisma = prisma;
              next();
            });
            
            // Routes
            app.use('/api/users', userRoutes);
            app.use('/api/products', productRoutes);
            app.use('/api/orders', orderRoutes);
            
            // Health check
            app.get('/health', (req, res) => {
              res.json({ status: 'OK', timestamp: new Date().toISOString() });
            });
            
            // Error handling middleware (must be last)
            app.use(errorHandler);
            
            // Start server
            const PORT = process.env.PORT || 5000;
            app.listen(PORT, () => {
              console.log(`Server running on port ${PORT}`);
            });
            
            // Graceful shutdown
            process.on('SIGTERM', async () => {
              await prisma.$disconnect();
              process.exit(0);
            });
            """
            
        case "users.js":
            if filename.contains("routes") {
                return """
                const express = require('express');
                const router = express.Router();
                const userController = require('../controllers/userController');
                const auth = require('../middleware/auth');
                
                // Public routes
                router.post('/register', userController.register);
                router.post('/login', userController.login);
                
                // Protected routes
                router.get('/profile', auth, userController.getProfile);
                router.put('/profile', auth, userController.updateProfile);
                router.get('/', auth, userController.getAllUsers);
                router.get('/:id', auth, userController.getUserById);
                router.delete('/:id', auth, userController.deleteUser);
                
                module.exports = router;
                """
            }
            return "// JavaScript file\\n"
            
        case "products.js":
            if filename.contains("routes") {
                return """
                const express = require('express');
                const router = express.Router();
                const productController = require('../controllers/productController');
                const auth = require('../middleware/auth');
                
                // Public routes
                router.get('/', productController.getAllProducts);
                router.get('/:id', productController.getProductById);
                
                // Protected routes (admin only)
                router.post('/', auth, productController.createProduct);
                router.put('/:id', auth, productController.updateProduct);
                router.delete('/:id', auth, productController.deleteProduct);
                
                module.exports = router;
                """
            }
            return "// JavaScript file\\n"
            
        case "orders.js":
            if filename.contains("routes") {
                return """
                const express = require('express');
                const router = express.Router();
                const orderController = require('../controllers/orderController');
                const auth = require('../middleware/auth');
                
                // All routes are protected
                router.use(auth);
                
                router.get('/', orderController.getUserOrders);
                router.get('/:id', orderController.getOrderById);
                router.post('/', orderController.createOrder);
                router.put('/:id/status', orderController.updateOrderStatus);
                router.delete('/:id', orderController.cancelOrder);
                
                module.exports = router;
                """
            }
            return "// JavaScript file\\n"
            
        case "userController.js":
            return """
            const bcrypt = require('bcryptjs');
            const { generateToken } = require('../utils/jwt');
            
            exports.register = async (req, res, next) => {
              try {
                const { email, password, name } = req.body;
                
                // Check if user exists
                const existingUser = await req.prisma.user.findUnique({
                  where: { email }
                });
                
                if (existingUser) {
                  return res.status(400).json({ error: 'User already exists' });
                }
                
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Create user
                const user = await req.prisma.user.create({
                  data: {
                    email,
                    password: hashedPassword,
                    name
                  }
                });
                
                // Generate token
                const token = generateToken(user.id);
                
                res.status(201).json({
                  user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                  },
                  token
                });
              } catch (error) {
                next(error);
              }
            };
            
            exports.login = async (req, res, next) => {
              try {
                const { email, password } = req.body;
                
                // Find user
                const user = await req.prisma.user.findUnique({
                  where: { email }
                });
                
                if (!user) {
                  return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                // Check password
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                  return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                // Generate token
                const token = generateToken(user.id);
                
                res.json({
                  user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                  },
                  token
                });
              } catch (error) {
                next(error);
              }
            };
            
            exports.getProfile = async (req, res, next) => {
              try {
                const user = await req.prisma.user.findUnique({
                  where: { id: req.userId }
                });
                
                res.json({
                  id: user.id,
                  email: user.email,
                  name: user.name
                });
              } catch (error) {
                next(error);
              }
            };
            
            exports.updateProfile = async (req, res, next) => {
              try {
                const { name } = req.body;
                
                const user = await req.prisma.user.update({
                  where: { id: req.userId },
                  data: { name }
                });
                
                res.json({
                  id: user.id,
                  email: user.email,
                  name: user.name
                });
              } catch (error) {
                next(error);
              }
            };
            
            exports.getAllUsers = async (req, res, next) => {
              try {
                const users = await req.prisma.user.findMany({
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                  }
                });
                
                res.json(users);
              } catch (error) {
                next(error);
              }
            };
            
            exports.getUserById = async (req, res, next) => {
              try {
                const user = await req.prisma.user.findUnique({
                  where: { id: req.params.id },
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                  }
                });
                
                if (!user) {
                  return res.status(404).json({ error: 'User not found' });
                }
                
                res.json(user);
              } catch (error) {
                next(error);
              }
            };
            
            exports.deleteUser = async (req, res, next) => {
              try {
                await req.prisma.user.delete({
                  where: { id: req.params.id }
                });
                
                res.status(204).send();
              } catch (error) {
                next(error);
              }
            };
            """
            
        case "productController.js":
            return """
            exports.getAllProducts = async (req, res, next) => {
              try {
                const { category, minPrice, maxPrice, search } = req.query;
                
                const where = {};
                
                if (category) where.category = category;
                if (search) {
                  where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                  ];
                }
                if (minPrice || maxPrice) {
                  where.price = {};
                  if (minPrice) where.price.gte = parseFloat(minPrice);
                  if (maxPrice) where.price.lte = parseFloat(maxPrice);
                }
                
                const products = await req.prisma.product.findMany({
                  where,
                  include: {
                    _count: {
                      select: { orderItems: true }
                    }
                  }
                });
                
                res.json(products);
              } catch (error) {
                next(error);
              }
            };
            
            exports.getProductById = async (req, res, next) => {
              try {
                const product = await req.prisma.product.findUnique({
                  where: { id: req.params.id },
                  include: {
                    _count: {
                      select: { orderItems: true }
                    }
                  }
                });
                
                if (!product) {
                  return res.status(404).json({ error: 'Product not found' });
                }
                
                res.json(product);
              } catch (error) {
                next(error);
              }
            };
            
            exports.createProduct = async (req, res, next) => {
              try {
                const { name, description, price, stock, category, imageUrl } = req.body;
                
                const product = await req.prisma.product.create({
                  data: {
                    name,
                    description,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    category,
                    imageUrl
                  }
                });
                
                res.status(201).json(product);
              } catch (error) {
                next(error);
              }
            };
            
            exports.updateProduct = async (req, res, next) => {
              try {
                const { name, description, price, stock, category, imageUrl } = req.body;
                
                const product = await req.prisma.product.update({
                  where: { id: req.params.id },
                  data: {
                    name,
                    description,
                    price: price ? parseFloat(price) : undefined,
                    stock: stock ? parseInt(stock) : undefined,
                    category,
                    imageUrl
                  }
                });
                
                res.json(product);
              } catch (error) {
                next(error);
              }
            };
            
            exports.deleteProduct = async (req, res, next) => {
              try {
                await req.prisma.product.delete({
                  where: { id: req.params.id }
                });
                
                res.status(204).send();
              } catch (error) {
                next(error);
              }
            };
            """
            
        case "orderController.js":
            return """
            exports.getUserOrders = async (req, res, next) => {
              try {
                const orders = await req.prisma.order.findMany({
                  where: { userId: req.userId },
                  include: {
                    orderItems: {
                      include: {
                        product: true
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                });
                
                res.json(orders);
              } catch (error) {
                next(error);
              }
            };
            
            exports.getOrderById = async (req, res, next) => {
              try {
                const order = await req.prisma.order.findFirst({
                  where: {
                    id: req.params.id,
                    userId: req.userId
                  },
                  include: {
                    orderItems: {
                      include: {
                        product: true
                      }
                    }
                  }
                });
                
                if (!order) {
                  return res.status(404).json({ error: 'Order not found' });
                }
                
                res.json(order);
              } catch (error) {
                next(error);
              }
            };
            
            exports.createOrder = async (req, res, next) => {
              try {
                const { items } = req.body; // Array of { productId, quantity }
                
                // Calculate total and verify stock
                let total = 0;
                const orderItems = [];
                
                for (const item of items) {
                  const product = await req.prisma.product.findUnique({
                    where: { id: item.productId }
                  });
                  
                  if (!product) {
                    return res.status(400).json({ error: `Product ${item.productId} not found` });
                  }
                  
                  if (product.stock < item.quantity) {
                    return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
                  }
                  
                  total += product.price * item.quantity;
                  orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price
                  });
                }
                
                // Create order with transaction
                const order = await req.prisma.$transaction(async (prisma) => {
                  // Create order
                  const newOrder = await prisma.order.create({
                    data: {
                      userId: req.userId,
                      total,
                      status: 'PENDING',
                      orderItems: {
                        create: orderItems
                      }
                    },
                    include: {
                      orderItems: {
                        include: {
                          product: true
                        }
                      }
                    }
                  });
                  
                  // Update stock
                  for (const item of items) {
                    await prisma.product.update({
                      where: { id: item.productId },
                      data: {
                        stock: {
                          decrement: item.quantity
                        }
                      }
                    });
                  }
                  
                  return newOrder;
                });
                
                res.status(201).json(order);
              } catch (error) {
                next(error);
              }
            };
            
            exports.updateOrderStatus = async (req, res, next) => {
              try {
                const { status } = req.body;
                
                const order = await req.prisma.order.update({
                  where: {
                    id: req.params.id,
                    userId: req.userId
                  },
                  data: { status }
                });
                
                res.json(order);
              } catch (error) {
                next(error);
              }
            };
            
            exports.cancelOrder = async (req, res, next) => {
              try {
                const order = await req.prisma.order.findFirst({
                  where: {
                    id: req.params.id,
                    userId: req.userId
                  },
                  include: {
                    orderItems: true
                  }
                });
                
                if (!order) {
                  return res.status(404).json({ error: 'Order not found' });
                }
                
                if (order.status !== 'PENDING') {
                  return res.status(400).json({ error: 'Cannot cancel order in current status' });
                }
                
                // Cancel order and restore stock
                await req.prisma.$transaction(async (prisma) => {
                  // Update order status
                  await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'CANCELLED' }
                  });
                  
                  // Restore stock
                  for (const item of order.orderItems) {
                    await prisma.product.update({
                      where: { id: item.productId },
                      data: {
                        stock: {
                          increment: item.quantity
                        }
                      }
                    });
                  }
                });
                
                res.json({ message: 'Order cancelled successfully' });
              } catch (error) {
                next(error);
              }
            };
            """
            
        case "auth.js":
            return """
            const jwt = require('jsonwebtoken');
            
            module.exports = (req, res, next) => {
              try {
                const token = req.header('Authorization')?.replace('Bearer ', '');
                
                if (!token) {
                  throw new Error();
                }
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.userId = decoded.userId;
                
                next();
              } catch (error) {
                res.status(401).json({ error: 'Please authenticate' });
              }
            };
            """
            
        case "errorHandler.js":
            return """
            module.exports = (err, req, res, next) => {
              console.error(err.stack);
              
              // Prisma error handling
              if (err.code === 'P2002') {
                return res.status(400).json({
                  error: 'Unique constraint violation',
                  field: err.meta?.target
                });
              }
              
              if (err.code === 'P2025') {
                return res.status(404).json({
                  error: 'Record not found'
                });
              }
              
              // JWT errors
              if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                  error: 'Invalid token'
                });
              }
              
              if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                  error: 'Token expired'
                });
              }
              
              // Validation errors
              if (err.name === 'ValidationError') {
                return res.status(400).json({
                  error: 'Validation error',
                  details: err.message
                });
              }
              
              // Default error
              res.status(err.statusCode || 500).json({
                error: err.message || 'Internal server error'
              });
            };
            """
            
        case "database.js":
            return """
            const { PrismaClient } = require('@prisma/client');
            
            const prisma = new PrismaClient({
              log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
            });
            
            // Test database connection
            async function connectDB() {
              try {
                await prisma.$connect();
                console.log('Database connected successfully');
              } catch (error) {
                console.error('Database connection failed:', error);
                process.exit(1);
              }
            }
            
            module.exports = { prisma, connectDB };
            """
            
        case "jwt.js":
            return """
            const jwt = require('jsonwebtoken');
            
            const generateToken = (userId) => {
              return jwt.sign(
                { userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
              );
            };
            
            const verifyToken = (token) => {
              return jwt.verify(token, process.env.JWT_SECRET);
            };
            
            module.exports = {
              generateToken,
              verifyToken
            };
            """
            
        case "api.js":
            return """
            import axios from 'axios';
            
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            
            // Create axios instance
            const api = axios.create({
              baseURL: API_URL,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            // Request interceptor to add auth token
            api.interceptors.request.use(
              (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                  config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
              },
              (error) => {
                return Promise.reject(error);
              }
            );
            
            // Response interceptor to handle errors
            api.interceptors.response.use(
              (response) => response,
              (error) => {
                if (error.response?.status === 401) {
                  // Token expired or invalid
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }
                return Promise.reject(error);
              }
            );
            
            // Auth API
            export const authAPI = {
              register: (data) => api.post('/users/register', data),
              login: (data) => api.post('/users/login', data),
              getProfile: () => api.get('/users/profile'),
              updateProfile: (data) => api.put('/users/profile', data)
            };
            
            // Products API
            export const productsAPI = {
              getAll: (params) => api.get('/products', { params }),
              getById: (id) => api.get(`/products/${id}`),
              create: (data) => api.post('/products', data),
              update: (id, data) => api.put(`/products/${id}`, data),
              delete: (id) => api.delete(`/products/${id}`)
            };
            
            // Orders API
            export const ordersAPI = {
              getMyOrders: () => api.get('/orders'),
              getById: (id) => api.get(`/orders/${id}`),
              create: (data) => api.post('/orders', data),
              updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
              cancel: (id) => api.delete(`/orders/${id}`)
            };
            
            // Users API (admin)
            export const usersAPI = {
              getAll: () => api.get('/users'),
              getById: (id) => api.get(`/users/${id}`),
              delete: (id) => api.delete(`/users/${id}`)
            };
            
            export default api;
            """
            
        case "processor.js":
            return """
            import { unified } from 'unified';
            import remarkParse from 'remark-parse';
            import remarkRehype from 'remark-rehype';
            import rehypeStringify from 'rehype-stringify';
            import remarkGfm from 'remark-gfm';
            
            export async function processMarkdown(content) {
              const result = await unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkRehype)
                .use(rehypeStringify)
                .process(content);
              
              return result.toString();
            }
            """
            
        case "next.config.js":
            return """
            /** @type {import('next').NextConfig} */
            const nextConfig = {
              images: {
                domains: ['lh3.googleusercontent.com'],
              },
            }
            
            module.exports = nextConfig
            """
            
        default:
            return "// JavaScript file\\n"
        }
    }
    
    private static func getBlankJSContent(for filename: String, template: String) -> String {
        switch filename {
        case "index.js":
            if template == "fullstack-blank" {
                // Server index.js for fullstack-blank
                return """
                const express = require('express');
                const cors = require('cors');
                const path = require('path');
                
                const app = express();
                const PORT = process.env.PORT || 3001;
                
                // Middleware
                app.use(cors());
                app.use(express.json());
                
                // Routes
                app.get('/api/hello', (req, res) => {
                  res.json({ message: 'Hello from the server!' });
                });
                
                // Error handling
                app.use((err, req, res, next) => {
                  console.error(err.stack);
                  res.status(500).send('Something broke!');
                });
                
                app.listen(PORT, () => {
                  console.log(`Server is running on port ${PORT}`);
                });
                """
            } else if template == "blog-blank" {
                // Client index.js for blog-blank
                return """
                import Head from 'next/head';
                import Link from 'next/link';
                import Layout from '../components/Layout';
                
                export default function Home() {
                  return (
                    <Layout>
                      <Head>
                        <title>My Blog</title>
                        <meta name="description" content="Welcome to my blog" />
                      </Head>
                      
                      <h1>Welcome to My Blog</h1>
                      <p>This is a minimal blog starter template.</p>
                      
                      <h2>Recent Posts</h2>
                      <ul>
                        <li>
                          <Link href="/blog/hello-world">
                            <a>Hello World</a>
                          </Link>
                        </li>
                      </ul>
                    </Layout>
                  );
                }
                """
            } else {
                // Default minimal Next.js index page
                return """
                import Head from 'next/head';
                
                export default function Home() {
                  return (
                    <>
                      <Head>
                        <title>My App</title>
                        <meta name="description" content="Created with Template Manager" />
                      </Head>
                      
                      <main>
                        <h1>Welcome to My App</h1>
                        <p>Get started by editing this page.</p>
                      </main>
                    </>
                  );
                }
                """
            }
            
        case "products.js":
            return """
            import { useState, useEffect } from 'react';
            import Layout from '../components/Layout';
            import ProductCard from '../components/ProductCard';
            
            export default function Products() {
              const [products, setProducts] = useState([]);
              
              useEffect(() => {
                // Fetch products from API
                const sampleProducts = [
                  { id: 1, name: 'Product 1', price: 19.99 },
                  { id: 2, name: 'Product 2', price: 29.99 },
                  { id: 3, name: 'Product 3', price: 39.99 },
                ];
                setProducts(sampleProducts);
              }, []);
              
              return (
                <Layout>
                  <h1>Products</h1>
                  <div className="products-grid">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </Layout>
              );
            }
            """
            
        case "[slug].js":
            return """
            import { useRouter } from 'next/router';
            import Layout from '../../components/Layout';
            
            export default function BlogPost() {
              const router = useRouter();
              const { slug } = router.query;
              
              return (
                <Layout>
                  <article>
                    <h1>Blog Post: {slug}</h1>
                    <p>This is where your blog post content would go.</p>
                  </article>
                </Layout>
              );
            }
            """
            
        default:
            return """
            // Minimal JavaScript file
            console.log('Hello from ' + '${filename}');
            
            module.exports = {};
            """
        }
    }
    
    private static func getTSContent(for filename: String, template: String) -> String {
        // Handle blank templates with minimal content
        if template.contains("-blank") {
            return getBlankTSContent(for: filename, template: template)
        }
        
        switch filename {
        case "auth-options.ts":
            return """
            import { NextAuthOptions } from "next-auth"
            import GoogleProvider from "next-auth/providers/google"
            import { PrismaAdapter } from "@auth/prisma-adapter"
            import { prisma } from "@/lib/db/prisma"
            
            export const authOptions: NextAuthOptions = {
              adapter: PrismaAdapter(prisma),
              providers: [
                GoogleProvider({
                  clientId: process.env.GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                }),
              ],
              session: {
                strategy: "jwt",
              },
              pages: {
                signIn: "/login",
              },
              callbacks: {
                async session({ session, token }) {
                  if (token) {
                    session.user.id = token.id as string
                  }
                  return session
                },
                async jwt({ token, user }) {
                  if (user) {
                    token.id = user.id
                  }
                  return token
                },
              },
            }
            """
            
        case "prisma.ts":
            return """
            import { PrismaClient } from '@prisma/client'
            
            const globalForPrisma = globalThis as unknown as {
              prisma: PrismaClient | undefined
            }
            
            export const prisma = globalForPrisma.prisma ?? new PrismaClient()
            
            if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
            """
            
        case "middleware.ts":
            return """
            export { default } from "next-auth/middleware"
            
            export const config = {
              matcher: ["/dashboard/:path*", "/protected/:path*"]
            }
            """
            
        default:
            return "// TypeScript file\\n"
        }
    }
    
    private static func getBlankTSXContent(for filename: String, template: String) -> String {
        switch filename {
        case "layout.tsx":
            return """
            import './globals.css'
            
            export default function RootLayout({
              children,
            }: {
              children: React.ReactNode
            }) {
              return (
                <html lang="en">
                  <body>{children}</body>
                </html>
              )
            }
            """
            
        case "page.tsx":
            return """
            export default function Home() {
              return (
                <main>
                  <h1>Welcome to Next.js</h1>
                  <p>This is a minimal starter template.</p>
                </main>
              )
            }
            """
            
        case "LoginButton.tsx":
            return """
            'use client'
            
            import { signIn, signOut, useSession } from 'next-auth/react'
            
            export default function LoginButton() {
              const { data: session } = useSession()
              
              if (session) {
                return (
                  <button onClick={() => signOut()}>
                    Sign out
                  </button>
                )
              }
              
              return (
                <button onClick={() => signIn()}>
                  Sign in
                </button>
              )
            }
            """
            
        default:
            return """
            export default function Component() {
              return <div>Edit this component</div>
            }
            """
        }
    }
    
    private static func getBlankTSContent(for filename: String, template: String) -> String {
        switch filename {
        case "auth.ts":
            return """
            import NextAuth from 'next-auth'
            import GoogleProvider from 'next-auth/providers/google'
            
            export const authOptions = {
              providers: [
                GoogleProvider({
                  clientId: process.env.GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                }),
              ],
            }
            
            export default NextAuth(authOptions)
            """
            
        case "route.ts":
            return """
            import NextAuth from 'next-auth'
            import { authOptions } from '@/lib/auth'
            
            const handler = NextAuth(authOptions)
            
            export { handler as GET, handler as POST }
            """
            
        default:
            return """
            // TypeScript file
            export {}
            """
        }
    }
    
    private static func getMarkdownContent(for filename: String) -> String {
        switch filename {
        case "README.md":
            return """
            # My Project
            
            This project was created with Template Manager.
            
            ## Getting Started
            
            First, install the dependencies:
            
            ```bash
            npm install
            ```
            
            Then, run the development server:
            
            ```bash
            npm run dev
            ```
            
            Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
            
            ## Learn More
            
            This is a minimal starter template. Start editing the files to build your application!
            """
            
        case "hello-world.md":
            return """
            ---
            title: 'Hello World'
            date: '2025-01-01'
            author: 'Your Name'
            excerpt: 'This is your first blog post!'
            ---
            
            # Hello World
            
            Welcome to your new blog! This is your first post.
            
            ## Getting Started
            
            Edit this file to create your own content. You can use:
            
            - **Bold text**
            - *Italic text*
            - `Code snippets`
            - [Links](https://example.com)
            
            ### Code Example
            
            ```javascript
            function greet(name) {
              return `Hello, ${name}!`;
            }
            ```
            
            Happy blogging!
            """
            
        default:
            return """
            # Example Post
            
            This is an example markdown file created by Template Manager.
            
            ## Features
            
            - Easy to write
            - Supports GitHub Flavored Markdown
            - Ready for MDX processing
            
            ## Code Example
            
            ```javascript
            console.log('Hello from Template Manager!');
            ```
            """
        }
    }
    
    private static func getJSONContent(for filename: String, template: String) -> String {
        // Handle blank templates with minimal package.json
        if template.contains("-blank") && filename == "package.json" {
            return getBlankPackageJSON(for: template)
        }
        
        // Handle fullstack-blank special package.json files
        if template == "fullstack-blank" {
            if filename == "server/package.json" {
                return """
                {
                  "name": "server",
                  "version": "1.0.0",
                  "description": "Express server",
                  "main": "index.js",
                  "scripts": {
                    "dev": "nodemon index.js",
                    "start": "node index.js"
                  },
                  "dependencies": {
                    "express": "^4.18.2",
                    "cors": "^2.8.5"
                  },
                  "devDependencies": {
                    "nodemon": "^3.0.2"
                  }
                }
                """
            } else if filename == "client/package.json" {
                return """
                {
                  "name": "client",
                  "version": "0.1.0",
                  "private": true,
                  "scripts": {
                    "dev": "react-scripts start",
                    "build": "react-scripts build",
                    "test": "react-scripts test",
                    "eject": "react-scripts eject"
                  },
                  "dependencies": {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "react-scripts": "5.0.1"
                  },
                  "proxy": "http://localhost:3001"
                }
                """
            }
        }
        
        switch filename {
        case "tsconfig.json":
            return """
            {
              "compilerOptions": {
                "target": "es5",
                "lib": ["dom", "dom.iterable", "esnext"],
                "allowJs": true,
                "skipLibCheck": true,
                "strict": true,
                "noEmit": true,
                "esModuleInterop": true,
                "module": "esnext",
                "moduleResolution": "bundler",
                "resolveJsonModule": true,
                "isolatedModules": true,
                "jsx": "preserve",
                "incremental": true,
                "plugins": [
                  {
                    "name": "next"
                  }
                ],
                "paths": {
                  "@/*": ["./*"]
                }
              },
              "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
              "exclude": ["node_modules"]
            }
            """
            
        case "package.json":
            if template == "fullstack-database" {
                return """
                {
                  "name": "fullstack-database-server",
                  "version": "1.0.0",
                  "description": "Full-stack application with database integration",
                  "main": "server/index.js",
                  "scripts": {
                    "dev": "nodemon server/index.js",
                    "start": "node server/index.js",
                    "prisma:generate": "prisma generate",
                    "prisma:migrate": "prisma migrate dev",
                    "prisma:seed": "ts-node prisma/seed.ts",
                    "prisma:studio": "prisma studio",
                    "test": "jest",
                    "lint": "eslint server/"
                  },
                  "dependencies": {
                    "express": "^4.18.2",
                    "cors": "^2.8.5",
                    "dotenv": "^16.3.1",
                    "@prisma/client": "^5.8.0",
                    "bcryptjs": "^2.4.3",
                    "jsonwebtoken": "^9.0.2",
                    "express-validator": "^7.0.1",
                    "helmet": "^7.1.0",
                    "compression": "^1.7.4",
                    "express-rate-limit": "^7.1.5"
                  },
                  "devDependencies": {
                    "prisma": "^5.8.0",
                    "nodemon": "^3.0.2",
                    "@types/node": "^20.10.5",
                    "ts-node": "^10.9.2",
                    "typescript": "^5.3.3",
                    "jest": "^29.7.0",
                    "supertest": "^6.3.3",
                    "eslint": "^8.56.0"
                  }
                }
                """
            } else if template == "nextjs-google-auth" {
                return """
                {
                  "name": "nextjs-google-auth",
                  "version": "0.1.0",
                  "private": true,
                  "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start",
                    "lint": "next lint",
                    "db:push": "prisma db push",
                    "db:generate": "prisma generate"
                  },
                  "dependencies": {
                    "next": "14.1.0",
                    "react": "^18",
                    "react-dom": "^18",
                    "next-auth": "^5.0.0-beta.3",
                    "@auth/prisma-adapter": "^1.0.12",
                    "@prisma/client": "^5.8.0",
                    "zod": "^3.22.4"
                  },
                  "devDependencies": {
                    "@types/node": "^20",
                    "@types/react": "^18",
                    "@types/react-dom": "^18",
                    "autoprefixer": "^10.0.1",
                    "postcss": "^8",
                    "tailwindcss": "^3.3.0",
                    "typescript": "^5",
                    "prisma": "^5.8.0",
                    "eslint": "^8",
                    "eslint-config-next": "14.1.0"
                  }
                }
                """
            } else {
                return """
                {
                  "name": "my-app",
                  "version": "0.1.0",
                  "private": true,
                  "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start",
                    "lint": "next lint"
                  },
                  "dependencies": {
                    "next": "14.1.0",
                    "react": "^18",
                    "react-dom": "^18"
                  },
                  "devDependencies": {
                    "@types/node": "^20",
                    "@types/react": "^18",
                    "@types/react-dom": "^18",
                    "typescript": "^5",
                    "eslint": "^8",
                    "eslint-config-next": "14.1.0"
                  }
                }
                """
            }
            
        default:
            return "{}"
        }
    }
    
    private static func getBlankPackageJSON(for template: String) -> String {
        switch template {
        case "ecommerce-blank":
            return """
            {
              "name": "ecommerce-blank",
              "version": "0.1.0",
              "private": true,
              "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
              },
              "dependencies": {
                "next": "14.1.0",
                "react": "^18",
                "react-dom": "^18"
              },
              "devDependencies": {
                "eslint": "^8",
                "eslint-config-next": "14.1.0"
              }
            }
            """
            
        case "blog-blank":
            return """
            {
              "name": "blog-blank",
              "version": "0.1.0",
              "private": true,
              "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
              },
              "dependencies": {
                "next": "14.1.0",
                "react": "^18",
                "react-dom": "^18",
                "gray-matter": "^4.0.3",
                "remark": "^15.0.1",
                "remark-html": "^16.0.1"
              },
              "devDependencies": {
                "eslint": "^8",
                "eslint-config-next": "14.1.0"
              }
            }
            """
            
        case "nextjs-auth-blank":
            return """
            {
              "name": "nextjs-auth-blank",
              "version": "0.1.0",
              "private": true,
              "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
              },
              "dependencies": {
                "next": "14.1.0",
                "react": "^18",
                "react-dom": "^18",
                "next-auth": "^5.0.0-beta.3"
              },
              "devDependencies": {
                "@types/node": "^20",
                "@types/react": "^18",
                "@types/react-dom": "^18",
                "typescript": "^5",
                "eslint": "^8",
                "eslint-config-next": "14.1.0"
              }
            }
            """
            
        case "fullstack-blank":
            return """
            {
              "name": "fullstack-blank",
              "version": "1.0.0",
              "description": "Minimal fullstack starter",
              "scripts": {
                "dev": "concurrently \\"npm run dev:server\\" \\"npm run dev:client\\"",
                "dev:server": "cd server && npm run dev",
                "dev:client": "cd client && npm run dev",
                "install:all": "npm install && cd server && npm install && cd ../client && npm install"
              },
              "devDependencies": {
                "concurrently": "^8.2.2"
              }
            }
            """
            
        default:
            return """
            {
              "name": "my-app",
              "version": "0.1.0",
              "private": true,
              "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start"
              },
              "dependencies": {
                "next": "14.1.0",
                "react": "^18",
                "react-dom": "^18"
              }
            }
            """
        }
    }
    
    private static func getYAMLContent(for filename: String, template: String) -> String {
        switch filename {
        case "docker-compose.yml":
            return """
            version: '3.8'
            
            services:
              postgres:
                image: postgres:15-alpine
                container_name: fullstack_db
                ports:
                  - "5432:5432"
                environment:
                  POSTGRES_USER: postgres
                  POSTGRES_PASSWORD: postgres
                  POSTGRES_DB: fullstack_db
                volumes:
                  - postgres_data:/var/lib/postgresql/data
                healthcheck:
                  test: ["CMD-SHELL", "pg_isready -U postgres"]
                  interval: 10s
                  timeout: 5s
                  retries: 5
              
              redis:
                image: redis:7-alpine
                container_name: fullstack_cache
                ports:
                  - "6379:6379"
                command: redis-server --appendonly yes
                volumes:
                  - redis_data:/data
                healthcheck:
                  test: ["CMD", "redis-cli", "ping"]
                  interval: 10s
                  timeout: 5s
                  retries: 5
            
            volumes:
              postgres_data:
              redis_data:
            
            networks:
              default:
                name: fullstack_network
            """
        default:
            return ""
        }
    }
    
    private static func getSeedContent() -> String {
        return """
        import { PrismaClient } from '@prisma/client';
        import bcrypt from 'bcryptjs';
        
        const prisma = new PrismaClient();
        
        async function main() {
          console.log('Seeding database...');
          
          // Create users
          const hashedPassword = await bcrypt.hash('password123', 10);
          
          const user1 = await prisma.user.create({
            data: {
              email: 'admin@example.com',
              password: hashedPassword,
              name: 'Admin User',
              role: 'ADMIN'
            }
          });
          
          const user2 = await prisma.user.create({
            data: {
              email: 'user@example.com',
              password: hashedPassword,
              name: 'Regular User',
              role: 'USER'
            }
          });
          
          // Create products
          const products = await Promise.all([
            prisma.product.create({
              data: {
                name: 'Laptop',
                description: 'High-performance laptop for developers',
                price: 1299.99,
                stock: 50,
                category: 'Electronics',
                imageUrl: 'https://example.com/laptop.jpg'
              }
            }),
            prisma.product.create({
              data: {
                name: 'Mechanical Keyboard',
                description: 'RGB mechanical keyboard with blue switches',
                price: 149.99,
                stock: 100,
                category: 'Accessories',
                imageUrl: 'https://example.com/keyboard.jpg'
              }
            }),
            prisma.product.create({
              data: {
                name: 'Monitor',
                description: '27-inch 4K monitor',
                price: 599.99,
                stock: 30,
                category: 'Electronics',
                imageUrl: 'https://example.com/monitor.jpg'
              }
            })
          ]);
          
          // Create sample order
          await prisma.order.create({
            data: {
              userId: user2.id,
              total: products[0].price + products[1].price,
              status: 'COMPLETED',
              orderItems: {
                create: [
                  {
                    productId: products[0].id,
                    quantity: 1,
                    price: products[0].price
                  },
                  {
                    productId: products[1].id,
                    quantity: 1,
                    price: products[1].price
                  }
                ]
              }
            }
          });
          
          console.log('Database seeded successfully!');
        }
        
        main()
          .catch((e) => {
            console.error(e);
            process.exit(1);
          })
          .finally(async () => {
            await prisma.$disconnect();
          });
        """
    }
    
    private static func getEnvExampleContent() -> String {
        return """
        # Node Environment
        NODE_ENV=development
        PORT=5000
        
        # Database
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fullstack_db?schema=public"
        
        # JWT
        JWT_SECRET=your-super-secret-jwt-key-change-this
        JWT_EXPIRES_IN=7d
        
        # Redis (optional)
        REDIS_URL=redis://localhost:6379
        
        # Frontend URL
        CLIENT_URL=http://localhost:3000
        
        # Email (optional)
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=587
        SMTP_USER=your-email@gmail.com
        SMTP_PASS=your-app-password
        """
    }
    
    private static func createSpecialFiles(for template: Template, at projectPath: String) throws {
        // Create vercel.json for Vercel-compatible templates
        if isVercelCompatibleTemplate(template) {
            try createVercelConfig(for: template, at: projectPath)
        }
        
        switch template.name {
        case "nextjs-google-auth":
            // Create .env.local.example
            let envContent = """
            # NextAuth Configuration
            NEXTAUTH_URL=http://localhost:3000
            NEXTAUTH_SECRET=your-secret-here-generate-with-openssl
            
            # Google OAuth
            GOOGLE_CLIENT_ID=your-google-client-id
            GOOGLE_CLIENT_SECRET=your-google-client-secret
            
            # Database
            DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
            """
            let envPath = (projectPath as NSString).appendingPathComponent(".env.local.example")
            try envContent.write(toFile: envPath, atomically: true, encoding: .utf8)
            
            // Create Prisma schema
            let prismaSchema = """
            generator client {
              provider = "prisma-client-js"
            }
            
            datasource db {
              provider = "postgresql"
              url      = env("DATABASE_URL")
            }
            
            model Account {
              id                String  @id @default(cuid())
              userId            String
              type              String
              provider          String
              providerAccountId String
              refresh_token     String?
              access_token      String?
              expires_at        Int?
              token_type        String?
              scope             String?
              id_token          String?
              session_state     String?
            
              user User @relation(fields: [userId], references: [id], onDelete: Cascade)
            
              @@unique([provider, providerAccountId])
            }
            
            model Session {
              id           String   @id @default(cuid())
              sessionToken String   @unique
              userId       String
              expires      DateTime
              user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
            }
            
            model User {
              id            String    @id @default(cuid())
              name          String?
              email         String?   @unique
              emailVerified DateTime?
              image         String?
              accounts      Account[]
              sessions      Session[]
            }
            
            model VerificationToken {
              identifier String
              token      String   @unique
              expires    DateTime
            
              @@unique([identifier, token])
            }
            """
            let prismaPath = (projectPath as NSString).appendingPathComponent("prisma/schema.prisma")
            try prismaSchema.write(toFile: prismaPath, atomically: true, encoding: .utf8)
            
            // Create tailwind.config.js
            let tailwindConfig = """
            /** @type {import('tailwindcss').Config} */
            module.exports = {
              content: [
                './pages/**/*.{js,ts,jsx,tsx,mdx}',
                './components/**/*.{js,ts,jsx,tsx,mdx}',
                './app/**/*.{js,ts,jsx,tsx,mdx}',
              ],
              theme: {
                extend: {},
              },
              plugins: [],
            }
            """
            let tailwindPath = (projectPath as NSString).appendingPathComponent("tailwind.config.js")
            try tailwindConfig.write(toFile: tailwindPath, atomically: true, encoding: .utf8)
            
            // Create postcss.config.js
            let postcssConfig = """
            module.exports = {
              plugins: {
                tailwindcss: {},
                autoprefixer: {},
              },
            }
            """
            let postcssPath = (projectPath as NSString).appendingPathComponent("postcss.config.js")
            try postcssConfig.write(toFile: postcssPath, atomically: true, encoding: .utf8)
            
            // Create app/globals.css
            let globalsCss = """
            @tailwind base;
            @tailwind components;
            @tailwind utilities;
            """
            let cssPath = (projectPath as NSString).appendingPathComponent("app/globals.css")
            try globalsCss.write(toFile: cssPath, atomically: true, encoding: .utf8)
            
            // Create app/providers.tsx
            let providersContent = """
            'use client'
            
            import { SessionProvider } from 'next-auth/react'
            
            export function Providers({ children }: { children: React.ReactNode }) {
              return <SessionProvider>{children}</SessionProvider>
            }
            """
            let providersPath = (projectPath as NSString).appendingPathComponent("app/providers.tsx")
            try providersContent.write(toFile: providersPath, atomically: true, encoding: .utf8)
            
        case "ecommerce", "blog":
            // Create basic package.json if not already in files list
            if !template.files.contains("package.json") {
                let packageJson = getJSONContent(for: "package.json", template: template.name)
                let packagePath = (projectPath as NSString).appendingPathComponent("package.json")
                try packageJson.write(toFile: packagePath, atomically: true, encoding: .utf8)
            }
            
        case "fullstack-database":
            // Create Prisma schema for database template
            _ = """
            generator client {
              provider = "prisma-client-js"
            }
            
            datasource db {
              provider = "postgresql"
              url      = env("DATABASE_URL")
            }
            
            model User {
              id        String   @id @default(cuid())
              email     String   @unique
              password  String
              name      String?
              role      Role     @default(USER)
              orders    Order[]
              createdAt DateTime @default(now())
              updatedAt DateTime @updatedAt
            }
            
            model Product {
              id          String      @id @default(cuid())
              name        String
              description String?
              price       Float
              stock       Int
              category    String
              imageUrl    String?
              orderItems  OrderItem[]
              createdAt   DateTime    @default(now())
              updatedAt   DateTime    @updatedAt
            }
            
            model Order {
              id         String      @id @default(cuid())
              userId     String
              user       User        @relation(fields: [userId], references: [id])
              total      Float
              status     OrderStatus @default(PENDING)
              orderItems OrderItem[]
              createdAt  DateTime    @default(now())
              updatedAt  DateTime    @updatedAt
            }
            
            model OrderItem {
              id        String  @id @default(cuid())
              orderId   String
              order     Order   @relation(fields: [orderId], references: [id])
              productId String
              product   Product @relation(fields: [productId], references: [id])
              quantity  Int
              price     Float
            }
            
            enum Role {
              USER
              ADMIN
            }
            
            enum OrderStatus {
              PENDING
              PROCESSING
              COMPLETED
              CANCELLED
            }
            """
            // This is already handled in files, but keeping for reference
            
            // Create client-side package.json
            let clientPackageJson = """
            {
              "name": "fullstack-client",
              "version": "0.1.0",
              "private": true,
              "scripts": {
                "dev": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
              },
              "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1",
                "axios": "^1.6.0",
                "react-router-dom": "^6.20.0"
              },
              "devDependencies": {
                "@types/react": "^18.2.0",
                "@types/react-dom": "^18.2.0"
              },
              "eslintConfig": {
                "extends": ["react-app"]
              },
              "browserslist": {
                "production": [">0.2%", "not dead", "not op_mini all"],
                "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
              },
              "proxy": "http://localhost:5000"
            }
            """
            let clientPackagePath = (projectPath as NSString).appendingPathComponent("client/package.json")
            try clientPackageJson.write(toFile: clientPackagePath, atomically: true, encoding: .utf8)
            
            // Create scripts
            let startScript = """
            #!/bin/bash
            # Start development servers
            
            echo "Starting PostgreSQL with Docker..."
            docker-compose up -d postgres
            
            echo "Waiting for database to be ready..."
            sleep 5
            
            echo "Running database migrations..."
            npx prisma migrate dev
            
            echo "Starting backend server..."
            npm run dev &
            
            echo "Starting frontend..."
            cd client && npm start
            """
            let startScriptPath = (projectPath as NSString).appendingPathComponent("scripts/start-dev.sh")
            try startScript.write(toFile: startScriptPath, atomically: true, encoding: .utf8)
            
            // Make script executable
            try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: startScriptPath)
            
        default:
            break
        }
        
        // Create VS Code configuration for all templates
        try createVSCodeConfig(for: template, at: projectPath)
        
        // Create README.md for all templates
        let readmeContent = """
        # \(template.name.capitalized) Project
        
        Created with Template Manager.
        
        ## Getting Started
        
        1. Install dependencies:
           ```bash
           npm install
           ```
        
        2. Run the development server:
           ```bash
           npm run dev
           ```
        
        3. Open [http://localhost:3000](http://localhost:3000) in your browser.
        
        ## Project Structure
        
        This project was created using the \(template.name) template.
        """
        
        let readmePath = (projectPath as NSString).appendingPathComponent("README.md")
        try readmeContent.write(toFile: readmePath, atomically: true, encoding: .utf8)
        
        // Create .gitignore
        let gitignoreContent = """
        # dependencies
        /node_modules
        /.pnp
        .pnp.js
        
        # testing
        /coverage
        
        # next.js
        /.next/
        /out/
        
        # production
        /build
        
        # misc
        .DS_Store
        *.pem
        
        # debug
        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*
        
        # local env files
        .env*.local
        
        # vercel
        .vercel
        
        # typescript
        *.tsbuildinfo
        next-env.d.ts
        """
        
        let gitignorePath = (projectPath as NSString).appendingPathComponent(".gitignore")
        try gitignoreContent.write(toFile: gitignorePath, atomically: true, encoding: .utf8)
    }
    
    private static func createVSCodeConfig(for template: Template, at projectPath: String) throws {
        // Create .vscode directory
        let vscodeDir = (projectPath as NSString).appendingPathComponent(".vscode")
        try FileManager.default.createDirectory(atPath: vscodeDir, withIntermediateDirectories: true)
        
        // Create tasks.json
        let tasksContent: String
        switch template.name {
        case "nextjs-google-auth", "blog", "ecommerce":
            tasksContent = """
            {
              "version": "2.0.0",
              "tasks": [
                {
                  "label": "Install Dependencies and Start Dev Server",
                  "type": "shell",
                  "command": "npm install && npm run dev",
                  "group": {
                    "kind": "build",
                    "isDefault": true
                  },
                  "presentation": {
                    "reveal": "always",
                    "panel": "new",
                    "focus": true
                  },
                  "runOptions": {
                    "runOn": "folderOpen"
                  },
                  "problemMatcher": []
                },
                {
                  "label": "Open in Browser",
                  "type": "shell",
                  "command": "sleep 5 && open http://localhost:3000",
                  "presentation": {
                    "reveal": "never"
                  },
                  "runOptions": {
                    "runOn": "folderOpen"
                  },
                  "problemMatcher": []
                }
              ]
            }
            """
            
        case "fullstack-database":
            tasksContent = """
            {
              "version": "2.0.0",
              "tasks": [
                {
                  "label": "Setup and Start Full Stack App",
                  "type": "shell",
                  "command": "bash",
                  "args": ["-c", "npm install && cd client && npm install && cd .. && docker-compose up -d postgres && sleep 5 && npx prisma migrate dev --name init && npm run dev & cd client && npm start"],
                  "group": {
                    "kind": "build",
                    "isDefault": true
                  },
                  "presentation": {
                    "reveal": "always",
                    "panel": "new",
                    "focus": true
                  },
                  "runOptions": {
                    "runOn": "folderOpen"
                  },
                  "problemMatcher": []
                },
                {
                  "label": "Open Frontend in Browser",
                  "type": "shell",
                  "command": "sleep 10 && open http://localhost:3000",
                  "presentation": {
                    "reveal": "never"
                  },
                  "runOptions": {
                    "runOn": "folderOpen"
                  },
                  "problemMatcher": []
                }
              ]
            }
            """
            
        default:
            tasksContent = """
            {
              "version": "2.0.0",
              "tasks": [
                {
                  "label": "Install Dependencies",
                  "type": "shell",
                  "command": "npm install",
                  "group": {
                    "kind": "build",
                    "isDefault": true
                  },
                  "presentation": {
                    "reveal": "always",
                    "panel": "new"
                  },
                  "runOptions": {
                    "runOn": "folderOpen"
                  }
                }
              ]
            }
            """
        }
        
        let tasksPath = (vscodeDir as NSString).appendingPathComponent("tasks.json")
        try tasksContent.write(toFile: tasksPath, atomically: true, encoding: .utf8)
        
        // Create settings.json
        let settingsContent = """
        {
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
          },
          "terminal.integrated.defaultProfile.osx": "bash",
          "terminal.integrated.defaultProfile.linux": "bash",
          "terminal.integrated.defaultProfile.windows": "powershell",
          "liveServer.settings.port": 3001,
          "typescript.tsdk": "node_modules/typescript/lib",
          "files.exclude": {
            "**/.git": true,
            "**/.DS_Store": true,
            "**/node_modules": true,
            "**/.next": true,
            "**/build": true,
            "**/dist": true
          },
          "workbench.startupEditor": "readme",
          "markdown.preview.scrollEditorWithPreview": true,
          "markdown.preview.scrollPreviewWithEditor": true
        }
        """
        
        let settingsPath = (vscodeDir as NSString).appendingPathComponent("settings.json")
        try settingsContent.write(toFile: settingsPath, atomically: true, encoding: .utf8)
        
        // Create extensions.json
        let extensionsContent: String
        switch template.name {
        case "nextjs-google-auth", "blog", "ecommerce":
            extensionsContent = """
            {
              "recommendations": [
                "dbaeumer.vscode-eslint",
                "esbenp.prettier-vscode",
                "bradlc.vscode-tailwindcss",
                "prisma.prisma",
                "formulahendry.auto-rename-tag",
                "steoates.autoimport",
                "mgmcdermott.vscode-language-babel"
              ]
            }
            """
            
        case "fullstack-database":
            extensionsContent = """
            {
              "recommendations": [
                "dbaeumer.vscode-eslint",
                "esbenp.prettier-vscode",
                "prisma.prisma",
                "cweijan.vscode-postgresql-client2",
                "rangav.vscode-thunder-client",
                "mikestead.dotenv",
                "humao.rest-client"
              ]
            }
            """
            
        default:
            extensionsContent = """
            {
              "recommendations": [
                "dbaeumer.vscode-eslint",
                "esbenp.prettier-vscode"
              ]
            }
            """
        }
        
        let extensionsPath = (vscodeDir as NSString).appendingPathComponent("extensions.json")
        try extensionsContent.write(toFile: extensionsPath, atomically: true, encoding: .utf8)
        
        // Create WELCOME.md
        let welcomeContent: String
        switch template.name {
        case "nextjs-google-auth":
            welcomeContent = """
            # 🎉 Welcome to Your Next.js Google Auth Project!
            
            ## 🚀 Auto-Setup in Progress...
            
            The following tasks are running automatically:
            1. ✓ Installing dependencies with `npm install`
            2. ✓ Starting the development server
            3. ✓ Opening your browser to http://localhost:3000
            
            ## 📋 While You Wait...
            
            ### Configure Google OAuth:
            1. Go to [Google Cloud Console](https://console.cloud.google.com/)
            2. Create a new project or select existing
            3. Enable Google+ API
            4. Create OAuth 2.0 credentials
            5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
            
            ### Set Up Environment Variables:
            1. Copy `.env.local.example` to `.env.local`
            2. Add your Google OAuth credentials
            3. Generate a NextAuth secret: `openssl rand -base64 32`
            
            ### Set Up Database:
            1. Update DATABASE_URL in `.env.local`
            2. Run `npx prisma db push` to create tables
            
            ## 🎯 Quick Links
            
            - [app/page.tsx](app/page.tsx) - Home page
            - [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx) - Login page
            - [lib/auth/auth-options.ts](lib/auth/auth-options.ts) - Auth configuration
            - [prisma/schema.prisma](prisma/schema.prisma) - Database schema
            
            ## 💡 Next Steps
            
            Once the setup is complete:
            1. Visit http://localhost:3000
            2. Click "Sign in with Google"
            3. Start building your authenticated app!
            
            Happy coding! 🚀
            """
            
        case "fullstack-database":
            welcomeContent = """
            # 🎉 Welcome to Your Full-Stack Database Project!
            
            ## 🚀 Auto-Setup in Progress...
            
            The following tasks are running automatically:
            1. ✓ Installing server dependencies
            2. ✓ Installing client dependencies
            3. ✓ Starting PostgreSQL with Docker
            4. ✓ Running database migrations
            5. ✓ Starting backend server (port 5000)
            6. ✓ Starting frontend (port 3000)
            7. ✓ Opening your browser
            
            ## 📋 Quick Start Commands
            
            ```bash
            # View database
            npx prisma studio
            
            # Seed database with sample data
            npm run prisma:seed
            
            # View Docker containers
            docker ps
            ```
            
            ## 🔑 Default Login Credentials
            
            After seeding the database:
            - **Admin**: admin@example.com / password123
            - **User**: user@example.com / password123
            
            ## 🎯 Quick Links
            
            ### Backend:
            - [server/index.js](server/index.js) - Express server
            - [server/routes/](server/routes/) - API routes
            - [server/controllers/](server/controllers/) - Business logic
            - [prisma/schema.prisma](prisma/schema.prisma) - Database schema
            
            ### Frontend:
            - [client/pages/Dashboard.jsx](client/pages/Dashboard.jsx) - Main dashboard
            - [client/services/api.js](client/services/api.js) - API client
            - [client/components/](client/components/) - React components
            
            ## 🧪 API Endpoints
            
            - `POST /api/users/register` - Register new user
            - `POST /api/users/login` - Login
            - `GET /api/products` - Get all products
            - `POST /api/orders` - Create order
            
            ## 💡 Next Steps
            
            1. Seed the database: `npm run prisma:seed`
            2. Visit http://localhost:3000
            3. Login with default credentials
            4. Explore the dashboard!
            
            Happy coding! 🚀
            """
            
        default:
            welcomeContent = """
            # 🎉 Welcome to Your New Project!
            
            ## 🚀 Auto-Setup in Progress...
            
            Dependencies are being installed automatically.
            Once complete, your development server will start.
            
            ## 💡 Next Steps
            
            1. Explore the project structure
            2. Modify the code to fit your needs
            3. Build something amazing!
            
            Happy coding! 🚀
            """
        }
        
        let welcomePath = (projectPath as NSString).appendingPathComponent("WELCOME.md")
        try welcomeContent.write(toFile: welcomePath, atomically: true, encoding: .utf8)
        
        // Create launch.json for debugging
        let launchContent = """
        {
          "version": "0.2.0",
          "configurations": [
            {
              "name": "Next.js: debug server-side",
              "type": "node-terminal",
              "request": "launch",
              "command": "npm run dev"
            },
            {
              "name": "Next.js: debug client-side",
              "type": "chrome",
              "request": "launch",
              "url": "http://localhost:3000"
            },
            {
              "name": "Next.js: debug full stack",
              "type": "node-terminal",
              "request": "launch",
              "command": "npm run dev",
              "serverReadyAction": {
                "pattern": "started server on .+, url: (https?://.+)",
                "uriFormat": "%s",
                "action": "debugWithChrome"
              }
            }
          ]
        }
        """
        
        let launchPath = (vscodeDir as NSString).appendingPathComponent("launch.json")
        try launchContent.write(toFile: launchPath, atomically: true, encoding: .utf8)
    }
    
    private static func isVercelCompatibleTemplate(_ template: Template) -> Bool {
        let vercelCompatibleTemplates = [
            "nextjs", "react", "vue", "vite", "gatsby", "nuxt",
            "ecommerce", "blog", "nextjs-google-auth", "fullstack"
        ]
        
        return vercelCompatibleTemplates.contains { template.name.lowercased().contains($0) }
    }
    
    private static func createVercelConfig(for template: Template, at projectPath: String) throws {
        var vercelConfig = """
        {
          "framework": null,
          "buildCommand": null,
          "devCommand": null,
          "installCommand": null,
          "outputDirectory": null
        }
        """
        
        // Customize based on template type
        if template.name.lowercased().contains("nextjs") {
            vercelConfig = """
            {
              "framework": "nextjs",
              "buildCommand": "next build",
              "devCommand": "next dev",
              "installCommand": "npm install",
              "outputDirectory": ".next"
            }
            """
        } else if template.name.lowercased().contains("vite") || template.name.lowercased().contains("react") {
            vercelConfig = """
            {
              "framework": "vite",
              "buildCommand": "vite build",
              "devCommand": "vite",
              "installCommand": "npm install",
              "outputDirectory": "dist"
            }
            """
        } else if template.name.lowercased().contains("vue") {
            vercelConfig = """
            {
              "framework": "vue",
              "buildCommand": "npm run build",
              "devCommand": "npm run dev",
              "installCommand": "npm install",
              "outputDirectory": "dist"
            }
            """
        }
        
        // Write vercel.json file
        let vercelPath = (projectPath as NSString).appendingPathComponent("vercel.json")
        try vercelConfig.write(toFile: vercelPath, atomically: true, encoding: .utf8)
    }
    
    // MARK: - Template Variable Support
    
    private static func applyTemplateVariables(content: String, variables: [String: String]) -> String {
        var result = content
        for (key, value) in variables {
            result = result.replacingOccurrences(of: key, with: value)
        }
        return result
    }
}

// MARK: - String Extensions

extension String {
    func kebabCased() -> String {
        return self
            .replacingOccurrences(of: " ", with: "-")
            .replacingOccurrences(of: "_", with: "-")
            .lowercased()
    }
    
    func pascalCased() -> String {
        return self
            .split(separator: " ")
            .map { $0.capitalized }
            .joined()
            .replacingOccurrences(of: "-", with: "")
            .replacingOccurrences(of: "_", with: "")
    }
}