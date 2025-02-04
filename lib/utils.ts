export const generateAPIUrl = (relativePath: string) => {
  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',
    );
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  // Remove any leading slash from path and ensure baseUrl doesn't end with slash
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  console.log('🔗 Generating API URL:', `${cleanBaseUrl}/${cleanPath}`);
  return `${cleanBaseUrl}/${cleanPath}`;
};