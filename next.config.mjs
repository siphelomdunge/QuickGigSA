const nextConfig = {
  reactStrictMode: true,
  // Let phones/tablets on the same Wi-Fi open the dev server (http://<laptop-ip>:3000).
  // Next 16 otherwise blocks its own scripts/HMR from non-localhost origins. Dev only; ignored in production.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*', '172.17.*.*', '172.18.*.*', '172.19.*.*', '172.2*.*.*', '172.30.*.*', '172.31.*.*', '*.local'],
};

export default nextConfig;
