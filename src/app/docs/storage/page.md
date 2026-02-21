---
title: Storage
nextjs:
  metadata:
    title: Storage
    description: Multi-provider file upload and storage in Nestled — local, S3, Cloudinary, ImageKit, and Google Cloud Storage with GraphQL mutations.
---

Nestled includes a pluggable file upload and storage system that supports five providers. Switch between them with a single environment variable -- your application code stays the same.

---

## Quick start

### Development (no setup)

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```

Files are stored in the `./uploads` directory. This is for development only -- files are lost on restart.

### Production

Pick a provider and set the credentials:

```env
# AWS S3
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
```

```env
# Cloudinary
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

```env
# ImageKit
STORAGE_PROVIDER=imagekit
IMAGEKIT_PUBLIC_KEY=your-public-key
IMAGEKIT_PRIVATE_KEY=your-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
```

```env
# Google Cloud Storage
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project
GCS_BUCKET=your-bucket
GCS_KEY_FILE=./path-to-service-account-key.json
```

---

## Providers

| Provider   | Best for              | Key features                                                |
| ---------- | --------------------- | ----------------------------------------------------------- |
| Local      | Development           | Zero config, file system storage                            |
| S3         | General production    | Presigned URLs, S3-compatible (MinIO, DigitalOcean Spaces)  |
| Cloudinary | Image-heavy apps      | Automatic optimization, on-the-fly transforms, built-in CDN |
| ImageKit   | Image-heavy apps      | Real-time optimization, smart cropping, CDN delivery        |
| GCS        | Google Cloud projects | Signed URLs, Google ecosystem integration                   |

All providers implement the same `IStorageService` interface, so you can switch providers without changing application code.

---

## Architecture

```text
libs/api/integrations/src/lib/storage/
  interfaces/               # Shared interface for all providers
  providers/
    local-storage.service.ts
    s3-storage.service.ts
    cloudinary-storage.service.ts
    imagekit-storage.service.ts
    gcs-storage.service.ts

libs/api/custom/src/lib/plugins/storage/
  storage.factory.ts        # Switches providers based on STORAGE_PROVIDER
  storage.service.ts        # High-level orchestrator with database persistence
  storage.resolver.ts       # GraphQL mutations and queries
```

The **storage factory** reads `STORAGE_PROVIDER` and returns the matching provider. The **storage service** handles file management and database persistence. The **resolver** exposes everything via GraphQL.

---

## GraphQL API

### Mutations

```graphql
# Upload a file to a folder
uploadFile(file: Upload!, folder: String): Upload

# Upload a user avatar (circular crop)
uploadUserAvatar(file: Upload!): Upload

# Upload an organization logo
uploadOrganizationLogo(file: Upload!, organizationId: String!): Upload

# Delete an uploaded file
deleteFile(uploadId: String!): Boolean
```

### Queries

```graphql
# List files uploaded by the current user
userFiles(limit: Int, offset: Int): [Upload!]!

# List files for an organization
organizationFiles(organizationId: String!, limit: Int, offset: Int): [Upload!]!

# Get a signed URL for a private file
getSignedUrl(uploadId: String!, expiresIn: Int): String!
```

---

## Database schema

```prisma
enum StorageProvider {
  LOCAL
  S3
  CLOUDINARY
  IMAGEKIT
  GCS
}

model Upload {
  id             String          @id @default(uuid())
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  provider       StorageProvider
  providerFileId String
  folder         String?
  filename       String
  originalName   String
  mimeType       String
  size           Int
  url            String
  publicUrl      String?
  width          Int?
  height         Int?
  metadata       Json?
  userId         String?
  organizationId String?
  user           User?           @relation(fields: [userId], references: [id])
  organization   Organization?   @relation(fields: [organizationId], references: [id])

  @@index([userId])
  @@index([organizationId])
  @@index([provider])
}
```

---

## Environment variables reference

| Variable                  | Provider   | Description                                       |
| ------------------------- | ---------- | ------------------------------------------------- |
| `STORAGE_PROVIDER`        | All        | `local`, `s3`, `cloudinary`, `imagekit`, or `gcs` |
| `LOCAL_STORAGE_PATH`      | Local      | Directory path (default: `./uploads`)             |
| `AWS_ACCESS_KEY_ID`       | S3         | AWS access key                                    |
| `AWS_SECRET_ACCESS_KEY`   | S3         | AWS secret key                                    |
| `AWS_S3_BUCKET`           | S3         | S3 bucket name                                    |
| `AWS_S3_REGION`           | S3         | AWS region (default: `us-east-1`)                 |
| `AWS_S3_ENDPOINT`         | S3         | Custom endpoint for MinIO, DigitalOcean Spaces    |
| `AWS_S3_FORCE_PATH_STYLE` | S3         | Set to `true` for MinIO                           |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary | Cloud name                                        |
| `CLOUDINARY_API_KEY`      | Cloudinary | API key                                           |
| `CLOUDINARY_API_SECRET`   | Cloudinary | API secret                                        |
| `IMAGEKIT_PUBLIC_KEY`     | ImageKit   | Public key                                        |
| `IMAGEKIT_PRIVATE_KEY`    | ImageKit   | Private key                                       |
| `IMAGEKIT_URL_ENDPOINT`   | ImageKit   | URL endpoint                                      |
| `GCS_PROJECT_ID`          | GCS        | Google Cloud project ID                           |
| `GCS_BUCKET`              | GCS        | GCS bucket name                                   |
| `GCS_KEY_FILE`            | GCS        | Path to service account key                       |

---

## Frontend components

Nestled includes ready-to-use upload components:

- **FileUploadZone** -- drag-and-drop upload with file type validation, size limits, and progress indicators
- **AvatarUploader** -- circular crop preview for user profile photos
- **OrganizationLogoUploader** -- square crop preview for organization logos

These components use the GraphQL mutations above and are located in `libs/web-ui/src/lib/components/file-upload/`.

---

## Provider-specific features

### S3

- Public and private file support with presigned URLs
- Compatible with S3-compatible services (MinIO, DigitalOcean Spaces) via `AWS_S3_ENDPOINT`
- Automatic MIME type handling and metadata support

### Cloudinary

- Automatic image optimization and format conversion (JPEG, PNG, WebP, AVIF)
- On-the-fly transformations (resize, crop, format)
- Built-in CDN delivery

### ImageKit

- Real-time image optimization with smart cropping
- CDN delivery with URL-based transformations
- Built-in image analysis

### Google Cloud Storage

- Signed URL generation for private files
- Public and private bucket support
- Full Google Cloud ecosystem integration
