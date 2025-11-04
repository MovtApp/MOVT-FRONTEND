# SPARK AI Agent - Development Guide

## Introduction

SPARK is your custom AI coding assistant for the MOVT project. This guide explains how to effectively use SPARK to enhance your development workflow.

## Getting Started with SPARK

### In Cursor Editor

1. Open your Cursor editor with the MOVT project
2. SPARK will automatically load with the project-specific context
3. You can now ask SPARK to help with coding tasks, debugging, or architectural decisions

### Using SPARK for Different Tasks

#### Code Generation

```
Example: "SPARK, create a new screen component for user profile"
```

#### Problem Solving

```
Example: "SPARK, help me fix this TypeScript error in App.tsx"
```

#### Architecture Planning

```
Example: "SPARK, suggest a component structure for the dashboard screen"
```

#### Code Optimization

```
Example: "SPARK, optimize this function for better performance"
```

## SPARK's Understanding of MOVT Project

### Core Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development environment and native APIs
- **TypeScript**: Type safety and development experience
- **NativeWind**: Tailwind CSS for React Native styling
- **ESLint & Prettier**: Code quality and formatting

### Project Structure

```
MOVT/
├── App.tsx                 # Main application component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # NativeWind configuration
├── global.css             # Global styles
├── components.json        # Component library config
├── babel.config.js        # Babel configuration
├── metro.config.cjs       # Metro bundler configuration
├── .expo/                 # Expo build artifacts (ignored)
└── .cursor/               # SPARK agent configuration
    ├── SPARK_AGENT.md
    ├── settings.json
    └── cursor_prompt.md
```

## Best Practices When Working with SPARK

### 1. Context-Rich Requests

Provide sufficient context when asking for help:

- Reference specific files or components
- Mention the desired outcome
- Note any constraints or requirements

### 2. Iterative Development

- Start with high-level planning
- Get SPARK's input on architecture
- Implement components with SPARK's guidance
- Refactor and optimize with SPARK's suggestions

### 3. Quality Assurance

- Always have SPARK explain testing approaches
- Ask for edge cases and error handling
- Request performance considerations
- Verify security implications

## Common SPARK Commands & Prompts

### Component Creation

```
"Create a reusable button component with NativeWind styling"
"Generate a form component with validation for user input"
```

### Debugging Assistance

```
"Explain why this error is occurring in my navigation"
"Help me optimize this component that's causing performance issues"
```

### Refactoring

```
"Refactor this hook to follow React best practices"
"Suggest improvements to this API integration"
```

### Testing

```
"Write unit tests for this utility function"
"Suggest a testing strategy for this component"
```

## Integration with Development Workflow

### Pre-commit Workflow

1. Write code with SPARK's assistance
2. Ask SPARK to review for best practices
3. Request proper error handling and edge cases
4. Verify code follows project standards

### Code Review Preparation

- Ask SPARK to identify potential improvements
- Request security and performance considerations
- Verify accessibility compliance
- Check for proper TypeScript usage

## SPARK's Problem-Solving Approach

### For New Features

1. **Analyze Requirements**: Understand what needs to be built
2. **Architectural Planning**: Suggest the best approach
3. **Implementation**: Generate clean, efficient code
4. **Testing Strategy**: Propose how to test the feature
5. **Optimization**: Suggest performance improvements

### For Bug Fixes

1. **Root Cause Analysis**: Identify what's causing the issue
2. **Impact Assessment**: Understand the scope of the problem
3. **Solution Implementation**: Fix the bug while minimizing side effects
4. **Verification**: Suggest ways to prevent similar issues

### For Performance Issues

1. **Performance Analysis**: Identify bottlenecks
2. **Solution Proposals**: Suggest optimization strategies
3. **Implementation**: Apply performance improvements
4. **Validation**: Recommend ways to measure improvements

## Working with SPARK Effectively

### Good Questions

- "How should I structure this complex component?"
- "What's the best way to handle this API integration?"
- "Can you explain why this TypeScript error is occurring?"
- "How can I make this screen more accessible?"

### Better Results

- Be specific about the desired outcome
- Mention any constraints or requirements
- Reference existing code patterns when applicable
- Ask for multiple approaches when considering alternatives

## Maintaining Code Quality

SPARK is configured to help maintain high code quality by:

- Enforcing TypeScript best practices
- Suggesting performance optimizations
- Recommending accessibility improvements
- Following React Native and Expo best practices
- Maintaining consistency with existing project patterns

## Troubleshooting SPARK

If SPARK doesn't provide expected results:

1. Ensure your cursor is over relevant code when asking questions
2. Provide more context about the specific problem
3. Break complex requests into smaller, focused questions
4. Verify that the file is properly saved and indexed

## Contributing to SPARK

To improve SPARK's effectiveness:

1. Update the context files in `.cursor/` when project changes significantly
2. Share feedback on helpful or unhelpful suggestions
3. Contribute to the agent's prompt files as needed
4. Report any inconsistencies in SPARK's responses
