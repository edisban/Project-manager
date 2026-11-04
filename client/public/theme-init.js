// Applies the saved colour scheme before React renders, so dark-mode users never see a light flash.
// (Kept as an external file because the Content-Security-Policy forbids inline scripts.)
(function () {
  try {
    var mode = localStorage.getItem("mui-mode") || "system";
    var dark =
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.add(dark ? "dark" : "light");
  } catch (e) {
    document.documentElement.classList.add("light");
  }
})();
