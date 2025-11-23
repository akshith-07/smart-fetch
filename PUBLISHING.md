# Publishing Guide

This guide is for package maintainers who want to publish new versions of smart-fetch to npm.

## Prerequisites

1. **npm Account**: You need an npm account with publish permissions
2. **Two-Factor Authentication**: Enable 2FA on your npm account
3. **npm Token**: Create an npm token for CI/CD (if using GitHub Actions)

## Pre-Release Checklist

Before publishing a new version, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linter passes: `npm run lint`
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Examples are tested
- [ ] README.md reflects new changes
- [ ] Package.json version is bumped

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backwards compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

## Manual Publishing

### 1. Update Version

```bash
# For a patch release (bug fixes)
npm version patch

# For a minor release (new features)
npm version minor

# For a major release (breaking changes)
npm version major
```

This will:
- Update version in `package.json`
- Create a git commit
- Create a git tag

### 2. Update CHANGELOG.md

Edit `CHANGELOG.md` and move items from `[Unreleased]` to a new version section:

```markdown
## [1.0.1] - 2025-11-23

### Fixed
- Fixed caching bug in IndexedDB adapter

### Added
- New retry strategy option
```

### 3. Commit Changes

```bash
git add CHANGELOG.md
git commit -m "chore: update changelog for v1.0.1"
```

### 4. Build and Test

```bash
# Clean previous builds
npm run clean

# Build the package
npm run build

# Run all tests
npm test

# Check bundle size
npm pack
du -h *.tgz
```

### 5. Publish to npm

```bash
# Dry run (test publish without actually publishing)
npm publish --dry-run

# Publish to npm
npm publish --access public

# For beta releases
npm publish --tag beta
```

### 6. Push to GitHub

```bash
git push origin main
git push origin --tags
```

### 7. Create GitHub Release

1. Go to https://github.com/akshith-07/smart-fetch/releases
2. Click "Draft a new release"
3. Select the version tag
4. Copy changelog entries for this version
5. Publish the release

## Automated Publishing (GitHub Actions)

We have a GitHub Action that automatically publishes to npm when you create a GitHub release.

### Setup

1. **Create npm Token**:
   ```bash
   npm login
   npm token create --access=public
   ```

2. **Add Token to GitHub Secrets**:
   - Go to repository Settings → Secrets → Actions
   - Add new secret: `NPM_TOKEN`
   - Paste your npm token

3. **Create Release**:
   - Push version tag: `git push origin v1.0.1`
   - Create GitHub release from tag
   - GitHub Actions will automatically publish to npm

## Beta/Alpha Releases

For pre-release versions:

```bash
# Update version to beta
npm version prerelease --preid=beta
# Results in: 1.0.1-beta.0

# Publish with beta tag
npm publish --tag beta

# Users can install beta version
npm install smart-fetch@beta
```

## Rollback

If you need to rollback a published version:

```bash
# Deprecate a version
npm deprecate smart-fetch@1.0.1 "This version has critical bugs, use 1.0.2"

# Note: You cannot unpublish versions after 72 hours
# You can only deprecate them
```

## Post-Release

After publishing:

1. **Announce**: Share on social media, relevant forums
2. **Monitor**: Watch for issues in GitHub Issues
3. **Support**: Respond to questions in Discussions
4. **Update**: Keep dependencies up to date

## Troubleshooting

### "You must be logged in to publish packages"

```bash
npm login
npm whoami  # Verify you're logged in
```

### "You do not have permission to publish"

Ensure you're a collaborator on the npm package or create a new scoped package:
```bash
npm publish --access public
```

### "Version already exists"

You're trying to publish a version that already exists. Bump the version:
```bash
npm version patch
```

### Build failures

```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Security

- Never commit npm tokens to git
- Use npm's automation tokens for CI/CD
- Enable 2FA on npm account
- Regularly audit dependencies: `npm audit`

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Questions?

Open an issue or discussion on GitHub if you have questions about publishing.
