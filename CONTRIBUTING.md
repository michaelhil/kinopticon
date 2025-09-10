# Contributing to Kinopticon

## Development Process

### Code Standards

1. **TypeScript Only**: No JavaScript files allowed (enforced by CI)
2. **Strict Mode**: All TypeScript must pass strict mode checks
3. **Type Safety**: Explicit types required for all functions and variables
4. **No Any**: The `any` type is forbidden except with explicit justification

### Commit Process

1. Create feature branch from `main`
2. Write clean, minimal code
3. Add/update tests
4. Ensure all checks pass
5. Create pull request with clear description

### Pre-Commit Checklist

- [ ] No JavaScript files in commit
- [ ] All tests pass (`bun test`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] Architecture tests pass (`bun run test:architecture`)
- [ ] Documentation updated if needed

### Code Review Standards

All code must be reviewed before merging. Reviewers check for:

- Adherence to TypeScript-only policy
- Proper use of types (no implicit any)
- Test coverage
- Performance implications
- Architecture compliance

### Testing Requirements

- Unit tests: 90% coverage minimum
- Integration tests: Required for new features
- Performance tests: Required for physics/simulation code
- Architecture tests: Must always pass

### Documentation

- All public APIs must have JSDoc comments
- Complex algorithms need explanatory comments
- ADRs required for architectural decisions
- Update relevant documentation with changes

## Setup

See [Developer Setup Guide](docs/guides/developer-setup.md) for detailed setup instructions.

## Questions?

Create an issue for questions or clarifications about the development process.