/**
 * Converts an artifact path to a full URL.
 * - Full URLs (http/https) are returned as-is
 * - Relative paths get a leading slash prepended
 */
export function getArtifactUrl(artifactPath: string): string {
  if (!artifactPath) return '';

  // Already a full URL (Cloudinary or other CDN)
  if (artifactPath.startsWith('http://') || artifactPath.startsWith('https://')) {
    return artifactPath;
  }

  // Relative path - ensure it starts with /
  return artifactPath.startsWith('/') ? artifactPath : `/${artifactPath}`;
}
