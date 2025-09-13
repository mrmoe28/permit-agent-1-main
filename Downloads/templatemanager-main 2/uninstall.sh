#!/bin/bash

# Template Manager Uninstaller
# Removes Template Manager and associated files from macOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="Template Manager"
BUNDLE_NAME="TemplateManager"
BUNDLE_ID="com.ekodevapps.TemplateManager"

print_header() {
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║    Template Manager Uninstaller       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

confirm_uninstall() {
    echo -e "${YELLOW}This will remove Template Manager from your system.${NC}"
    echo ""
    echo "The following will be removed:"
    echo "  • Template Manager application"
    echo "  • Application support files"
    echo "  • Temporary files and caches"
    echo ""
    echo -e "${GREEN}The following will be preserved:${NC}"
    echo "  • Your project history"
    echo "  • Application preferences/settings"
    echo ""
    
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Uninstall cancelled"
        exit 0
    fi
}

remove_application() {
    print_info "Removing application..."
    
    # Check common installation locations
    local locations=(
        "/Applications/$BUNDLE_NAME.app"
        "$HOME/Applications/$BUNDLE_NAME.app"
        "/Applications/Template Manager.app"
        "$HOME/Applications/Template Manager.app"
    )
    
    local found=false
    for location in "${locations[@]}"; do
        if [ -d "$location" ]; then
            print_info "Found at: $location"
            rm -rf "$location"
            print_success "Removed application"
            found=true
        fi
    done
    
    if [ "$found" = false ]; then
        print_warning "Application not found in standard locations"
    fi
}

remove_support_files() {
    print_info "Removing support files..."
    
    # Application Support
    local app_support="$HOME/Library/Application Support/$BUNDLE_NAME"
    if [ -d "$app_support" ]; then
        rm -rf "$app_support"
        print_success "Removed application support files"
    fi
    
    # Caches
    local cache_locations=(
        "$HOME/Library/Caches/$BUNDLE_ID"
        "$HOME/Library/Caches/$BUNDLE_NAME"
    )
    
    for cache in "${cache_locations[@]}"; do
        if [ -d "$cache" ]; then
            rm -rf "$cache"
            print_success "Removed cache: $(basename "$cache")"
        fi
    done
    
    # Logs
    local log_locations=(
        "$HOME/Library/Logs/$BUNDLE_ID"
        "$HOME/Library/Logs/$BUNDLE_NAME"
    )
    
    for log_dir in "${log_locations[@]}"; do
        if [ -d "$log_dir" ]; then
            rm -rf "$log_dir"
            print_success "Removed logs: $(basename "$log_dir")"
        fi
    done
    
    # Saved Application State
    local saved_state="$HOME/Library/Saved Application State/$BUNDLE_ID.savedState"
    if [ -d "$saved_state" ]; then
        rm -rf "$saved_state"
        print_success "Removed saved application state"
    fi
    
    # WebKit Data
    local webkit_data="$HOME/Library/WebKit/$BUNDLE_ID"
    if [ -d "$webkit_data" ]; then
        rm -rf "$webkit_data"
        print_success "Removed WebKit data"
    fi
}

remove_preferences() {
    read -p "Remove preferences and settings? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing preferences..."
        
        # Preferences plist
        local pref_file="$HOME/Library/Preferences/$BUNDLE_ID.plist"
        if [ -f "$pref_file" ]; then
            rm -f "$pref_file"
            print_success "Removed preferences file"
        fi
        
        # Also remove from defaults
        defaults delete "$BUNDLE_ID" 2>/dev/null || true
        
        # Remove from containers if exists
        local container="$HOME/Library/Containers/$BUNDLE_ID"
        if [ -d "$container" ]; then
            rm -rf "$container"
            print_success "Removed container data"
        fi
    else
        print_info "Preferences preserved"
    fi
}

remove_project_history() {
    read -p "Remove project history? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing project history..."
        
        # Project history is stored in UserDefaults
        defaults delete "$BUNDLE_ID" "com.templatemanager.projectHistory" 2>/dev/null || true
        print_success "Removed project history"
    else
        print_info "Project history preserved"
    fi
}

check_running() {
    # Check if Template Manager is running
    if pgrep -x "$BUNDLE_NAME" > /dev/null; then
        print_warning "Template Manager is currently running"
        read -p "Quit Template Manager and continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pkill -x "$BUNDLE_NAME" || true
            sleep 2
        else
            print_error "Please quit Template Manager before uninstalling"
            exit 1
        fi
    fi
}

final_cleanup() {
    print_info "Performing final cleanup..."
    
    # Remove from Launch Services database
    /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
        -u -f "/Applications/$BUNDLE_NAME.app" 2>/dev/null || true
    
    # Clear icon cache
    rm -rf "$HOME/Library/Caches/com.apple.IconServices" 2>/dev/null || true
    
    # Kill cfprefsd to ensure preference changes take effect
    killall cfprefsd 2>/dev/null || true
    
    print_success "Final cleanup complete"
}

show_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Template Manager has been uninstalled ${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    
    if [ -f "$HOME/Library/Preferences/$BUNDLE_ID.plist" ]; then
        print_info "Settings preserved at:"
        echo "  $HOME/Library/Preferences/$BUNDLE_ID.plist"
        echo ""
    fi
    
    print_info "To reinstall Template Manager:"
    echo "  curl -fsSL https://raw.githubusercontent.com/mrmoe28/templatemanager/main/install.sh | bash"
    echo ""
    
    print_success "Uninstall complete!"
}

# Main uninstall process
main() {
    print_header
    check_running
    confirm_uninstall
    
    remove_application
    remove_support_files
    remove_preferences
    remove_project_history
    final_cleanup
    
    show_summary
}

# Run main function
main "$@"