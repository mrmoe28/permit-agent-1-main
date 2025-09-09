# CRITICAL DEVELOPMENT RULES - NEVER VIOLATE

## 🚨 ABSOLUTE RULE: PRESERVE USER SETTINGS
**NEVER modify, overwrite, or reset user-configured settings in Xcode projects, IDEs, or development environments.**

### What This Means:
- **NEVER change DEVELOPMENT_TEAM settings** in project files
- **NEVER modify CODE_SIGN_IDENTITY** configurations
- **NEVER alter PROVISIONING_PROFILE_SPECIFIER** settings
- **NEVER reset bundle identifiers** that are already working
- **NEVER overwrite entitlements** that are properly configured

### Before Making ANY Changes:
1. **ALWAYS backup the original project file** before modifications
2. **ALWAYS ask the user** before changing any configuration settings
3. **ALWAYS preserve existing working configurations**
4. **ALWAYS explain what will be changed** and get explicit permission

### When User Reports Issues:
1. **FIRST**: Check if it's a certificate trust issue (most common)
2. **SECOND**: Check if it's a provisioning profile issue
3. **LAST RESORT**: Only modify project settings with explicit user permission

### Code Signing Issues - Standard Solutions:
1. **Certificate Trust**: Guide user to Settings → General → VPN & Device Management
2. **Provisioning Profile**: Check if profile is valid and properly installed
3. **Bundle ID Mismatch**: Only fix if there are actual hardcoded mismatches in code
4. **Development Team**: NEVER change unless user explicitly requests it

### Emergency Recovery Protocol:
If settings are accidentally modified:
1. **IMMEDIATELY restore original settings** from backup
2. **Clean and rebuild** the project
3. **Apologize and explain** what happened
4. **Focus on the actual root cause** of the original issue

## 🛡️ PROTECTION MECHANISMS:
- Always create backups before making changes
- Always ask permission before modifying configurations
- Always preserve working setups
- Always focus on the real problem, not the symptoms

## 📝 REMEMBER:
**The user's working configuration is SACRED. Never break what's already working.**

---
**This rule is PERMANENT and applies to ALL development assistance.**
**Violation of this rule is unacceptable and wastes valuable user time.**
