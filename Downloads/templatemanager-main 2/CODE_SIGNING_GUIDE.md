# Code Signing Guide for Template Manager

## Why Code Signing Matters

Without proper code signing, macOS users will see security warnings when trying to open your app. This creates friction and makes your app appear untrustworthy.

## Code Signing Options

### 1. Apple Developer Program (Recommended)

**Cost**: $99/year
**Benefits**:
- ✅ No security warnings for users
- ✅ Can notarize apps (Apple verifies malware-free)
- ✅ Distribute through Mac App Store
- ✅ Professional appearance

**Steps**:
1. Join at [developer.apple.com](https://developer.apple.com)
2. Create certificates in Xcode or Apple Developer Portal
3. Use the `build-signed.sh` script

### 2. Ad Hoc Signing (Free)

**Cost**: Free
**Benefits**:
- ✅ Reduces some security warnings
- ✅ Uses your own certificate

**Limitations**:
- ⚠️ Still shows "unidentified developer" warning
- ⚠️ Users must right-click and "Open"

### 3. Self-Signed Certificate (Free)

**Cost**: Free
**Benefits**:
- ✅ Basic code signing

**Limitations**:
- ⚠️ Still shows security warnings
- ⚠️ Users must manually allow

## Quick Start

### Option A: Use Existing Unsigned Build
```bash
# Current build (shows security warnings)
./build-universal.sh
```

### Option B: Use Signed Build (Recommended)
```bash
# Signed build (minimal warnings with Developer ID)
./build-signed.sh
```

## Setting Up Apple Developer Program

### 1. Join Apple Developer Program
- Go to [developer.apple.com](https://developer.apple.com)
- Sign up for $99/year membership
- Verify your identity

### 2. Create Certificates
**Method 1: Using Xcode**
1. Open Xcode
2. Go to Xcode → Preferences → Accounts
3. Add your Apple ID
4. Click "Manage Certificates"
5. Click "+" → "Developer ID Application"

**Method 2: Using Apple Developer Portal**
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles
3. Certificates → "+"
4. Choose "Developer ID Application"
5. Follow the CSR process

### 3. Update Build Script
Edit `build-signed.sh` and update:
```bash
DEVELOPER_ID="Developer ID Application: Your Name (TEAM_ID)"
BUNDLE_ID="com.ekodevapps.TemplateManager"
```

### 4. Build and Test
```bash
./build-signed.sh
```

## Notarization (Advanced)

For complete security (no warnings at all):

### 1. Create App-Specific Password
- Apple ID → Sign-In and Security → App-Specific Passwords
- Create password for "Template Manager Notarization"

### 2. Create Notarization Script
```bash
# notarize.sh
xcrun notarytool submit TemplateManager-1.0.0.dmg \
  --apple-id "your-email@example.com" \
  --password "app-specific-password" \
  --team-id "YOUR_TEAM_ID" \
  --wait
```

### 3. Staple the Notarization
```bash
xcrun stapler staple TemplateManager-1.0.0.dmg
```

## Troubleshooting

### "No Developer ID certificate found"
- Make sure you're enrolled in Apple Developer Program
- Create Developer ID Application certificate
- Check certificate is in Keychain Access

### "Code signing failed"
- Check certificate name matches exactly
- Ensure certificate hasn't expired
- Try: `security find-identity -p codesigning -v`

### "App still shows warnings"
- Use Developer ID Application certificate (not Development)
- Consider notarization for complete security
- Check bundle identifier is unique

## File Structure

```
TemplateManager/
├── build-universal.sh      # Unsigned build
├── build-signed.sh         # Signed build
├── CODE_SIGNING_GUIDE.md   # This guide
└── MACOS_SECURITY_FIXES.md # Security troubleshooting
```

## Cost Comparison

| Option | Cost | Security Warnings | User Experience |
|--------|------|-------------------|-----------------|
| Unsigned | Free | High | Poor |
| Self-Signed | Free | Medium | Fair |
| Ad Hoc | Free | Low | Good |
| Developer ID | $99/year | None | Excellent |
| Notarized | $99/year | None | Perfect |

## Next Steps

1. **Immediate**: Use `build-signed.sh` for better user experience
2. **Short-term**: Join Apple Developer Program
3. **Long-term**: Implement notarization for professional distribution

## Resources

- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Code Signing Best Practices](https://developer.apple.com/forums/thread/129174)
- [Notarization Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
