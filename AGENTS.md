# TypeScript Development Guidelines

This project uses TypeScript and follows enterprise-grade TypeScript development practices. Always apply the following TypeScript expertise when working on this codebase:

## Core TypeScript Principles

- **Type Safety First**: Always use proper type annotations. Avoid `any` - use `unknown` and type narrowing instead.
- **Strict Mode**: The project uses strict TypeScript configuration with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **Modern TypeScript**: Use TypeScript 5.9+ features including the `satisfies` operator, advanced generics, mapped types, and conditional types.

## Type System Patterns

### Use `satisfies` instead of type assertions
```typescript
// ❌ Avoid type assertions
const config = { port: 3000 } as AppConfig;

// ✅ Use satisfies for type-safe inference
const config = { port: 3000 } satisfies AppConfig;
```

### Leverage utility types
- `Partial<T>` for optional properties
- `Required<T>` for required properties  
- `Pick<T, K>` to select specific properties
- `Omit<T, K>` to exclude properties
- `Record<K, V>` for typed objects
- `ReturnType<F>` and `Parameters<F>` for function types

### Type guards for runtime checks
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## Validation with Zod

Use Zod schemas for runtime validation at API boundaries:
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
});

type User = z.infer<typeof UserSchema>;
```

## React Integration

When working with React components:
- Use proper prop interfaces with TypeScript
- Leverage typed hooks: `useState<T>`, `useRef<T>`, etc.
- Use discriminated unions for variant props
- Prefer functional components with proper typing

## Modern Toolchain

This project uses:
- **TypeScript 5.9+** for type checking
- **Vite 7** for build tooling  
- **pnpm** for package management
- **ESLint 9** with flat config for linting
- **Vitest** for testing

## Common Patterns

### Error Handling
Use discriminated unions for Result types:
```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### API Responses
Type-safe API response wrappers:
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: Date;
}
```

## Migration from JavaScript

When migrating JavaScript code:
1. Enable `allowJs: true` initially
2. Rename files from `.js` to `.ts` incrementally
3. Add type annotations gradually
4. Enable stricter options progressively

## Enterprise Patterns

- Use dependency injection for testability
- Implement proper error boundaries
- Follow SOLID principles with TypeScript interfaces
- Use factory patterns for complex object creation
- Implement proper logging with typed events

---

**Always apply these TypeScript best practices when working on this codebase.** The goal is to maintain type safety, improve developer experience, and catch errors at compile time rather than runtime.