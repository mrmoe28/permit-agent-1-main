#!/usr/bin/env swift

import Foundation
import AppKit
import CoreGraphics

// Enhanced Icon generator for Template Manager with modern design elements
class IconGenerator {
    static func drawIcon(in context: CGContext, size: CGSize) {
        let bounds = CGRect(origin: .zero, size: size)
        
        // Modern gradient with multiple stops for depth
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let colors = [
            CGColor(red: 0.39, green: 0.40, blue: 0.95, alpha: 1.0),  // #6366F1 - Modern indigo
            CGColor(red: 0.23, green: 0.51, blue: 0.96, alpha: 1.0),  // #3B82F6 - Bright blue
            CGColor(red: 0.06, green: 0.71, blue: 0.84, alpha: 1.0)   // #06B6D4 - Cyan accent
        ] as CFArray
        
        let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0, 0.6, 1])!
        
        // Draw rounded rectangle background with glassmorphism
        let cornerRadius = size.width * 0.22
        let backgroundPath = CGPath(roundedRect: bounds, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
        
        context.saveGState()
        context.addPath(backgroundPath)
        context.clip()
        
        // Main gradient
        context.drawLinearGradient(gradient, start: CGPoint(x: 0, y: 0), end: CGPoint(x: size.width, y: size.height), options: [])
        
        // Add subtle inner highlight for glassmorphism
        let highlightPath = CGPath(roundedRect: CGRect(x: 0, y: 0, width: size.width, height: size.height * 0.4), 
                                 cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
        context.saveGState()
        context.addPath(highlightPath)
        context.clip()
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.15)
        context.fill(bounds)
        context.restoreGState()
        
        context.restoreGState()
        
        // Draw template layers with modern glassmorphism effects
        let templateWidth = size.width * 0.52
        let templateHeight = size.height * 0.58
        let centerX = size.width * 0.5
        let centerY = size.height * 0.48
        
        // Back layer with enhanced shadow
        context.saveGState()
        context.setShadow(offset: CGSize(width: 0, height: size.width * 0.02), blur: size.width * 0.04, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.3))
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.15)
        let backRect = CGRect(x: centerX - templateWidth/2 + size.width * 0.06, 
                              y: centerY - templateHeight/2 - size.height * 0.06, 
                              width: templateWidth, 
                              height: templateHeight)
        let backPath = CGPath(roundedRect: backRect, cornerWidth: size.width * 0.06, cornerHeight: size.width * 0.06, transform: nil)
        context.addPath(backPath)
        context.fillPath()
        context.restoreGState()
        
        // Middle layer with glassmorphism
        context.saveGState()
        context.setShadow(offset: CGSize(width: 0, height: size.width * 0.015), blur: size.width * 0.03, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.25))
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.25)
        let midRect = CGRect(x: centerX - templateWidth/2 + size.width * 0.03, 
                             y: centerY - templateHeight/2 - size.height * 0.03, 
                             width: templateWidth, 
                             height: templateHeight)
        let midPath = CGPath(roundedRect: midRect, cornerWidth: size.width * 0.06, cornerHeight: size.width * 0.06, transform: nil)
        context.addPath(midPath)
        context.fillPath()
        context.restoreGState()
        
        // Front layer with glassmorphism and inner highlight
        context.saveGState()
        context.setShadow(offset: CGSize(width: 0, height: size.width * 0.01), blur: size.width * 0.02, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.2))
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.9)
        let frontRect = CGRect(x: centerX - templateWidth/2, 
                               y: centerY - templateHeight/2, 
                               width: templateWidth, 
                               height: templateHeight)
        let frontPath = CGPath(roundedRect: frontRect, cornerWidth: size.width * 0.06, cornerHeight: size.width * 0.06, transform: nil)
        context.addPath(frontPath)
        context.fillPath()
        
        // Add inner highlight for glassmorphism effect
        let highlightRect = CGRect(x: frontRect.minX + size.width * 0.02, 
                                  y: frontRect.minY + size.height * 0.02, 
                                  width: frontRect.width - size.width * 0.04, 
                                  height: frontRect.height * 0.3)
        let innerHighlightPath = CGPath(roundedRect: highlightRect, cornerWidth: size.width * 0.03, cornerHeight: size.width * 0.03, transform: nil)
        context.saveGState()
        context.addPath(innerHighlightPath)
        context.clip()
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.3)
        context.fill(highlightRect)
        context.restoreGState()
        
        context.restoreGState()
        
        // Draw modern document content with syntax highlighting
        context.saveGState()
        
        // Code brackets for modern look
        let bracketSize = size.width * 0.08
        let bracketY = centerY - templateHeight/2 + size.height * 0.15
        context.setFillColor(red: 0.39, green: 0.40, blue: 0.95, alpha: 0.8)
        
        // Left bracket
        let leftBracket = CGRect(x: centerX - templateWidth/2 + size.width * 0.08, 
                                y: bracketY, 
                                width: bracketSize * 0.3, 
                                height: bracketSize)
        context.fill(leftBracket)
        
        // Right bracket
        let rightBracket = CGRect(x: centerX + templateWidth/2 - size.width * 0.08 - bracketSize * 0.3, 
                                 y: bracketY, 
                                 width: bracketSize * 0.3, 
                                 height: bracketSize)
        context.fill(rightBracket)
        
        // Modern code lines with varying colors
        let lineWidth = templateWidth * 0.6
        let lineHeight = size.height * 0.025
        let lineSpacing = templateHeight / 6
        
        let lineColors = [
            (red: 0.39, green: 0.40, blue: 0.95, alpha: 0.7),  // Indigo
            (red: 0.06, green: 0.71, blue: 0.84, alpha: 0.7),  // Cyan
            (red: 0.34, green: 0.84, blue: 0.49, alpha: 0.7)   // Green
        ]
        
        for i in 0..<3 {
            let lineY = centerY - templateHeight/2 + lineSpacing * CGFloat(i + 2)
            let lineRect = CGRect(x: centerX - lineWidth/2, y: lineY, width: lineWidth, height: lineHeight)
            let color = lineColors[i % lineColors.count]
            context.setFillColor(red: color.red, green: color.green, blue: color.blue, alpha: color.alpha)
            context.fill(lineRect)
        }
        
        // Add subtle grid pattern
        context.setStrokeColor(red: 0.39, green: 0.40, blue: 0.95, alpha: 0.1)
        context.setLineWidth(0.5)
        let gridSpacing = size.width * 0.05
        for i in 1..<Int(size.width / gridSpacing) {
            let x = CGFloat(i) * gridSpacing
            context.move(to: CGPoint(x: x, y: frontRect.minY))
            context.addLine(to: CGPoint(x: x, y: frontRect.maxY))
        }
        for i in 1..<Int(size.height / gridSpacing) {
            let y = CGFloat(i) * gridSpacing
            context.move(to: CGPoint(x: frontRect.minX, y: y))
            context.addLine(to: CGPoint(x: frontRect.maxX, y: y))
        }
        context.strokePath()
        
        context.restoreGState()
        
        // Draw modern plus symbol with glassmorphism
        let plusSize = size.width * 0.28
        let plusX = size.width * 0.68
        let plusY = size.height * 0.68
        
        // Modern plus circle with glassmorphism effect
        context.saveGState()
        context.setShadow(offset: CGSize(width: 0, height: size.width * 0.015), blur: size.width * 0.03, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.3))
        
        // Outer glow
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.9)
        context.fillEllipse(in: CGRect(x: plusX - plusSize/2, y: plusY - plusSize/2, width: plusSize, height: plusSize))
        
        // Inner highlight for glassmorphism
        let innerSize = plusSize * 0.7
        context.setFillColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.3)
        context.fillEllipse(in: CGRect(x: plusX - innerSize/2, y: plusY - innerSize/2, width: innerSize, height: innerSize))
        
        context.restoreGState()
        
        // Modern plus symbol with rounded ends
        context.saveGState()
        context.setFillColor(red: 0.39, green: 0.40, blue: 0.95, alpha: 1.0)
        let plusThickness = plusSize * 0.12
        let plusLength = plusSize * 0.45
        
        // Rounded horizontal bar
        let horizontalRect = CGRect(x: plusX - plusLength/2, y: plusY - plusThickness/2, width: plusLength, height: plusThickness)
        let horizontalPath = CGPath(roundedRect: horizontalRect, cornerWidth: plusThickness/2, cornerHeight: plusThickness/2, transform: nil)
        context.addPath(horizontalPath)
        context.fillPath()
        
        // Rounded vertical bar
        let verticalRect = CGRect(x: plusX - plusThickness/2, y: plusY - plusLength/2, width: plusThickness, height: plusLength)
        let verticalPath = CGPath(roundedRect: verticalRect, cornerWidth: plusThickness/2, cornerHeight: plusThickness/2, transform: nil)
        context.addPath(verticalPath)
        context.fillPath()
        
        context.restoreGState()
    }
    
    static func generateIcon(size: Int) -> NSImage? {
        let image = NSImage(size: CGSize(width: size, height: size))
        image.lockFocus()
        
        guard let context = NSGraphicsContext.current?.cgContext else {
            image.unlockFocus()
            return nil
        }
        
        drawIcon(in: context, size: CGSize(width: size, height: size))
        
        image.unlockFocus()
        return image
    }
    
    static func generateAllIcons() {
        let sizes = [
            (16, "16x16"),
            (32, "16x16@2x"),
            (32, "32x32"),
            (64, "32x32@2x"),
            (128, "128x128"),
            (256, "128x128@2x"),
            (256, "256x256"),
            (512, "256x256@2x"),
            (512, "512x512"),
            (1024, "512x512@2x")
        ]
        
        let outputDir = "icon.iconset"
        try? FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)
        
        for (size, name) in sizes {
            guard let icon = generateIcon(size: size) else { continue }
            
            if let tiffData = icon.tiffRepresentation,
               let bitmap = NSBitmapImageRep(data: tiffData),
               let pngData = bitmap.representation(using: .png, properties: [:]) {
                let filename = "\(outputDir)/icon_\(name).png"
                try? pngData.write(to: URL(fileURLWithPath: filename))
                print("Generated: icon_\(name).png")
            }
        }
        
        print("\nIcon set generation complete!")
        print("Now run: iconutil -c icns icon.iconset")
    }
}

// Run the generator
IconGenerator.generateAllIcons()