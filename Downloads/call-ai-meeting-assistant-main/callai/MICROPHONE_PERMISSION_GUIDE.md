# Microphone Permission Guide for CallAI

## Current Status
Based on your debug logs:
- ✅ **Calendar Access**: Granted (Full Access)
- ❌ **Microphone Access**: Denied
- ✅ **Info.plist Keys**: All present and correct

## How to Fix Microphone Permission

### Method 1: System Settings (Recommended)
1. **Open System Settings**
2. **Go to Privacy & Security → Microphone**
3. **Find "CallAI" in the list**
4. **Toggle it ON**
5. **Restart the CallAI app**

### Method 2: Reset All Permissions (If Method 1 doesn't work)
1. **Open Terminal**
2. **Run this command to reset microphone permissions:**
   ```bash
   tccutil reset Microphone com.yourcompany.callai
   ```
   (Replace `com.yourcompany.callai` with your actual bundle identifier)

3. **Restart the CallAI app**
4. **Grant permission when prompted**

### Method 3: Reset All App Permissions
1. **Open Terminal**
2. **Run this command:**
   ```bash
   tccutil reset All com.yourcompany.callai
   ```
3. **Restart the CallAI app**
4. **Grant all permissions when prompted**

## What the App Now Shows

### When Microphone is Denied:
- **Clear error message** with step-by-step instructions
- **"Open System Settings" button** that takes you directly to microphone settings
- **"Check Again" button** to re-check permission status
- **Visual indicators** showing the permission is denied

### When Microphone is Granted:
- **"Ready to Record" status** when a meeting is selected
- **Active record button** that can start recording
- **No permission prompts** cluttering the interface

## Testing the Fix

1. **Grant microphone permission** using one of the methods above
2. **Open CallAI**
3. **Go to the Recording tab**
4. **You should see:**
   - No red permission banner
   - "Ready to Record" status (if meeting is selected)
   - Active record button

## Debug Information

The app includes comprehensive debug logging:
- **Permission status changes** are logged
- **Info.plist key validation** is performed
- **Permission request attempts** are tracked
- **User responses** are recorded

## Common Issues

### Issue: Permission dialog doesn't appear
**Solution**: The permission was likely denied before. Use Method 2 or 3 above to reset.

### Issue: Permission granted but app still shows denied
**Solution**: Restart the app after granting permission.

### Issue: "Check Again" button doesn't work
**Solution**: Use the "Open System Settings" button instead and manually toggle the permission.

## Bundle Identifier
To find your app's bundle identifier:
1. **Open Xcode**
2. **Select your project**
3. **Go to the "General" tab**
4. **Look for "Bundle Identifier"**

Or check the Info.plist file for `CFBundleIdentifier`.

---

*This guide will help you resolve microphone permission issues and get CallAI recording properly.*
