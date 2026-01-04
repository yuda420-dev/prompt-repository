# HiPeR Gallery - Apple TV App

This folder contains the tvOS (Apple TV) version of HiPeR Gallery.

## Requirements

- Xcode 15+ (with tvOS SDK)
- Apple Developer Account
- macOS Sonoma or later

## Setup

1. Open `HiPerGallery.xcodeproj` in Xcode
2. Configure your Apple Developer Team in Signing & Capabilities
3. Build and run on Apple TV Simulator or device

## Features

- Browse gallery artworks on the big screen
- Navigate with Apple TV Remote (Siri Remote)
- View artwork details and series
- Favorites sync with web app (via shared API)
- Beautiful focus-based navigation
- Screensaver mode with rotating artwork

## Architecture

The app uses SwiftUI with TVML for some screens. Data is fetched from the same Supabase backend as the web app.

## Building

```bash
# From command line
xcodebuild -project HiPerGallery.xcodeproj -scheme HiPerGallery -destination 'platform=tvOS Simulator,name=Apple TV'
```

## Configuration

Update `Config.swift` with your Supabase credentials:

```swift
struct Config {
    static let supabaseURL = "YOUR_SUPABASE_URL"
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
}
```
