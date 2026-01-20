# AI Classifier Capability Delta

## MODIFIED Requirements

### Requirement: Custom tags from Nix config are used in classification

Tags defined in the Nix configuration (`ai.tags`) MUST be loaded and used by the AI classifier instead of hardcoded defaults.

#### Scenario: Custom tags loaded from config
Given: A user defines custom tags in Nix config
```nix
ai.tags = [
  { name = "work"; description = "Work emails"; }
  { name = "project-x"; description = "Project X communications"; }
];
```
When: The configuration is loaded and sync runs
Then: The classifier prompt includes "project-x" as an available tag

#### Scenario: Config tags override defaults
Given: A user defines tags in Nix config
When: The AI classifier is initialized
Then: Only the user-defined tags are used (not merged with defaults)

#### Scenario: No custom tags uses defaults
Given: No `ai.tags` is defined in Nix config
When: The AI classifier is initialized
Then: The default tag taxonomy is used

### Requirement: Classification includes confidence score

The AI classifier MUST return a confidence score (0.0-1.0) indicating how certain the model is about the classification.

#### Scenario: High confidence classification
Given: A clear work email from a known corporate domain
When: The message is classified
Then: The classification includes a confidence score >= 0.8

#### Scenario: Low confidence classification
Given: An ambiguous email that could be personal or work
When: The message is classified
Then: The classification includes a confidence score < 0.8

#### Scenario: Missing confidence from LLM
Given: The LLM response does not include a confidence value
When: The classification is parsed
Then: A default confidence of 0.8 is used

### Requirement: Model recommendations documented

The system MUST document recommended Ollama models for different hardware configurations.

#### Scenario: User with limited RAM
Given: A user has only 4GB available RAM
When: They check model recommendations
Then: phi3:mini is recommended as the default model

#### Scenario: User with mid-range hardware
Given: A user has 8GB available RAM
When: They check model recommendations
Then: mistral:7b is recommended for balanced performance

#### Scenario: User with high-end hardware
Given: A user has 16GB+ available RAM
When: They check model recommendations
Then: llama3.1:8b is recommended for best quality

## ADDED Requirements

### Requirement: Custom tag descriptions configurable

Users MUST be able to define custom tag descriptions in Nix configuration.

#### Scenario: Adding custom project tag
Given: A user adds a custom tag in Nix config
```nix
ai.customTags = [
  { name = "project-alpha"; description = "Emails about Project Alpha"; }
];
```
When: Email classification runs
Then: The custom tag is available for classification alongside default tags

#### Scenario: Overriding default tag description
Given: A user defines a tag with the same name as a default tag
When: The tags are merged
Then: The user's description takes precedence
