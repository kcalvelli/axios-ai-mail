# Theming Capability Delta

## ADDED Requirements

### Requirement: Light and dark themes are available

The application MUST support both light and dark color themes.

#### Scenario: Light theme appearance
Given: Light theme is active
When: The user views the application
Then: The UI uses light backgrounds with dark text

#### Scenario: Dark theme appearance
Given: Dark theme is active
When: The user views the application
Then: The UI uses dark backgrounds with light text

#### Scenario: Consistent contrast in both themes
Given: Either theme is active
When: Text is displayed over backgrounds
Then: Contrast ratio meets WCAG AA standards (4.5:1 minimum)

### Requirement: Theme can be toggled via UI control

Users MUST be able to switch themes using a visible toggle control.

#### Scenario: Theme toggle is visible
Given: The user is viewing the application
When: They look at the topbar
Then: A theme toggle button is visible (sun/moon/auto icon)

#### Scenario: Toggling from light to dark
Given: Light theme is active
When: The user clicks the theme toggle
Then: Dark theme is activated

#### Scenario: Toggling from dark to system
Given: Dark theme is active
When: The user clicks the theme toggle
Then: System preference mode is activated

#### Scenario: Three-way toggle cycle
Given: Any theme mode is active
When: The user clicks the toggle repeatedly
Then: It cycles through: Light -> Dark -> System -> Light

### Requirement: Theme preference is persisted

The selected theme preference MUST persist across browser sessions.

#### Scenario: Theme persists after refresh
Given: The user selects dark theme
When: They refresh the page
Then: Dark theme remains active

#### Scenario: Theme persists after closing browser
Given: The user selects dark theme and closes the browser
When: They reopen the application
Then: Dark theme is restored

#### Scenario: Theme syncs across tabs
Given: The user has two tabs open
When: They change theme in one tab
Then: The other tab reflects the change

### Requirement: System preference is detected and respected

When "system" mode is selected, the theme MUST follow the operating system preference.

#### Scenario: System prefers dark mode
Given: System mode is selected AND OS is set to dark mode
When: The application loads
Then: Dark theme is applied

#### Scenario: System prefers light mode
Given: System mode is selected AND OS is set to light mode
When: The application loads
Then: Light theme is applied

#### Scenario: System preference changes
Given: System mode is selected
When: The user changes their OS preference
Then: The application theme updates automatically

### Requirement: Default theme is system preference

New users MUST see the theme matching their system preference by default.

#### Scenario: First visit with dark OS preference
Given: A new user with OS dark mode enabled
When: They visit the application for the first time
Then: Dark theme is applied (following system preference)

#### Scenario: First visit with light OS preference
Given: A new user with OS light mode enabled
When: They visit the application for the first time
Then: Light theme is applied (following system preference)
