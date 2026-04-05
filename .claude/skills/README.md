# Claude Skills for My ID Backend

This directory contains specialized skills for AI agents working with the NestJS authentication template.

## Available Skills

### 1. nestjs-template-usage.md

**Use this for:**
- Setting up new projects based on this template
- Extending authentication features (OAuth, refresh tokens, password reset)
- Creating new modules following the established patterns
- Understanding the standardized API response format
- Implementing role-based access control (RBAC)
- Working with TypeORM entities and repositories
- Docker and deployment tasks

**Key Sections:**
- Template Architecture
- Authentication System Extension
- Database Patterns
- Creating New Modules
- API Response Patterns
- Swagger Documentation
- Testing Patterns
- Common Tasks (roles, soft delete, file upload)

### 2. nestjs-authentication/ (Built-in)

Core authentication skill from Claude Code.

### 3. nestjs-guards-interceptors/ (Built-in)

Guards and interceptors skill from Claude Code.

### 4. nestjs-modules-services-controllers/ (Built-in)

Module architecture skill from Claude Code.

## Quick Reference

### For New Feature Development

1. Read `nestjs-template-usage.md`
2. Follow "Creating New Modules" section
3. Use "API Response Patterns" for consistency
4. Reference "Testing Patterns" for test structure

### For Authentication Extension

1. Read Authentication System section
2. Follow OAuth or Refresh Token patterns
3. Update User entity as needed
4. Add corresponding tests

### For Database Changes

1. Reference "Database Patterns"
2. Follow TypeORM best practices
3. Update DTOs and services
4. Consider migrations for production

## Template Highlights

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT + Passport |
| Database | PostgreSQL + TypeORM |
| API Docs | Swagger/OpenAPI |
| Response Format | Standardized `{message, data, timestamp, path}` |
| Guards | Global JWT + Roles |
| Testing | Jest + Supertest + SQLite |
| Docker | Multi-stage + Compose |

## Getting Started

See the main `README.md` in project root for:
- Installation instructions
- Quick start guide
- API documentation
- Environment configuration
