/** Observe public animate() handles without changing targets, clocks or scheduling. */
export const observeAnimate = {
  name: "w2-observe-public-animate",
  enforce: "pre",
  transform(code, id) {
    if (!/registry[\\/]cadence[\\/](select|code-block|sidebar)[\\/]index\.tsx$/.test(id)) return;
    if (!code.includes("import { animate,")) return;
    const owner = id.replaceAll("\\", "/").split("/").at(-2);
    return (
      code.replace("import { animate,", "import { animate as installedAnimate,") +
      `
function animate(...args) {
  const controls = installedAnimate(...args);
  (window.w2drivers ??= []).push({owner: ${JSON.stringify(owner)}, value: args[0], controls});
  return controls;
}`
    );
  },
};
