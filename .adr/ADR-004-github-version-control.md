# ADR-004: GitHub with Git LFS for Version Control

## Status
Accepted

## Context
Kinopticon requires version control for both code and large binary assets (Unreal Engine assets, 3D models, textures). We need a solution that supports:
- Large file storage
- Team collaboration
- CI/CD integration
- Cost effectiveness

## Decision
We will use GitHub as our primary version control platform with Git LFS (Large File Storage) for binary assets.

Configuration:
- All Unreal assets tracked with Git LFS
- File locking enabled for binary files
- GitHub Actions for CI/CD
- Branch protection rules for main branch

## Consequences

### Positive
- Industry standard platform with excellent tooling
- Integrated CI/CD with GitHub Actions
- Good documentation and community support
- Free for public repositories
- Integrated issue tracking and project management
- Excellent third-party integrations

### Negative  
- Git LFS storage costs for private repositories
- 5GB file size limit (GitHub restriction)
- Monthly bandwidth limits on LFS
- Need to manage LFS quota carefully

### Neutral
- Team members need GitHub accounts
- LFS setup required on each development machine

## Alternatives Considered
1. **Azure DevOps**: Better LFS limits but less familiar to team
2. **Self-hosted GitLab**: More maintenance overhead
3. **Perforce**: Better for binary files but expensive and complex
4. **AWS CodeCommit + S3**: More complex setup

## References
- GitHub LFS documentation
- Unreal Engine version control best practices
- Git LFS configuration guide

---
*Date: 2025-01-10*  
*Deciders: Development Team*  
*Technical Story: Version control setup*