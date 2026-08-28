if (window.self === window.top) {
  const params = new URLSearchParams(window.location.search);
  const destination = new URL(
    params.get("copy") === "senior-test" ? "./senior-test-copy.html" : "./index.html",
    window.location.href,
  );

  for (const [key, value] of params) {
    if (key !== "copy") {
      destination.searchParams.set(key, value);
    }
  }
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
} else {
  await import("./app.mjs");
}
