# Plan: Fix JWT Build Errors

## Context from PARA

### Standards Applied:
- **PARA/2-Areas/code-quality/standards.md**: Requires type-safe code, no hardcoded values (use config/env), consistent naming conventions
- **PARA/2-Areas/architecture/patterns.md**: Modular architecture, proper separation of concerns
- **PARA/2-Areas/security/checklist.md**: Secure session management via JWT
- **PARA/3-Resources/**: Template usage skill at `.claude/skills/nestjs-template-usage.md` provides JWT pattern examples

### Root Cause Analysis:
The build errors stem from TypeScript type incompatibilities between `@nestjs/jwt` v11.0.2 and the `jsonwebtoken` library's type definitions:

1. **Error 1 (auth.module.ts:27)**: The `signOptions.expiresIn` property in `JwtModuleOptions` expects `number | StringValue | undefined` from `jsonwebtoken.SignOptions`, but `configService.getOrThrow<string>()` returns `string`, which is not assignable to the union type.

2. **Error 2 (auth.service.ts:102-107)**: The `signAsync()` method accepts `JwtSignOptions` which extends `jwt.SignOptions`. The same type mismatch occurs when passing `expiresIn` as `string` instead of the expected union type.

The `jsonwebtoken` library defines `StringValue` as specific string literal patterns (e.g., `'15m'`, `'7d'`, `'2 days'`), not arbitrary strings. TypeScript's strict mode rejects general `string` type assignments.

## Objectives

1. Fix type mismatch in `auth.module.ts` for `JwtModule.registerAsync()` signOptions
2. Fix type mismatch in `auth.service.ts` for `jwtService.signAsync()` options
3. Ensure proper typing of `JwtPayload` interface to align with JWT standard claims
4. Maintain backward compatibility with existing token generation and validation logic
5. Preserve configuration-based token expiration (no hardcoded values)

## Tasks

### Task 1: Fix auth.module.ts Type Assertion
**File**: `src/modules/auth/auth.module.ts`
**Line**: 22-27
**Change Required**: Add type assertion for expiresIn value
**Approach**: Cast the config value to satisfy `jwt.SignOptions['expiresIn']` type
**Code Change**:
```typescript
// Before:
const expiresIn = configService.getOrThrow<string>('auth.jwtAccessExpiresIn');
return {
  secret,
  signOptions: { expiresIn },
};

// After:
const expiresIn = configService.getOrThrow<string>('auth.jwtAccessExpiresIn');
return {
  secret,
  signOptions: { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] },
};
```
**Additional Change**: Import `jwt` from 'jsonwebtoken' at top of file:
```typescript
import * as jwt from 'jsonwebtoken';
```
**References**: PARA/2-Areas/code-quality/standards.md (type safety), `.claude/skills/nestjs-template-usage.md` lines 107-108 (shows pattern)

### Task 2: Fix auth.service.ts Type Assertion
**File**: `src/modules/auth/auth.service.ts`
**Line**: 102-107
**Change Required**: Add type assertion for expiresIn in signAsync call
**Approach**: Cast the config value to `jwt.SignOptions['expiresIn']`
**Code Change**:
```typescript
// Before:
const accessToken = await this.jwtService.signAsync(payload, {
  secret: this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
  expiresIn: this.configService.getOrThrow<string>('auth.jwtAccessExpiresIn'),
});

// After:
import * as jwt from 'jsonwebtoken';
// ...
const accessToken = await this.jwtService.signAsync(payload, {
  secret: this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
  expiresIn: this.configService.getOrThrow<string>('auth.jwtAccessExpiresIn') as jwt.SignOptions['expiresIn'],
});
```
**References**: PARA/2-Areas/code-quality/standards.md (no hardcoded values), node_modules/@nestjs/jwt/dist/jwt.service.d.ts line 12 (signAsync signature)

### Task 3: Verify JwtPayload Interface Compatibility
**File**: `src/modules/auth/auth.service.ts`
**Line**: 16-20
**Current State**:
```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}
```
**Assessment**: The current `JwtPayload` interface is correct and compatible. It is imported and used in `jwt.strategy.ts` (line 5, line 26). The interface properly extends standard JWT claims (sub = subject) with application-specific fields (email, roles).
**Action Required**: No changes needed. The `signAsync<T>` generic accepts any object type extending `object` (see jwt.service.d.ts line 12).
**References**: `src/modules/auth/strategies/jwt.strategy.ts` (lines 5, 26 - shows proper usage)

### Task 4: Update Import Statements
**File**: `src/modules/auth/auth.module.ts`
**Change**: Add import for jsonwebtoken types
```typescript
import * as jwt from 'jsonwebtoken';
```
**File**: `src/modules/auth/auth.service.ts`
**Change**: Add import for jsonwebtoken types
```typescript
import * as jwt from 'jsonwebtoken';
```
**Rationale**: The `jwt.SignOptions['expiresIn']` type must be available for the type assertions to work.

## Success Criteria

- [ ] `bun run build` completes without TypeScript errors
- [ ] `bun run lint` passes (no new linting violations)
- [ ] All existing tests pass (`bun test`)
- [ ] JWT token generation continues to work correctly (tokens have correct expiration)
- [ ] JWT token validation continues to work (strategy can validate tokens)
- [ ] No hardcoded values - expiration still comes from config
- [ ] Type assertions are minimal and targeted (only where needed)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Type assertion masks future type mismatches | Low | Medium | Add comment explaining why assertion is needed; document expected config format (e.g., '15m', '7d') |
| Jsonwebtoken import causes runtime dependency issues | Low | Low | The `@nestjs/jwt` package already depends on `jsonwebtoken`; this import is type-only and won't affect runtime |
| Existing tests fail due to token format changes | Low | High | Run full test suite after fix; JWT payload structure is unchanged |
| Config value format invalid for StringValue type | Medium | High | Document valid formats in `.env.example` and auth.config.ts; add runtime validation if needed (e.g., regex for /^\d+[smhd]$/ or numeric string) |
| Breaking change in future @nestjs/jwt version | Low | Medium | Pin version in package.json; monitor changelogs for type definition changes |

## Edge Cases to Consider

1. **Empty expiresIn config**: If `JWT_ACCESS_EXPIRES_IN` is empty string, jsonwebtoken may fail at runtime
2. **Invalid format**: Values like '15minutes' (no space) vs '15 minutes' (with space) - jsonwebtoken uses `ms` library for parsing
3. **Numeric string vs actual number**: Config returns strings; '3600' vs 3600 have different behaviors
4. **Token refresh logic**: If refresh tokens are added later, same type issue will apply

## Implementation Notes

### Alternative Approaches Considered:

**Option A: Type assertion (RECOMMENDED)**
- Pros: Minimal code change, preserves config-based expiration
- Cons: Requires type assertion

**Option B: Use NumericSeconds type**
```typescript
const expiresInSeconds = parseInt(configService.getOrThrow<string>('auth.jwtAccessExpiresIn'), 10);
```
- Pros: No type assertion needed (number is valid)
- Cons: Requires config format change, loses human-readable format like '15m'

**Option C: Module augmentation**
- Pros: Fixes type globally
- Cons: Overly complex for this issue, affects all JWT usage

### Configuration Validation Recommendation:
Consider adding runtime validation in `auth.config.ts` to ensure the expiresIn value is a valid StringValue format before the application starts:
```typescript
const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
// Validate format: /^\d+[smhdw]$|^(\d+\s+(seconds?|minutes?|hours?|days?|weeks?))$/i
```

## Files Modified

1. `src/modules/auth/auth.module.ts` - Add jwt import, type assertion for expiresIn
2. `src/modules/auth/auth.service.ts` - Add jwt import, type assertion for expiresIn

## Files Verified (No Changes Needed)

1. `src/modules/auth/strategies/jwt.strategy.ts` - Already imports JwtPayload correctly
2. `src/config/auth.config.ts` - Configuration values are correct
3. `src/modules/auth/auth.service.ts` (JwtPayload interface) - Properly typed for current usage
