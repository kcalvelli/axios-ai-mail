# PWA Capability Delta

## ADDED Requirements

### Requirement: PWA provides Material You monochrome icon for Android

The PWA manifest MUST include monochrome icon variants for Android 13+ themed icon support.

#### Scenario: Monochrome icon in manifest
Given: The PWA manifest is fetched
When: The icons array is inspected
Then: Icons with `purpose: "monochrome"` are present at 192x192 and 512x512

#### Scenario: Monochrome icon format
Given: The monochrome icon files exist
When: They are inspected
Then: They are single-color (white) silhouettes on transparent background

#### Scenario: Android 13+ themed icon display
Given: The PWA is installed on Android 13+ with themed icons enabled
When: The user views the home screen
Then: The app icon adapts to the system color palette from wallpaper

#### Scenario: Fallback on unsupported devices
Given: The PWA is installed on a device without themed icon support
When: The user views the home screen/launcher
Then: The standard `purpose: "any"` icon is displayed

### Requirement: PWA provides maskable icons for adaptive display

The PWA manifest MUST include maskable icon variants for adaptive icon shapes.

#### Scenario: Maskable icon in manifest
Given: The PWA manifest is fetched
When: The icons array is inspected
Then: Icons with `purpose: "maskable"` are present at 192x192 and 512x512

#### Scenario: Maskable icon safe zone
Given: The maskable icon artwork is inspected
When: It is displayed in various adaptive icon shapes (circle, squircle, teardrop)
Then: Essential content fits within the 66% safe zone

## MODIFIED Requirements

### Requirement: PWA manifest icons are complete

The manifest MUST include all icon variants for optimal display across platforms.

#### Scenario: Complete icon set in manifest
Given: The PWA manifest is fetched
When: The icons array is inspected
Then: It contains:
  - 192x192 with `purpose: "any"`
  - 512x512 with `purpose: "any"`
  - 192x192 with `purpose: "maskable"`
  - 512x512 with `purpose: "maskable"`
  - 192x192 with `purpose: "monochrome"`
  - 512x512 with `purpose: "monochrome"`
