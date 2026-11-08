/** Observe installed public entry points without changing targets, clocks or scheduling. */
export const observeAnimate = {
  name: "w2-observe-public-animate",
  enforce: "pre",
  transform(code, id) {
    if (!/(?:registry|components)[\\/]cadence[\\/](select|code-block|sidebar|toc)[\\/]index\.tsx$/.test(id)) return;
    const owner = id.replaceAll("\\", "/").split("/").at(-2);
    const observed = [];
    const transformed = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']motion\/react["']/g, (statement, names) => {
      const next = names.replace(/\b(animate|animateSingleValue|GroupAnimationWithThen)\b(?!\s+as\b)/g, (name) => {
        observed.push(name);
        return `${name} as installed${name}`;
      });
      return statement.replace(names, next);
    });
    if (!observed.length) return;
    return (
      transformed +
      observed
        .map((name) =>
          name === "GroupAnimationWithThen"
            ? `
class GroupAnimationWithThen extends installedGroupAnimationWithThen {
  constructor(...args) {
    super(...args);
    (window.w2groups ??= []).push({owner: ${JSON.stringify(owner)}, controls: this});
  }
}`
            : `
function ${name}(...args) {
  const controls = installed${name}(...args);
  (window.w2drivers ??= []).push({owner: ${JSON.stringify(owner)}, api: ${JSON.stringify(name)}, value: args[0], controls});
  return controls;
}`,
        )
        .join("\n")
    );
  },
};
