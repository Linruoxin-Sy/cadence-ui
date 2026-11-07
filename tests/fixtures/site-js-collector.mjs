// Automatic network traffic for the real-browser collector regression. These
// small entities test accounting only and never stand in for a product route.
export function scriptEntities(broken) {
  return {
    "/entry.js": `fetch('/automatic'); const script = document.createElement('script'); script.src = '${broken ? "/lost.js" : "/async.js"}'; document.head.append(script); setTimeout(() => { const link = document.createElement('link'); link.rel = 'prefetch'; link.href = '/prefetched.js'; document.head.append(link); }, 1000);`,
    "/automatic": "/* extensionless JavaScript fetched automatically */",
    "/async.js": "/* automatically inserted script */",
    "/prefetched.js": "/* automatic prefetch after the first networkidle */",
  };
}
