# Vite Contribution Guidelines

This is a TypeScript project that implements a frontend build tooling called Vite. Please follow these guidelines when contributing.

## Code Standards

- Run `pnpm run lint` to ensure your code adheres to the code standards
- Run `pnpm run format` to format your code
- **Build:** `pnpm run build`
- **Test:** `pnpm run test` (uses Vitest and Playwright)

## Repository Structure

- `docs/` — Documentation
- `packages/create-vite` — The `create-vite` command source code
- `packages/plugin-legacy` — The `@vitejs/plugin-legacy` plugin source code
- `packages/vite` — The Vite core source code
- `playground/` — E2E tests

## PR Guidelines

### PR Title & Commit Messages

- Follow the [commit message convention](./commit-convention.md)

### PR Description

- **Problem/Feature:** Clear description of what this PR solves
- **Implementation Rationale:** Why was this approach chosen?
- **New Features:** Include a convincing reason for the feature
- **New Config Options:** Verify the problem can't be solved with smarter defaults, existing options, or a plugin
- **Bug Fixes:** Explain what caused the bug and link to relevant code if possible

### Code Style & Standards

- Code follows TypeScript best practices
- Maintains existing code structure and organization
- Comments explain *why*, not *what*

### Testing

- Prefer unit tests when the feature can be tested without mocks
- Add E2E tests in the `playground/` directory

### Documentation

- Update documentation for public API changes
- Place documentation changes in the `docs/` folder

### Other Considerations

- No concerning performance impacts
- Consider backward compatibility
