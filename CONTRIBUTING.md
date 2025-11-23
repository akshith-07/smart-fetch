# Contributing to smart-fetch

First off, thank you for considering contributing to smart-fetch! It's people like you that make smart-fetch such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed and what behavior you expected**
* **Include code samples and stack traces if applicable**
* **Specify your environment** (browser, Node.js version, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Explain why this enhancement would be useful**
* **List any similar features in other libraries**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** if you're adding new functionality
5. **Update documentation** if needed
6. **Run tests**: `npm test`
7. **Run linter**: `npm run lint`
8. **Build the project**: `npm run build`
9. **Commit your changes** using conventional commit messages
10. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/smart-fetch.git
cd smart-fetch

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build the project
npm run build
```

## Coding Standards

### TypeScript

* Use TypeScript for all new code
* Maintain type safety - avoid `any` when possible
* Export types for public APIs
* Document complex types with comments

### Code Style

* Use 2 spaces for indentation
* Use single quotes for strings
* Add semicolons at the end of statements
* Follow existing code patterns
* Keep functions small and focused
* Write descriptive variable and function names

### Testing

* Write tests for all new features
* Maintain or improve code coverage
* Use descriptive test names
* Follow the AAA pattern (Arrange, Act, Assert)
* Mock external dependencies

### Documentation

* Update README.md if adding user-facing features
* Update API.md for API changes
* Add JSDoc comments for public APIs
* Include code examples for new features
* Update CHANGELOG.md

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
* `feat`: New feature
* `fix`: Bug fix
* `docs`: Documentation changes
* `style`: Code style changes (formatting, etc.)
* `refactor`: Code refactoring
* `test`: Adding or updating tests
* `chore`: Maintenance tasks

Examples:
```
feat(cache): add LRU cache strategy
fix(retry): correct exponential backoff calculation
docs(readme): update installation instructions
```

## Project Structure

```
smart-fetch/
├── src/
│   ├── cache/         # Caching adapters
│   ├── core/          # Core SmartFetch class
│   ├── errors/        # Custom error classes
│   ├── graphql/       # GraphQL client
│   ├── middleware/    # Middleware system
│   ├── offline/       # Offline queue
│   ├── react/         # React hooks
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── index.ts       # Main entry point
├── examples/          # Usage examples
├── __tests__/         # Test files
└── dist/              # Build output
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Push to GitHub
5. Publish to npm

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
